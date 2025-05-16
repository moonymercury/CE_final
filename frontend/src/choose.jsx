import React, { useState } from "react";
import { encryptAndSendTicket } from "./ticket_encryption"; // 相對路徑視你的專案結構調整

const rsaPublicKeyPem = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA37vQ6u8I6d0KgEpbBV5z
Xzq3Y4VGUsKZ9HSEG30OV2TlcRndXg+jHktYn9FGv0NLXpZdydZGBMmSXGW5SW2s
6VzXKhuCsRzqW4fk4uVhqluIc33fE3bIu88ZcLlAgeBHgLvD2Mrqf2Rmg5bj5TmY
bNWw9R5LNIaTYIGLOvR7TUMSbfBTBPwXS577OQY5039Lc2c5dtimB6/VchUTix7i
VjhTKPLnoBncdwp+0JfpGGguXV+Mq3RLXGWiDba7Sh1N7cOgKzgPMFbNbjn5F7Th
pDKAS3i/2fbHv5d2pJEDEoEiD2KM3dmQEbi45DiGBFw98IX4Pvb+AUae2WEO+XPU
9wIDAQAB
-----END PUBLIC KEY-----`;

function TicketPurchaseForm({ movieList }) {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [seat, setSeat] = useState("");
  const [price, setPrice] = useState("");

  const handleSubmit = async () => {
    if (!selectedMovie || !seat || !price) {
      alert("請選擇完整資訊");
      return;
    }

    const transactionData = {
      movieId: selectedMovie.id,
      seat,
      price,
      memberId: "user123"
    };

    try {
      await encryptAndSendTicket(transactionData, rsaPublicKeyPem);
      alert("加密並送出成功！");
    } catch (err) {
      console.error("加密或送出失敗", err);
      alert("失敗，請檢查控制台");
    }
  };

  return (
    <div>
      <h2>選擇電影與座位</h2>
      
      <select onChange={(e) => setSelectedMovie(movieList.find(m => m.id === e.target.value))}>
        <option value="">請選擇電影</option>
        {movieList.map(movie => (
          <option key={movie.id} value={movie.id}>{movie.name}</option>
        ))}
      </select>

      <input
        placeholder="座位號碼 (如 A10)"
        value={seat}
        onChange={(e) => setSeat(e.target.value)}
      />

      <input
        placeholder="票價 (如 300)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        type="number"
      />

      <button onClick={handleSubmit}>確認付款</button>
    </div>
  );
}

export default TicketPurchaseForm;
