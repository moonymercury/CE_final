from flask import Flask, request, jsonify
from models import db, app, User, Ticket, MovieSeat
import os
from flask_cors import CORS
from kms_utils import request_kms_decryption
import bcrypt
from Crypto.Signature import pkcs1_15
from Crypto.Hash import SHA256
from Crypto.PublicKey import RSA
import random, string
from flask import redirect
from datetime import datetime, timedelta, timezone
from models import TransferCodeStore, TransferLog
import json

CORS(app)  # 允許所有來源

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
    
    # Step 1: decode base64
    encrypted_session_key = base64.b64decode(data["encryptedSessionKey"])
    ciphertext = base64.b64decode(data["ciphertext"])
    iv = base64.b64decode(data["iv"])
    aad = base64.b64decode(data["aad"])
    signature = data["signature"]

    # Step 2: 使用 AWS KMS 解密 session key
    try:
        kms = boto3.client("kms", region_name="ap-southeast-2")  # 改成你的區域
        response = kms.decrypt(CiphertextBlob=encrypted_session_key)
        session_key = response["Plaintext"]
    except Exception as e:
        return jsonify({"error": "KMS 解密失敗", "detail": str(e)}), 500
    
    # Step 3: 解密交易資料
    try:
        aes_cipher = AES.new(session_key, AES.MODE_GCM, nonce=iv)
        aes_cipher.update(aad)
        plaintext = aes_cipher.decrypt_and_verify(ciphertext[:-16], ciphertext[-16:])
        transaction_payload = plaintext.decode()
        transaction_data = json.loads(transaction_payload)
    except Exception as e:
        return jsonify({"error": "資料解密失敗", "detail": str(e)}), 400

    # Step 4: 從解密內容中取出帳號與密碼，查詢使用者
    username = transaction_data.get("username")
    tx_password = transaction_data.get("tx_password")

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "找不到使用者"}), 404

    if not bcrypt.checkpw(tx_password.encode(), user.tx_password_hash):
        return jsonify({"error": "交易密碼錯誤"}), 401

    # Step 5: 驗證簽章（必須針對原始明文做簽章驗證）
    try:
        pubkey = RSA.import_key(user.public_key)
        h = SHA256.new(transaction_payload.encode())
        if isinstance(signature, str):
            signature_bytes = bytes.fromhex(signature)
        else:
            signature_bytes = signature
        pkcs1_15.new(pubkey).verify(h, signature_bytes)

    except Exception as e:
        return jsonify({"error": "簽章驗證失敗", "detail": str(e)}), 403

    # Step 6: 查詢票券資訊
    try:
        # 查詢場次與座位
        seat_entry = MovieSeat.query.filter_by(
            movie=transaction_data["movie"],
            showtime=transaction_data["showtime"],
            seat_code=transaction_data["seat"]
        ).first()
        if not seat_entry or seat_entry.status != "available":
            return jsonify({"error": "座位已售出或不存在"}), 400

        if user.balance < seat_entry.price:
            return jsonify({"error": "餘額不足", "balance": str(user.balance)}), 400
        # 建立票券
        ticket_code = "TICKET-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        qr_code = "QR-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=32))  # longer random
        ticket = Ticket(
            code=ticket_code,
            qr_code=qr_code,
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
            "qr_code": qr_code,
            "movie": ticket.movie,
            "seat": ticket.seat,
            "amount": ticket.amount,
            "balance": user.balance
        })
    except Exception as e:
        return jsonify({"error": "交易失敗", "detail": str(e)}), 500
    
