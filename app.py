from flask import Flask, request, jsonify
import os
from flask import Flask, request, jsonify
import os
from flask_cors import CORS  # ← 新增這行

app = Flask(__name__)
CORS(app)  # ← 加這行就能允許所有來源 (開發用安全即可)

# 模擬資料庫
users = {}  # username -> {password, pubkey}

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data["username"]
    password = data["password"]
    pubkey = data["public_key"]
    
    if username in users:
        return jsonify({"error": "User already exists"}), 400

    users[username] = {"password": password, "public_key": pubkey}
    return jsonify({"message": "User registered successfully"}), 200

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data["username"]
    password = data["password"]
    signature = bytes.fromhex(data["signature"])
    challenge = data["challenge"]

    if username not in users or users[username]["password"] != password:
        return jsonify({"error": "Invalid credentials"}), 401

    from Crypto.PublicKey import RSA
    from Crypto.Signature import pkcs1_15
    from Crypto.Hash import SHA256

    pubkey = RSA.import_key(users[username]["public_key"])
    h = SHA256.new(challenge.encode())

    try:
        pkcs1_15.new(pubkey).verify(h, signature)
        return jsonify({"message": "Login success"}), 200
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid signature"}), 403
    
@app.route("/submit-ticket", methods=["POST"])
def submit_ticket():
    data = request.json

    # Step 1: base64 decode 加密資料
    import base64, json
    from Crypto.Cipher import AES, PKCS1_OAEP
    from Crypto.PublicKey import RSA
    from Crypto.Hash import SHA256

    encrypted_session_key = base64.b64decode(data["encryptedSessionKey"])
    ciphertext = base64.b64decode(data["ciphertext"])
    iv = base64.b64decode(data["iv"])
    aad = base64.b64decode(data["aad"])

    # Step 2: 載入私鑰並解密 session key
    with open("private.pem", "rb") as f:
        private_key = RSA.import_key(f.read())
    rsa_cipher = PKCS1_OAEP.new(private_key, hashAlgo=SHA256)
    session_key = rsa_cipher.decrypt(encrypted_session_key)

    # Step 3: 使用 AES-GCM 解密票券資料
    from Crypto.Cipher import AES
    aes_cipher = AES.new(session_key, AES.MODE_GCM, nonce=iv)
    aes_cipher.update(aad)
    try:
        plaintext = aes_cipher.decrypt_and_verify(ciphertext[:-16], ciphertext[-16:])
        ticket_info = json.loads(plaintext.decode())
        print("🎫 成功解密票券：", ticket_info)
        return jsonify({"status": "success", "ticket": ticket_info}), 200
    except Exception as e:
        return jsonify({"error": "decryption failed", "detail": str(e)}), 400

if __name__ == "__main__":
    app.run(debug=True)

app = Flask(__name__)

# 模擬資料庫
users = {}  # username -> {password, pubkey}

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data["username"]
    password = data["password"]
    pubkey = data["public_key"]
    
    if username in users:
        return jsonify({"error": "User already exists"}), 400

    users[username] = {"password": password, "public_key": pubkey}
    return jsonify({"message": "User registered successfully"}), 200

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data["username"]
    password = data["password"]
    signature = bytes.fromhex(data["signature"])
    challenge = data["challenge"]

    if username not in users or users[username]["password"] != password:
        return jsonify({"error": "Invalid credentials"}), 401

    from Crypto.PublicKey import RSA
    from Crypto.Signature import pkcs1_15
    from Crypto.Hash import SHA256

    pubkey = RSA.import_key(users[username]["public_key"])
    h = SHA256.new(challenge.encode())

    try:
        pkcs1_15.new(pubkey).verify(h, signature)
        return jsonify({"message": "Login success"}), 200
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid signature"}), 403

if __name__ == "__main__":
    app.run(debug=True)
