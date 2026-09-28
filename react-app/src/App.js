import React, { useState } from "react";
import Dashboard from "./pages/Dashboard";
import PerformanceLetters from "./pages/PerformanceLetters";
import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  const goToDashboard = () => {
    setActivePage("dashboard");
  };

  return (
    <div className="app">

      <header className="top-header">

        <div
          className="brand"
          onClick={goToDashboard}
        >
          <div className="brand-icon">
            P
          </div>

          <div>
            <h2>
              Performance Letter Automation
            </h2>

            <span>
              HR Management System
            </span>
          </div>
        </div>

        <div className="header-right">

          <nav className="top-navigation">

            <button
              className={
                activePage === "dashboard"
                  ? "nav-active"
                  : ""
              }
              onClick={goToDashboard}
            >
              Dashboard
            </button>

            <button
              className={
                activePage === "letters"
                  ? "nav-active"
                  : ""
              }
              onClick={() => setActivePage("letters")}
            >
              Performance Letters
            </button>

          </nav>

          <div className="acting-user">

            <span>
              Acting as
            </span>

            <strong>
              HR Admin
            </strong>

          </div>

          <div className="notification">
            🔔
          </div>

          <div className="profile">

            <div className="profile-avatar">
              HR
            </div>

            <div>

              <strong>
                HR Admin
              </strong>

              <span>
                Administrator
              </span>

            </div>

          </div>

        </div>

      </header>

      <main className="main-content">

        {activePage === "dashboard" && (
          <Dashboard
            onNavigate={setActivePage}
          />
        )}

        {activePage === "letters" && (
          <PerformanceLetters />
        )}

      </main>

    </div>
  );
}

export default App;