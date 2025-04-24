
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { db } from "./firebase";
import {
 ref,
 onValue,
 set,
 update
} from "firebase/database";
const getToday = () => format(new Date(), "yyyy-MM-dd");
function App() {
 const [selectedDate, setSelectedDate] = useState(getToday());
 const [deliveries, setDeliveries] = useState({});
 const [price, setPrice] = useState(20);
 const [priceHistory, setPriceHistory] = useState([{ date: getToday(), price: 20 }]);
 const [paidMonths, setPaidMonths] = useState([]);
 // Load data from Firebase
 useEffect(() => {
 const fetchData = () => {
 onValue(ref(db, "deliveries"), (snap) => {
 setDeliveries(snap.val() || {});
 });
 onValue(ref(db, "price"), (snap) => {
 setPrice(snap.val() || 20);
 });
 onValue(ref(db, "priceHistory"), (snap) => {
 setPriceHistory(snap.val() || [{ date: getToday(), price: 20 }]);
 });
 onValue(ref(db, "paidMonths"), (snap) => {
 setPaidMonths(snap.val() || []);
 });
 };
 fetchData();
 }, []);
 // Notification reminder
 useEffect(() => {
 if (Notification.permission !== "granted") Notification.requestPermission();
 const interval = setInterval(() => {
 const now = new Date();
 if (
 now.getHours() === 8 &&
 localStorage.getItem("notifiedDate") !== format(now, "yyyy-MM-dd")
 ) {
 new Notification("Reminder: Mark your water bottle delivery!");
 localStorage.setItem("notifiedDate", format(now, "yyyy-MM-dd"));
 }
 }, 60000);
 return () => clearInterval(interval);
 }, []);
 const toggleDelivery = (date) => {
 const newStatus = deliveries[date] === "delivered" ? "skipped" : "delivered";
 const updated = { ...deliveries, [date]: newStatus };
 set(ref(db, "deliveries"), updated);
 };
 const changePrice = (newPrice) => {
 const today = getToday();
 set(ref(db, "price"), Number(newPrice));
 const newHistory = [...priceHistory, { date: today, price: Number(newPrice) }];
 set(ref(db, "priceHistory"), newHistory);
 };
 const getPriceForDate = (date) => {
 const sorted = [...priceHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
 for (const p of sorted) {
 if (new Date(date) >= new Date(p.date)) return p.price;
 }
 return price;
 };
 const getMonthlySummary = (month) => {
 const days = Object.entries(deliveries).filter(([date, status]) => {
 return date.startsWith(month) && status === "delivered";
 });
 const total = days.reduce((sum, [date]) => sum + getPriceForDate(date), 0);
 return { days: days.length, total };
 };
 const handleExport = () => {
 const input = document.getElementById("summary");
 html2canvas(input).then((canvas) => {
 const imgData = canvas.toDataURL("image/png");
 const pdf = new jsPDF();
 pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
 pdf.save(`WaterSummary-${selectedDate.slice(0, 7)}.pdf`);
 });
 };
 const togglePaid = (month) => {
 const updated = paidMonths.includes(month)
 ? paidMonths.filter((m) => m !== month)
 : [...paidMonths, month];
 set(ref(db, "paidMonths"), updated);
 };
 return (
    <div style={{ fontFamily: "sans-serif", padding: "1rem", maxWidth: 480, margin: "auto" }}>
 <h2 style={{ textAlign: "center" }}>Water Bottle Tracker</h2>
 <div style={{ marginBottom: "1rem" }}>
 <label>Date: </label>
 <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
 </div>
 <div>
 <button onClick={() => toggleDelivery(selectedDate)} style={{ padding: "0.5rem 1rem" }}>
 {deliveries[selectedDate] === "delivered" ? "Mark as Skipped" : "Mark as Delivered"}
 </button>
 <div style={{ marginTop: "0.5rem" }}>
 Status: <b>{deliveries[selectedDate] || "Not Marked"}</b>
 </div>
 </div>
 <hr />
 <div>
 <label>Price per Bottle: </label>
 <input
 type="number"
 value={price}
 onChange={(e) => changePrice(e.target.value)}
 style={{ width: "60px", marginLeft: "0.5rem" }}
 />
 </div>
 <hr />
 <div id="summary" style={{ fontSize: "0.9rem" }}>
 <h3>Monthly Summary</h3>
 {[...Array(6)].map((_, i) => {
 const date = new Date();
 date.setMonth(date.getMonth() - i);
 const monthStr = format(date, "yyyy-MM");
 const { days, total } = getMonthlySummary(monthStr);
 return (
 <div key={monthStr} style={{ marginBottom: "0.5rem" }}>
 <b>{monthStr}</b>: {days} bottles ? ?{total}{" "}
 <button onClick={() => togglePaid(monthStr)}>
 {paidMonths.includes(monthStr) ? "Paid" : "Mark as Paid"}
 </button>
 </div>
 );
 })}
 <button onClick={handleExport} style={{ marginTop: "1rem" }}>Export as PDF</button>
 </div>
 </div>
 );
}
export default App;
