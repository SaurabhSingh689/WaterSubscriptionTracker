import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { ref, update, onValue } from 'firebase/database';
import { database } from './firebase';
import './App.css';

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [deliveryData, setDeliveryData] = useState({});
  const [bottlePrice, setBottlePrice] = useState(0);
  const [totalBottles, setTotalBottles] = useState(0);
  const [paidStatus, setPaidStatus] = useState({});
  const [deliveryDates, setDeliveryDates] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [monthWiseTotalBill, setMonthWiseTotalBill] = useState({});
  const [monthWiseTotalBottles, setMonthWiseTotalBottles] = useState({});


  useEffect(() => {
    const deliveryRef = ref(database, 'deliveries');
    const priceRef = ref(database, 'bottlePrice');
    const paidRef = ref(database, 'paidStatus');

    onValue(deliveryRef, (snapshot) => {
      if (snapshot.exists()) {
        setDeliveryData(snapshot.val());
        const monthKey = getCurrentMonthKey();
        calculateTotalBill(snapshot.val(), monthKey);
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
    return local.toISOString().split('T')[0];
  };

  const handleDeliveryStatus = (status) => {
    const dateKey = formatDate(selectedDate);
    update(ref(database, `deliveries/${dateKey}`), { status, price: bottlePrice });
  };

  const handlePriceChange = (e) => {
    const newPrice = parseFloat(e.target.value);
    setBottlePrice(newPrice);
    update(ref(database, 'bottlePrice'), newPrice);
  };

  const calculateTotalBill = (data, monthKey) => {
    let bottles = 0;
    let bill = 0;
    const monthData = {};

    for (const key in data) {
      if (key.startsWith(monthKey)) {
        monthData[key] = data[key];
      }
    }

    if (paidStatus[monthKey]) {
      setMonthWiseTotalBill((prevBill) => ({ ...prevBill, [monthKey]: 0 }));
      setMonthWiseTotalBottles((prevBottles) => ({ ...prevBottles, [monthKey]: 0 }));
    } else {
      for (const date in monthData) {
        if (monthData[date].status === 'Delivered') {
          bottles++;
          bill += parseFloat(monthData[date].price);
        }
      }

      setMonthWiseTotalBottles((prevBottles) => ({ ...prevBottles, [monthKey]: bottles }));
      setMonthWiseTotalBill((prevBill) => ({ ...prevBill, [monthKey]: bill }));
    }
  };

  const getStatus = (date) => {
    const key = date.toISOString().slice(0, 10);
    return deliveryData[key]?.status || 'None';
  };

  const getCurrentMonthKey = () => new Date().toISOString().slice(0, 7);

  const generateDeliverySummary = () => {
    setShowSummary(!showSummary);
    const currentMonthKey = getCurrentMonthKey();
    const newDeliveryDates = [];
    if (deliveryData) {
        for (const date in deliveryData) {
            if (date.startsWith(currentMonthKey) && deliveryData[date].status === "Delivered") {
                newDeliveryDates.push(date);
            }
        }
    }
    setDeliveryDates(newDeliveryDates);
  };


  const handleBillPaidToggle = () => {
    const monthKey = selectedDate.toISOString().slice(0, 7);
    update(ref(database, `paidStatus`), {
      [monthKey]: !paidStatus[monthKey],
    }).then(() => calculateTotalBill(deliveryData, monthKey));
  };
  return (
    <div className='App'>
      <h2>Water Bottle Subscription Tracker</h2>
         <Calendar onChange={setSelectedDate} value={selectedDate} />
      <p>Selected Date: {formatDate(selectedDate)}</p>
      <p>Status: {getStatus(selectedDate)}</p>
      <div className='button-group'>
        <button onClick={() => handleDeliveryStatus('Delivered')}>Mark Delivered</button>
        <button onClick={() => handleDeliveryStatus('Skipped')}>Mark Skipped</button>
      </div>
      <div className='price-input'>
        <label>Bottle Price: ₹</label>
        <input type='number' value={bottlePrice} onChange={handlePriceChange} />
      </div>
      <div className='monthly-summary'>
        <p>Total Bottles Delivered (Current Month): {monthWiseTotalBottles[getCurrentMonthKey()] || 0}</p>
        <p>Total Bill (Current Month): ₹{monthWiseTotalBill[getCurrentMonthKey()] || 0}</p>
        <button onClick={generateDeliverySummary}>View Monthly Summary</button>
        <button onClick={handleBillPaidToggle}>
          Mark Bill as {paidStatus[selectedDate.toISOString().slice(0, 7)]
            ? (
              <span>Unpaid (₹{monthWiseTotalBill[selectedDate.toISOString().slice(0, 7)]})</span>
            ) : (
              "Paid"
            )}
        </button>
      </div>
      {showSummary && (
        <table>
          <thead>
            <tr><th>Delivered Dates</th></tr>
          </thead>
          <tbody>
            {deliveryDates.map((date) => (<tr key={date}><td>{date}</td></tr>))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default App;