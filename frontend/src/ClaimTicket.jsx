import React, { useState } from "react";

function ClaimTicketForm() {
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [ticketCode, setTicketCode] = useState("");
  const [transferJson, setTransferJson] = useState("");

  const handleClaim = async () => {
    try {
      const { payload, signature } = JSON.parse(transferJson);
      const res = await fetch("http://localhost:5000/claim-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          payload,
          signature
        })
      });

      const result = await res.json();
      if (res.ok) {
        alert("✅ 認領成功：" + result.ticket_code);
      } else {
        alert("❌ 認領失敗：" + result.error);
      }
    } catch (err) {
      alert("轉讓碼格式錯誤");
    }
  };

  return (
    <div>
      <h2>🎫 認領票券</h2>
      <input placeholder="票券代碼" value={ticketCode} onChange={(e) => setTicketCode(e.target.value)} />
      <textarea placeholder="請貼上轉讓碼 JSON" rows={6} style={{ width: "100%" }} value={transferJson} onChange={(e) => setTransferJson(e.target.value)} />
      <button onClick={handleClaim}>認領</button>
    </div>
  );
}

export default ClaimTicketForm;