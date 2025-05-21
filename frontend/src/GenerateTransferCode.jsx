// GenerateTransferCode.jsx
import React, { useState } from "react";

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
      ticket_code: ticketCode,
      from: username,
      nonce: Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString()
    };

    const signature = await window.crypto.subtle.sign(
      { name: "RSASSA-PKCS1-v1_5" },
      privateKey,
      new TextEncoder().encode(JSON.stringify(payload))
    );

    const hexSig = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");

    const fullTransferCode = {
      payload,
      signature: hexSig
    };

    setTransferCode(JSON.stringify(fullTransferCode, null, 2));
  };

  return (
    <div>
      <h3>產生轉讓碼</h3>
      <button onClick={generateTransferCode}>生成</button>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", background: "#f8f8f8", padding: "1em" }}>
        {transferCode}
      </pre>
      <p>產生轉讓碼後，認領者請於10分鐘內完成轉讓</p>
    </div>
  );
}

export default GenerateTransferCode;