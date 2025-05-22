import React, { useState } from "react";

// 短碼生成器（長度控制在 16）
function generateShortCode(length = 16) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "TC-" + Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary)
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function GenerateTransferCode({ ticketCode }) {
  const [transferCode, setTransferCode] = useState("");

  const generateTransferCode = async () => {
    const username = localStorage.getItem("username");
    const privateKeyRaw = localStorage.getItem("privateKey");
    if (!privateKeyRaw) {
      alert("找不到私鑰，請重新登入");
      return;
    }

    const raw = Uint8Array.from(atob(privateKeyRaw), c => c.charCodeAt(0));
    const privateKey = await window.crypto.subtle.importKey(
      "pkcs8", raw,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const payload = {
      c: ticketCode,
      f: username,
      n: Math.random().toString(36).slice(2),
      t: new Date().toISOString()
    };

    const encodedPayload = JSON.stringify(payload);
    const signature = await window.crypto.subtle.sign(
      { name: "RSASSA-PKCS1-v1_5" },
      privateKey,
      new TextEncoder().encode(encodedPayload)
    );

    const base64Sig = arrayBufferToBase64(signature);

    const shortCode = generateShortCode();

    console.log("🔍 前端簽章 payload =", encodedPayload);
    console.log("🔍 簽章 base64 =", base64Sig.slice(0, 20));


    // 傳送到後端儲存
    const res = await fetch("http://localhost:5000/store-transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: shortCode,
        payload,
        signature: base64Sig
      })
    });

    const result = await res.json();
    if (res.ok) {
      setTransferCode(shortCode);
    } else {
      alert("儲存失敗：" + result.error);
    }
  };

  return (
    <div>
      <h3>產生轉讓碼</h3>
      <button onClick={generateTransferCode}>生成</button>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", background: "#f8f8f8", padding: "1em" }}>
        {transferCode}
      </pre>
      <p>請將轉讓代碼及票券代碼提供給接收者，在 10 分鐘內完成認領</p>
    </div>
  );
}

export default GenerateTransferCode;
