from flask import Flask, request, jsonify
import os

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
