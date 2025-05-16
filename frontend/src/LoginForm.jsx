// LoginForm.jsx
import React, { useState } from "react";

function LoginForm({ privateKey, onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const b64PrivateKey = localStorage.getItem("privateKey");
    if (!b64PrivateKey) {
      alert("❗ 尚未生成私鑰，請先註冊");
      return;
    }
    const raw = Uint8Array.from(atob(b64PrivateKey), c => c.charCodeAt(0));
    const privateKey = await window.crypto.subtle.importKey(
        "pkcs8",
        raw,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const challenge = "login-auth-verify";
    const encoder = new TextEncoder();
    const data = encoder.encode(challenge);

    const signature = await window.crypto.subtle.sign(
      { name: "RSASSA-PKCS1-v1_5" },
      privateKey,
      data
    );

    const hexSignature = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const res = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, challenge, signature: hexSignature }),
    });

    const result = await res.json();
    if (res.ok) {
      alert("✅ 登入成功");
      onLoginSuccess(username);
    } else {
      alert("❌ 登入失敗：" + result.error);
    }
  };

  return (
    <div>
      <h2>🔐 登入</h2>
      <input placeholder="帳號" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="密碼" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleLogin}>登入</button>
    </div>
  );
}

export default LoginForm;
