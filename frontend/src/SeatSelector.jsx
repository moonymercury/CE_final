import React from "react";
import "./SeatSelector.css";

const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"];
const cols = Array.from({ length: 16 }, (_, i) => i + 1);

function SeatSelector({ availableSeats, selectedSeat, onSelect }) {
  const isSeatAvailable = (code) => availableSeats.some(s => s.seat_code === code);

  return (
    <div className="seat-map">
      {rows.map(row => (
        <div key={row} className="seat-row">
          {cols.map(col => {
            const code = `${row}${col}`;
            const available = isSeatAvailable(code);
            const selected = selectedSeat === code;

            return (
              <div
                key={code}
                className={`seat ${!available ? "unavailable" : selected ? "selected" : "available"}`}
                onClick={() => available && onSelect(code)}
              >
                {code}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default SeatSelector;