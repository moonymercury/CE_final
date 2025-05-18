import React, { useState, useEffect } from "react";
import { encryptAndSendTicket } from "./ticket_encryption";
import SeatSelector from "./SeatSelector";

function TicketPurchaseForm({ movieList }) {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedShowtime, setSelectedShowtime] = useState("");
  const [availableSeats, setAvailableSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState("");
  const [price, setPrice] = useState("");
  const [txPassword, setTxPassword] = useState("");

  useEffect(() => {
    if (selectedMovie) {
      fetch(`/showtimes?movie=${encodeURIComponent(selectedMovie.name)}`)
        .then(res => res.json())
        .then(setShowtimes);
    }
  }, [selectedMovie]);

  useEffect(() => {
    if (selectedMovie && selectedShowtime) {
      fetch(`/seats?movie=${encodeURIComponent(selectedMovie.name)}&showtime=${encodeURIComponent(selectedShowtime)}`)
        .then(res => res.json())
        .then(seats => {
          setAvailableSeats(seats);
          setSelectedSeat("");
          setPrice("");
        });
    }
  }, [selectedShowtime]);

  const handleSubmit = async () => {
    if (!selectedMovie || !selectedShowtime || !selectedSeat || !price) {
      alert("請選擇完整資訊");
      return;
    }

    if (!localStorage.getItem("username")) {
      alert("請先登入再購票！");
      return;
    }

    const transactionData = {
      movie: selectedMovie.name,
      showtime: selectedShowtime,
      seat: selectedSeat,
      price,
      username: localStorage.getItem("username"),
      tx_password: txPassword
    };

    try {
      await encryptAndSendTicket(transactionData);
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

      {showtimes.length > 0 && (
        <select onChange={(e) => setSelectedShowtime(e.target.value)} value={selectedShowtime}>
          <option value="">請選擇場次</option>
          {showtimes.map((t, i) => (
            <option key={i} value={t}>{t}</option>
          ))}
        </select>
      )}

      {availableSeats.length > 0 && (
        <SeatSelector
          availableSeats={availableSeats}
          selectedSeat={selectedSeat}
          onSelect={(code) => {
            setSelectedSeat(code);
            const seat = availableSeats.find(s => s.seat_code === code);
            setPrice(seat?.price || "");
          }}
        />
      )}

      <p>票價：{price ? `${price} 元` : "請選擇座位"}</p>

      <input
        type="password"
        placeholder="交易密碼"
        value={txPassword}
        onChange={(e) => setTxPassword(e.target.value)}
      />

      <button onClick={handleSubmit}>確認付款</button>
    </div>
  );
}

export default TicketPurchaseForm;
