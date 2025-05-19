// LoginForm.jsx
import React, { useState } from "react";

function LoginForm({ privateKey, onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [uploadedKeyFile, setUploadedKeyFile] = useState(null);
  
  const handleLogin = async () => {
    let b64PrivateKey = localStorage.getItem("privateKey");

    // 若 localStorage 沒有，檢查是否有上傳
    if (!b64PrivateKey && uploadedKeyFile) {
      const fileBuffer = await uploadedKeyFile.arrayBuffer();
      b64PrivateKey = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
      localStorage.setItem("privateKey", b64PrivateKey);
    }

    if (!b64PrivateKey) {
      alert("請先註冊或上傳您的私鑰");
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
      alert("登入成功");
      onLoginSuccess(username);
    } else {
      alert("帳號或密碼錯誤");
    }
  };

  return (
    <div>
      <h2>登入</h2>
      <input placeholder="帳號" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="密碼" value={password} onChange={(e) => setPassword(e.target.value)} />
      <p>請上傳private key：</p>
      <input type="file" accept=".key" onChange={(e) => setUploadedKeyFile(e.target.files[0])} />
      <button onClick={handleLogin}>登入</button>
    </div>
  );
}

export default LoginForm;
