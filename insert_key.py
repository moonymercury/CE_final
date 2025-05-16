# insert_key.py
pem_path = "public.pem"
jsx_path = "frontend/src/choose.jsx"

# 讀取公鑰
with open(pem_path, "r") as f:
    public_key_pem = f.read().strip()

# 格式化為 JS 字串
formatted_key = "`" + public_key_pem + "`"

# 替換 choose.jsx 裡的 rsaPublicKeyPem
with open(jsx_path, "r", encoding="utf-8") as f:
    jsx_code = f.read()

import re
pattern = r'const rsaPublicKeyPem = `-----BEGIN PUBLIC KEY-----[\s\S]*?-----END PUBLIC KEY-----`'
new_code = f'const rsaPublicKeyPem = {formatted_key}'

updated = re.sub(pattern, new_code, jsx_code)

with open(jsx_path, "w", encoding="utf-8") as f:
    f.write(updated)

print("✅ 公鑰已成功插入 choose.jsx")
