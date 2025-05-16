import React from "react";
import TicketPurchaseForm from "./choose"; // 確保 choose.jsx 已 export default
import "./App.css";

// 假資料模擬電影清單
const movieList = [
  { id: "m001", name: "Inception" },
  { id: "m002", name: "Interstellar" },
  { id: "m003", name: "Oppenheimer" },
];

function App() {
  return (
    <div className="App">
      <h1>🎟️ 安全購票系統</h1>
      <TicketPurchaseForm movieList={movieList} />
    </div>
  );
}

export default App;
