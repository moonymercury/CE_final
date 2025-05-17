// SuccessPage.jsx
import React from "react";
import { useSearchParams } from "react-router-dom";
import { QRCode } from "react-qrcode-logo"; // or use 'qrcode.react'

function SuccessPage() {
  const [params] = useSearchParams();
  const ticketCode = params.get("code");
  const movie = params.get("movie");
  const seat = params.get("seat");
  const amount = params.get("amount");

  const qrData = `https://yourdomain.com/verify?code=${ticketCode}`;

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h2>🎉 購票成功</h2>
      <p>請攜帶以下 QR Code 作為入場憑證</p>
      <div style={{ margin: "1.5rem auto" }}>
        <QRCode value={qrData} size={200} />
      </div>
      <div style={{ textAlign: "left", maxWidth: "300px", margin: "0 auto" }}>
        <p><strong>票券代碼：</strong>{ticketCode}</p>
        <p><strong>電影名稱：</strong>{movie}</p>
        <p><strong>座位：</strong>{seat}</p>
        <p><strong>票價：</strong>{amount} 元</p>
      </div>
    </div>
  );
}

export default SuccessPage;
