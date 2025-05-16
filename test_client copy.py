import requests
from Crypto.PublicKey import RSA
from Crypto.Signature import pkcs1_15
from Crypto.Hash import SHA256

# Step 1: 讀取 public.pem 作為上傳的公開金鑰
with open("public.pem", "r") as f:
    public_key_pem = f.read()

# Step 2: 註冊帳號
register_response = requests.post("http://localhost:5000/register", json={
    "username": "alice",
    "password": "123456",
    "public_key": public_key_pem
})
print("Register:", register_response.json())

# Step 3: 用 private.pem 對 challenge 簽章
challenge = "login-auth-verify"
with open("private.pem", "r") as f:
    private_key = RSA.import_key(f.read())

h = SHA256.new(challenge.encode())
signature = pkcs1_15.new(private_key).sign(h)

# Step 4: 登入（驗證簽章 + 密碼）
login_response = requests.post("http://localhost:5000/login", json={
    "username": "alice",
    "password": "123456",
    "challenge": challenge,
    "signature": signature.hex()
})
print("Login:", login_response.json())