@app.route("/kms/encrypt", methods=["POST"])
def encrypt_session_key():
    import boto3, base64
    kms = boto3.client("kms", region_name="ap-southeast-2")
    data = request.json
    raw_key = base64.b64decode(data["session_key"])

    response = kms.encrypt(
        KeyId="alias/session-key",  # KMS key alias 或 key ID
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

@app.route("/history", methods=["POST"])
def get_purchase_history():
    data = request.json
    username = data.get("username")
    signature = data.get("signature")

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "找不到使用者"}), 404

    # 驗證簽章
    try:
        from Crypto.Signature import pkcs1_15
        from Crypto.PublicKey import RSA
        from Crypto.Hash import SHA256

        pubkey = RSA.import_key(user.public_key)
        h = SHA256.new(username.encode())  # 對 username 字串簽章驗證
        pkcs1_15.new(pubkey).verify(h, bytes.fromhex(signature))
    except Exception:
        return jsonify({"error": "簽章驗證失敗"}), 403

    tickets = Ticket.query.filter_by(user_id=user.id).all()
    return jsonify([
        {
            "code": t.code,
            "qr_code": t.qr_code,
            "movie": t.movie,
            "seat": t.seat,
            "amount": t.amount
        } for t in tickets
    ])
    
@app.route("/claim-ticket", methods=["POST"])
def claim_ticket():
    data = request.json
    username = data["username"]
    code = data["code"]

    store = TransferCodeStore.query.get(code)
    if not store:
        return jsonify({"error": "無此轉讓碼"}), 404

    payload = json.loads(store.payload)
    signature = store.signature

    from_user = payload["f"]
    ticket_code = payload["c"]
    nonce = payload["n"]
    timestamp = payload["t"]

    user = User.query.filter_by(username=from_user).first()
    if not user:
        return jsonify({"error": "無原持有人"}), 404

    try:
        payload_str = json.dumps(payload, separators=(",", ":"))
        print("🔍 後端驗章 payload_str =", payload_str)
        pubkey = RSA.import_key(user.public_key)
        h = SHA256.new(json.dumps(payload, separators=(",", ":")).encode())
        import base64

        def pad_base64url(s):
            return s + "=" * (-len(s) % 4)

        sig_bytes = base64.urlsafe_b64decode(pad_base64url(signature))
        pkcs1_15.new(pubkey).verify(h, sig_bytes)
    except Exception as e:
        print("驗章失敗，簽章前 20 =", signature[:20])
        print("驗章失敗，錯誤訊息 =", str(e))
        return jsonify({"error": "簽章驗證失敗"}), 403

    ticket = Ticket.query.filter_by(code=ticket_code).first()
    if not ticket or ticket.user_id != user.id:
        return jsonify({"error": "票券不存在或非該用戶擁有"}), 400

    if ticket.status != "valid":
        return jsonify({"error": "票券已使用或無效"}), 400

    if TransferLog.query.filter_by(ticket_code=ticket_code).first():
        return jsonify({"error": "票券已被認領"}), 400

    recipient = User.query.filter_by(username=username).first()
    if not recipient:
        return jsonify({"error": "使用者不存在"}), 404
    
    transfer_time = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    claim_time = datetime.now(timezone.utc)
    if claim_time - transfer_time > timedelta(minutes=10):
        return jsonify({"error": "轉讓碼已過期"}), 403
    
    if TransferLog.query.filter_by(nonce=nonce).first():
        return jsonify({"error": "此轉讓碼已使用"}), 400

    # 更新票券持有人
    ticket.user_id = recipient.id
    db.session.commit()

    # 寫入轉讓紀錄
    log = TransferLog(
        ticket_code=ticket_code,
        from_user=from_user,
        to_user=username,
        nonce=nonce,
        signature=signature,
        timestamp=timestamp
    )
    db.session.add(log)
    db.session.commit()

    # 最後刪掉已用過的轉讓碼
    db.session.delete(store)
    db.session.commit()

    return jsonify({"message": "認領成功", "ticket_code": ticket_code})

@app.route("/store-transfer", methods=["POST"])
def store_transfer():
    data = request.json
    code = data["code"]
    payload = json.dumps(data["payload"])
    signature = data["signature"]

    if TransferCodeStore.query.get(code):
        return jsonify({"error": "代碼已存在"}), 400

    entry = TransferCodeStore(code=code, payload=payload, signature=signature)
    db.session.add(entry)
    db.session.commit()
    print("🔍 後端收到簽章前20 =", signature[:20])
    return jsonify({"message": "儲存成功"})

if __name__ == "__main__":
    app.run(debug=True)
