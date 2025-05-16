// RegisterForm.jsx
import React, { useState } from "react";

function RegisterForm({ onKeyGenerated }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [txPassword, setTxPassword] = useState("");
  const [status, setStatus] = useState("");

  const arrayBufferToPem = (buffer) => {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const lines = base64.match(/.{1,64}/g).join("\n");
    return `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----`;
  };

  const handleRegister = async () => {
    setStatus("🔐 產生金鑰中...");
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    );

    const spki = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const pemPublicKey = arrayBufferToPem(spki);

    setStatus("📤 傳送註冊資訊...");
    const res = await fetch("http://localhost:5000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        tx_password: txPassword,
        public_key: pemPublicKey,
      }),
    });

    const result = await res.json();
    if (res.ok) {
        alert("✅ 註冊成功");
        const pkcs8 = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
        localStorage.setItem("privateKey", btoa(String.fromCharCode(...new Uint8Array(pkcs8))));
    } else {
      alert("❌ 註冊失敗：" + result.error);
    }
    setStatus("");
  };

  return (
    <div>
      <h2>📝 註冊帳號</h2>
      <input placeholder="帳號" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="登入密碼" value={password} onChange={(e) => setPassword(e.target.value)} />
      <input type="password" placeholder="交易密碼" value={txPassword} onChange={(e) => setTxPassword(e.target.value)} />
      <button onClick={handleRegister}>註冊</button>
      <p>{status}</p>
    </div>
  );
}

export default RegisterForm;