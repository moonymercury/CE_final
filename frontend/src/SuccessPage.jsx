import React from "react";
import { QRCode } from "react-qrcode-logo";

function SuccessPage({ ticket }) {
  if (!ticket) return <p>無票券資料。</p>;

  const { code, qr, movie, seat, amount, balance } = ticket;
  const qrData = `${qr}`;
  console.log("SuccessPage props", ticket);
  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h2>購票成功</h2>
      <p>請攜帶以下 QR Code 作為入場憑證</p>
      <div style={{ margin: "1.5rem auto" }}>
        <QRCode value={qrData} size={200} />
      </div>
      
      <div style={{ textAlign: "left", maxWidth: "300px", margin: "0 auto" }}>
        <p><strong>票券代碼：</strong>{code}</p>
        <p><strong>電影名稱：</strong>{movie}</p>
        <p><strong>座位：</strong>{seat}</p>
        <p><strong>票價：</strong>{amount} 元</p>
        <p><strong>儲值金餘額：</strong>{balance} 元</p>
      </div>
    </div>
  );
}

export default SuccessPage;