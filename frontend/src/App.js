import React, { useState, useEffect } from "react";
import TicketPurchaseForm from "./choose";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import SuccessPage from "./SuccessPage";
import HistoryPage from "./HistoryPage";
import TicketDetailPage from "./TicketDetailPage";
import ClaimTicketForm from "./ClaimTicket";
import "./App.css";

function App() {
  const [page, setPage] = useState("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [movieList, setMovieList] = useState([]);
  const [successData, setSuccessData] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);


  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setUsername(user); // 紀錄當前使用者
    localStorage.setItem("username", user);
    setPage("ticket");
  };

  useEffect(() => {
    fetch("/movies")
      .then(res => res.json())
      .then(setMovieList);
  }, []);


  return (
    <div className="App">
      <h1>安全購票系統</h1>
      <nav>
        {!isLoggedIn ? (
          <>
            <button onClick={() => setPage("login")}>登入</button>
            <button onClick={() => setPage("register")}>註冊</button>
          </>
        ) : (
          <button
            onClick={() => {
              localStorage.clear();            // 清空 localStorage
              setIsLoggedIn(false);            // 還原登入狀態
              setUsername("");                 // 清除帳號名
              setPage("login");                // 導回登入頁
            }}
          >
            登出
          </button>
        )}
        {isLoggedIn && (
          <>
            <button onClick={() => setPage("ticket")}>購票</button>
            <button onClick={() => {setPage("history"); setSelectedTicket(null); }}>購票紀錄</button>
            <button onClick={() => setPage("claim")}>認領票券</button>
          </>
        )}
      </nav>


      {page === "login" && (
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      )}
      {page === "register" && <RegisterForm onRegisterSuccess={() => setPage("login")} />}
      {page === "ticket" && isLoggedIn && (
        <TicketPurchaseForm
          movieList={movieList}
          onSuccess={(ticketInfo) => {
            setSuccessData(ticketInfo);
            setPage("success");
          }}
        />
      )}
      {page === "success" && <SuccessPage ticket={successData} />}
      {page === "history" && !selectedTicket && (
        <HistoryPage onSelectTicket={(ticket) => setSelectedTicket(ticket)} />
      )}

      {page === "history" && selectedTicket && (
        <TicketDetailPage
          ticket={selectedTicket}
          onBack={() => setSelectedTicket(null)}
        />
      )}
      {page === "claim" && isLoggedIn && (
        <ClaimTicketForm onSuccess={() => { setPage("history"); setSelectedTicket(null); }} />
      )}
    </div>
  );
}

export default App;
