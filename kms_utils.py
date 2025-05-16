from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
from base64 import b64decode

def request_kms_decryption(encrypted_key_b64):
    with open("kms_private.pem", "r") as f:
        kms_key = RSA.import_key(f.read())
    cipher = PKCS1_v1_5.new(kms_key)
    return cipher.decrypt(b64decode(encrypted_key_b64), None)
