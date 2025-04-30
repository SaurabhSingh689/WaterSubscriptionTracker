import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { ref, set, update, onValue } from 'firebase/database';
import { database } from './firebase';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './App.css';

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [deliveryData, setDeliveryData] = useState({});
    const [bottlePrice, setBottlePrice] = useState(0);
    const [paidStatus, setPaidStatus] = useState({});
    const [totalBottles, setTotalBottles] = useState(0);
    const [totalBill, setTotalBill] = useState(0);


  // Fetching the initial data
  useEffect(() => {
                    const deliveryRef = ref(database, "deliveries");
                        const priceRef = ref(database, "bottlePrice");
                            const paidRef = ref(database, "paidStatus");

        onValue(deliveryRef, (snapshot) => {
          if (snapshot.exists()) {
            setDeliveryData(snapshot.val());
            calculateTotalBill(snapshot.val());
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

  // Format the date to store in Firebase
  const formatDate = (date) => {
    const local = new Date(date);
    local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return local.toISOString().split("T")[0];
  };

  // Handle delivery status (mark as delivered or skipped)
  const handleDeliveryStatus = (status) => {
    const dateKey = formatDate(selectedDate);
    update(ref(database, `deliveries/${dateKey}`), {
      status,
      price: bottlePrice,
    });
  };

  // Handle bottle price change
  const handlePriceChange = (e) => {
    const newPrice = parseFloat(e.target.value);
    setBottlePrice(newPrice);
    set(ref(database, "bottlePrice"), newPrice);
  };

    // Calculate total bottles and total bill
    const calculateTotalBill = (data) => {
        let bottles = 0;
        let bill = 0;
                                                                                                                                                                                                            for (const date in data) {
                                                                                                                                                                                                                  if (data[date].status === "Delivered") {
                                                                                                                                                                                                                          bottles++;
                                                                                                                                                                                                                                  bill += parseFloat(data[date].price);
                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                setTotalBottles(bottles);
        setTotalBill(bill);
  };

  // Get the status for a specific date
  const getStatus = (date) => {
    const key = formatDate(date);
    return deliveryData[key]?.status || "None";
  };

  // Toggle bill status (paid/unpaid)
  const handleBillPaidToggle = () => {
    const monthKey = selectedDate.toISOString().slice(0, 7);
    const isPaid = paidStatus[monthKey];
        update(ref(database, `paidStatus`), {
          [monthKey]: !isPaid,
        });
  };

  const getCurrentMonthKey = () => {
    return new Date().toISOString().slice(0, 7);
  };

  // Generate and download the PDF summary
  const generatePDF = () => {
    const doc = new jsPDF();
    const currentMonthKey = getCurrentMonthKey();
    const rows = [];
    let total = 0

    if(deliveryData){
      for (const date in deliveryData) {
        if (date.startsWith(currentMonthKey)) {
          const entry = deliveryData[date];
          if (entry.status === "Delivered") {
            rows.push([date, entry.status, `₹${entry.price}`]);
            total += parseFloat(entry.price);
          }
        }
      }
      doc.text(`Monthly Summary for ${currentMonthKey}`, 20, 10);
      doc.autoTable({ head: [["Date", "Status", "Price"]], body: rows });
      doc.text(`Total Bill: ₹${total}`, 20, doc.lastAutoTable.finalY + 10);
          const pdfDataUri = doc.output('datauristring');
              const link = document.createElement('a');
              link.href = pdfDataUri;
              link.download = `summary_${currentMonthKey}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
    }

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
          <p>Total Bottles Delivered: {totalBottles}</p>
          <p>Total Bill: ₹{totalBill}</p>
          <button onClick={generatePDF}>Download Monthly Summary</button>
          <button onClick={handleBillPaidToggle}>
            Mark Bill as {paidStatus[selectedDate.toISOString().slice(0, 7)] ? "Unpaid" : "Paid"}
          </button>
        </div>
      </div>
  );
}

export default App;