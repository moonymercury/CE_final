import React, { useState } from "react";

function ClaimTicketForm({ onSuccess }) {
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [ticketCode, setTicketCode] = useState("");
  const [transferCode, setTransferCode] = useState("");

  const handleClaim = async () => {
    try {

      const res = await fetch("/claim-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: transferCode, username })  // B 的 username
      });

      const result = await res.json();
      if (res.ok) {
        alert("認領成功：" + result.ticket_code);
        onSuccess();
      } else {
        alert("認領失敗：" + result.error);
      }
    } catch (err) {
      alert("轉讓碼格式錯誤");
    }
  };

  return (
    <div>
      <h2>認領票券</h2>
      <input placeholder="票券代碼" value={ticketCode} onChange={(e) => setTicketCode(e.target.value)} />
      <textarea
        placeholder="請輸入轉讓碼"
        rows={3}
        style={{ width: "100%" }}
        value={transferCode}
        onChange={(e) => setTransferCode(e.target.value)}
      />
      <button onClick={handleClaim}>認領</button>
    </div>
  );
}

export default ClaimTicketForm;