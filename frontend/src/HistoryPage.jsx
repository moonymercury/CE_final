import React, { useEffect, useState } from "react";

function HistoryPage({ onSelectTicket }) {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (username) {
      fetch(`/history/${username}`)
        .then(async (res) => {
          if (!res.ok) {
            const errJson = await res.json();
            throw new Error(errJson.error || "取得紀錄失敗");
          }
          return res.json();
        })
        .then(setTickets)
        .catch((err) => {
          setError("無法載入購票紀錄：" + err.message);
        });
    }
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
