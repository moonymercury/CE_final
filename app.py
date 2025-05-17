from flask import Flask, request, jsonify
from models import db, app, User, Ticket, MovieSeat
import os
from flask_cors import CORS  # ← 新增這行
from kms_utils import request_kms_decryption
import bcrypt
from Crypto.Signature import pkcs1_15
from Crypto.Hash import SHA256
from Crypto.PublicKey import RSA
import random, string
from flask import redirect

CORS(app)  # ← 加這行就能允許所有來源 (開發用安全即可)

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data["username"]
    password = data["password"]
    tx_password = data["tx_password"]
    public_key = data["public_key"]

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "User exists"}), 400

    user = User(
        username=username,
        password_hash=bcrypt.hashpw(password.encode(), bcrypt.gensalt()),
        tx_password_hash=bcrypt.hashpw(tx_password.encode(), bcrypt.gensalt()),
        public_key=public_key
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "Registered"})

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data["username"]
    password = data["password"]
    signature = data["signature"]
    challenge = data["challenge"]

    user = User.query.filter_by(username=username).first()
    if not user or not bcrypt.checkpw(password.encode(), user.password_hash):
        return jsonify({"error": "Invalid credentials"}), 401

    # 嘗試將 signature 解成 bytes（支援 hex 或 base64）
    try:
        if all(c in "0123456789abcdefABCDEF" for c in signature.strip()):  # hex
            signature_bytes = bytes.fromhex(signature)
        else:  # base64 fallback
            import base64
            signature_bytes = base64.b64decode(signature)
    except Exception as e:
        return jsonify({"error": "Invalid signature format", "detail": str(e)}), 400

    try:
        pubkey = RSA.import_key(user.public_key)
        h = SHA256.new(challenge.encode())
        pkcs1_15.new(pubkey).verify(h, signature_bytes)
        return jsonify({"message": "Login success"}), 200
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid signature"}), 403

@app.route("/submit-ticket", methods=["POST"])
def submit_ticket():
    import base64, json
    import boto3
    from Crypto.Cipher import AES
    from flask import request, jsonify

    data = request.json
    print("🔑 收到的資料：", data)
    username = data["username"]
    tx_password = data["tx_password"]
    signature = data["signature"]
    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({"error": "找不到使用者"}), 404

    if not bcrypt.checkpw(tx_password.encode(), user.tx_password_hash):
        return jsonify({"error": "交易密碼錯誤", "tx_password": str(tx_password.encode()), "user.tx_password_hash": str(user.tx_password_hash)}), 401

    # 驗證簽章
    try:
        pubkey = RSA.import_key(user.public_key)
        h = SHA256.new(data["transactionPayload"].encode())
        pkcs1_15.new(pubkey).verify(h, bytes.fromhex(signature))
    except Exception as e:
        return jsonify({"error": "簽章驗證失敗", "detail": str(e)}), 403

    # Step 1: decode base64
    encrypted_session_key = base64.b64decode(data["encryptedSessionKey"])
    ciphertext = base64.b64decode(data["ciphertext"])
    iv = base64.b64decode(data["iv"])
    aad = base64.b64decode(data["aad"])

    # Step 2: 使用 AWS KMS 解密 session key
    try:
        kms = boto3.client("kms", region_name="ap-southeast-2")  # 改成你的區域
        response = kms.decrypt(CiphertextBlob=encrypted_session_key)
        session_key = response["Plaintext"]
    except Exception as e:
        return jsonify({"error": "KMS 解密失敗", "detail": str(e)}), 500

    # Step 3: 用 session key 解密票券資料（AES-GCM）
    try:
        aes_cipher = AES.new(session_key, AES.MODE_GCM, nonce=iv)
        aes_cipher.update(aad)
        plaintext = aes_cipher.decrypt_and_verify(ciphertext[:-16], ciphertext[-16:])
        ticket_info = json.loads(plaintext.decode())
        print("🎫 成功解密票券：", ticket_info)
        # Step 4: 驗證票券資料，檢查票券是否存在
        # 取得使用者
        user = User.query.filter_by(username=ticket_info["username"]).first()
        if not user:
            return jsonify({"error": "找不到使用者"}), 404

        # 查詢場次與座位
        seat_entry = MovieSeat.query.filter_by(
            movie=ticket_info["movie"],
            showtime=ticket_info["showtime"],
            seat_code=ticket_info["seat"]
        ).first()
        if not seat_entry or seat_entry.status != "available":
            return jsonify({"error": "座位已售出或不存在"}), 400

        if user.balance < seat_entry.price:
            return jsonify({"error": "餘額不足", "balance": str(user.balance)}), 400
        # 建立票券
        ticket_code = "TICKET-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        ticket = Ticket(
            code=ticket_code,
            user_id=user.id,
            movie=seat_entry.movie,
            seat=seat_entry.seat_code,
            amount=seat_entry.price
        )

        # 更新資料庫：扣款、座位狀態、儲存票券
        user.balance -= seat_entry.price
        seat_entry.status = "sold"
        db.session.add(ticket)
        db.session.commit()
        return jsonify({
            "success": True,
            "ticket_code": ticket_code,
            "movie": ticket.movie,
            "seat": ticket.seat,
            "amount": ticket.amount
        })
    
    except Exception as e:
        return jsonify({"error": "資料解密失敗", "detail": str(e)}), 400
    
@app.route("/kms/encrypt", methods=["POST"])
def encrypt_session_key():
    import boto3, base64
    kms = boto3.client("kms", region_name="ap-southeast-2")
    data = request.json
    raw_key = base64.b64decode(data["session_key"])

    response = kms.encrypt(
        KeyId="alias/session-key",  # 替換成你的 KMS key alias 或 key ID
        Plaintext=raw_key
    )

    encrypted_key = base64.b64encode(response["CiphertextBlob"]).decode()
    return jsonify({ "encrypted_session_key": encrypted_key })

@app.route("/seats", methods=["GET"])
def get_available_seats():
    movie = request.args.get("movie")
    showtime = request.args.get("showtime")

    if not movie or not showtime:
        return jsonify({"error": "需要提供 movie 與 showtime 參數"}), 400

    seats = MovieSeat.query.filter_by(
        movie=movie,
        showtime=showtime,
        status="available"
    ).all()

    result = [
        {
            "seat_code": seat.seat_code,
            "price": seat.price
        }
        for seat in seats
    ]
    return jsonify(result)

@app.route("/showtimes", methods=["GET"])
def get_showtimes_by_movie():
    movie = request.args.get("movie")
    if not movie:
        return jsonify({"error": "請提供 movie 參數"}), 400

    showtimes = db.session.query(MovieSeat.showtime).filter_by(movie=movie).distinct().all()
    return jsonify([s[0] for s in showtimes])

@app.route("/movies")
def get_movies():
    from models import MovieSeat
    movie_names = db.session.query(MovieSeat.movie).distinct().all()
    return jsonify([
        {"id": m.movie, "name": m.movie} for m in movie_names
    ])

if __name__ == "__main__":
    app.run(debug=True)
