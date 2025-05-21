import React, { useEffect, useState } from "react";

function HistoryPage({ onSelectTicket }) {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");

    async function fetchHistoryWithSignature(username) {
    const privateKeyRaw = localStorage.getItem("privateKey");
    const raw = Uint8Array.from(atob(privateKeyRaw), c => c.charCodeAt(0));
    const privateKey = await window.crypto.subtle.importKey(
      "pkcs8", raw,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await window.crypto.subtle.sign(
      { name: "RSASSA-PKCS1-v1_5" },
      privateKey,
      new TextEncoder().encode(username)
    );

    const hexSig = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    const res = await fetch("http://localhost:5000/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, signature: hexSig })
    });

    return await res.json();
  }

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      setError("找不到使用者名稱");
      return;
    }

    fetchHistoryWithSignature(username)
      .then((res) => {
        if (res.error) throw new Error(res.error);
        setTickets(res);
      })
      .catch((err) => {
        setError("無法載入購票紀錄：" + err.message);
      });
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>購票記錄</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {tickets.length === 0 ? (
        <p>目前沒有購票紀錄。</p>
      ) : (
        <ul>
          {tickets.map((t, i) => (
            <li
              key={i}
              style={{ cursor: "pointer", margin: "0.5rem 0" }}
              onClick={() => onSelectTicket(t)}
            >
              {t.movie} | {t.seat} | {t.amount} 元 | 票券代碼: {t.code}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


export default HistoryPage;