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
  const [totalBill, setTotalBill] = useState(0);
    const [currentMonthTotalBill, setCurrentMonthTotalBill] = useState(0);
  const [currentMonthTotalBottles, setCurrentMonthTotalBottles] = useState(0);

  useEffect(() => {
    const deliveryRef = ref(database, 'deliveries');
    const priceRef = ref(database, 'bottlePrice');

    const paidRef = ref(database, 'paidStatus');

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
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;

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

  const calculateTotalBill = (monthData) => {
      let bottles = 0;
      let bill = 0;
      for (const date in monthData) {
          if (monthData[date].status === "Delivered") {
              bottles++;
              bill += parseFloat(monthData[date].price);
          }
      }
          setCurrentMonthTotalBottles(bottles);
      setCurrentMonthTotalBill(bill);
    
      return {bottles, bill};

  };
  
  const getStatus = (date) => {
    const key = formatDate(date);
    return deliveryData[key]?.status || 'None';
  };

    const getCurrentMonthKey = () => {
        return selectedDate.toISOString().slice(0, 7);
    };

    
  useEffect(() => {
      const currentMonthKey = getCurrentMonthKey(); 
      let monthData = {};
      for (const date in deliveryData) {
          const formattedDate = formatDate(new Date(date));
        if (formattedDate.startsWith(currentMonthKey)) {

          monthData[date] = deliveryData[date];
        }
      }
        if (Object.keys(monthData).length === 0 && monthData.constructor === Object) {
            setCurrentMonthTotalBill(0);
            setCurrentMonthTotalBottles(0);
        } else {
            calculateTotalBill(monthData);        }
       
    }, [deliveryData,selectedDate]);
    
  const generateDeliverySummary = () => {
    setShowSummary(!showSummary);
    const currentMonthKey = getCurrentMonthKey();
    const newDeliveryDates = [];
    for (const date in deliveryData) {
      if (date.startsWith(currentMonthKey) && deliveryData[date].status === "Delivered") {
        newDeliveryDates.push(date);      }
    }
        setDeliveryDates(newDeliveryDates);
    };


    const handleBillPaidToggle = () => {
      const monthKey = getCurrentMonthKey();
         const paidRef = ref(database, 'paidStatus');        
        
        update(ref(database, `paidStatus`), { [monthKey]: !paidStatus[monthKey] }).then(() => {
            setPaidStatus(prev => ({ ...prev, [monthKey]: !prev[monthKey] }));
        });
    };

  return (
    <div className="App">
      <h2>Water Bottle Subscription Tracker</h2>
      <Calendar onChange={setSelectedDate} value={selectedDate} />
      <p>Selected Date: {formatDate(selectedDate)}</p>
      <p>Status: {getStatus(selectedDate)}</p>
      <div className="button-group"><button onClick={() => handleDeliveryStatus('Delivered')}>Mark Delivered</button>
        <button onClick={() => handleDeliveryStatus('Skipped')}>Mark Skipped</button>
      </div>
      <div className='price-input'>
        <label>Bottle Price: ₹</label>
        <input type='number' value={bottlePrice} onChange={handlePriceChange} />
      </div>
      <div className='button-container'>
        <button className="button" onClick={generateDeliverySummary}>View Monthly Summary</button>
        <button className="button" onClick={handleBillPaidToggle}>
            Mark Bill as {paidStatus[getCurrentMonthKey()] ? "Unpaid" : "Paid"}
        </button>
      </div>
        <p>
           Current Month Total Bottles: {currentMonthTotalBottles}
            , Current Month Total Bill: ₹{currentMonthTotalBill}
        </p>
        {showSummary && (
        <table>
          <thead>
            <tr>
              <th>Delivered Dates</th>
            </tr>
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