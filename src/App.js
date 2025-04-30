import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { ref, set, update, onValue } from "firebase/database";
import { database } from "./firebase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./App.css";

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [deliveryData, setDeliveryData] = useState({});
  const [bottlePrice, setBottlePrice] = useState(0);
  const [paidStatus, setPaidStatus] = useState({});

  useEffect(() => {
    const deliveryRef = ref(database, "deliveries");
    const priceRef = ref(database, "bottlePrice");
    const paidRef = ref(database, "paidStatus");

    onValue(deliveryRef, (snapshot) => {
      if (snapshot.exists()) {
        setDeliveryData(snapshot.val());
      }
    });

    onValue(priceRef, (snapshot) => {
      if (snapshot.exists()) {
        setBottlePrice(snapshot.val());
      }
    });

    onValue(paidRef, (snapshot) => {
      if (snapshot.exists()) {
        setPaidStatus(snapshot.val());
      }
    });
  }, []);

  const formatDate = (date) => {
    const local = new Date(date);
    local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return local.toISOString().split("T")[0];
  };

  const handleDeliveryStatus = (status) => {
    const dateKey = formatDate(selectedDate);
    update(ref(database, `deliveries/${dateKey}`), {
      status,
      price: bottlePrice,
    });
  };

  const handlePriceChange = (e) => {
    const newPrice = parseFloat(e.target.value);
    setBottlePrice(newPrice);
    set(ref(database, "bottlePrice"), newPrice);
  };

  const getStatus = (date) => {
    const key = formatDate(date);
    return deliveryData[key]?.status || "None";
  };

  const handleBillPaidToggle = () => {
    const monthKey = selectedDate.toISOString().slice(0, 7);
    const isPaid = paidStatus[monthKey];
    update(ref(database, "paidStatus"), {
      [monthKey]: !isPaid,
    });
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const monthKey = selectedDate.toISOString().slice(0, 7);
    const rows = [];
    let total = 0;

    for (const date in deliveryData) {
      if (date.startsWith(monthKey)) {
        const entry = deliveryData[date];
        if (entry.status === "Delivered") {
          rows.push([date, entry.status, `₹${entry.price}`]);
          total += parseFloat(entry.price);
        }
      }
    }

    doc.text(`Monthly Summary for ${monthKey}`, 20, 10);
    autoTable(doc, {
      head: [["Date", "Status", "Price"]],
      body: rows,
      startY: 20
    });
    doc.text(`Total Bill: ₹${total}`, 20, doc.autoTable.previous.finalY + 10);
    doc.save(`summary_${monthKey}.pdf`);
  };

  return (
    <div className="App">
      <h2>Water Bottle Subscription Tracker</h2>
      <Calendar onChange={setSelectedDate} value={selectedDate} />
      <p>Selected Date: {formatDate(selectedDate)}</p>
      <p>Status: {getStatus(selectedDate)}</p>

      <div className="button-group">
        <button onClick={() => handleDeliveryStatus("Delivered")}>Mark Delivered</button>
        <button onClick={() => handleDeliveryStatus("Skipped")}>Mark Skipped</button>
      </div>

      <div className="price-input">
        <label>Bottle Price: ₹</label>
        <input type="number" value={bottlePrice} onChange={handlePriceChange} />
      </div>

      <div className="monthly-summary">
        <button onClick={generatePDF}>Download Monthly Summary</button>
        <button onClick={handleBillPaidToggle}>
          Mark Bill as {paidStatus[selectedDate.toISOString().slice(0, 7)] ? "Unpaid" : "Paid"}
        </button>
      </div>
    </div>
  );
}

export default App;