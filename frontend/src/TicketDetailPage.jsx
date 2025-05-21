// TicketDetailPage.jsx
import React from "react";
import { QRCode } from "react-qrcode-logo"; // or "react-qrcode-logo"
import GenerateTransferCode from "./GenerateTransferCode";

function TicketDetailPage({ ticket, onBack }) {
  if (!ticket) return <p>無票券資料</p>;

  const { code, qr_code, movie, seat, amount } = ticket;
  const qrData = `${qr_code}`;

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h2>票券詳細資料</h2>
      <QRCode value={qrData} size={200} />
      <div style={{ textAlign: "left", maxWidth: "300px", margin: "1.5rem auto" }}>
        <p><strong>票券代碼：</strong>{code}</p>
        <p><strong>電影：</strong>{movie}</p>
        <p><strong>座位：</strong>{seat}</p>
        <p><strong>票價：</strong>{amount} 元</p>
      </div>
      <GenerateTransferCode ticketCode={code} />
      <button onClick={onBack}>返回紀錄列表</button>
    </div>
  );
}

export default TicketDetailPage;
