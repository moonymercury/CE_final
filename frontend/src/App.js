import React, { useState } from "react";
import TicketPurchaseForm from "./choose";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

function App() {
  const [page, setPage] = useState("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setUsername(user); // 若你要紀錄當前使用者
    setPage("ticket");
  };

  return (
    <div className="App">
      <h1>🎟️ 安全購票系統</h1>
      <nav>
        <button onClick={() => setPage("login")}>登入</button>
        <button onClick={() => setPage("register")}>註冊</button>
        <button
          onClick={() => setPage("ticket")}
          disabled={!isLoggedIn}
          style={{ opacity: isLoggedIn ? 1 : 0 }}
        >
          購票
        </button>
      </nav>

      {page === "login" && (
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      )}
      {page === "register" && <RegisterForm />}
      {page === "ticket" && isLoggedIn && (
        <TicketPurchaseForm movieList={[
          { id: "m001", name: "Inception" },
          { id: "m002", name: "Interstellar" },
          { id: "m003", name: "Oppenheimer" },
        ]} />
      )}
    </div>
  );
}

export default App;
