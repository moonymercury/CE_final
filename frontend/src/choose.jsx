import React, { useState } from "react";
import { encryptAndSendTicket } from "./ticket_encryption"; // 相對路徑視你的專案結構調整

const rsaPublicKeyPem = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5dpxQ1xJ546q7YDUz/jr
SZ6j2eXFVo6TfXkbPfffgRYWcjri4zayxpMY8+lsyBAHAo9zn/ioWAZqE22+9mcU
KG8zUiy4GK8UOthR3glRnh/vMlPU3w2Nqw8pa+HG5El3HpiWr6J263gsJ7lAAOxB
2hX5fRVp9CrfCdIBajXQcU8DbGbZvx7ppahcqPg2mrVQ16JpHrsSH2NaAl1uHDLT
hY96nKRjOkwVlV/7NWeJ8ut9m3WeGrtG023uIGEDg7/DiWv7NRlBKq7lRIksHV6C
1fxaP4wPgrJfCkFfhRrPpb5GV55lAV4f6pE83zJuw47Jep39bCCsptBnZSSKTnUc
6QIDAQAB
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
