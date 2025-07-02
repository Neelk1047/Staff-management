document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("datetime").textContent = new Date().toLocaleString();
  setInterval(() => {
    document.getElementById("datetime").textContent = new Date().toLocaleString();
  }, 1000);

  ensureTodayStorage();
  loadStaffTable();

  document.getElementById("selectedDate").addEventListener("change", showAttendanceByDate);
});

function ensureTodayStorage() {
  const today = new Date().toISOString().split("T")[0];
  const data = JSON.parse(localStorage.getItem("attendanceByDate") || "{}");
  if (!data[today]) data[today] = [];
  localStorage.setItem("attendanceByDate", JSON.stringify(data));
}

function loadStaffTable() {
  const tbody = document.querySelector("#attendanceTable tbody");
  tbody.innerHTML = "";
  const staff = JSON.parse(localStorage.getItem("staffRecords") || "[]");
  const today = new Date().toISOString().split("T")[0];
  const allData = JSON.parse(localStorage.getItem("attendanceByDate") || "{}");
  const attendance = allData[today] || [];

  staff.forEach(s => {
    const record = attendance.find(a => a.id === s.id) || {};
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.name}</td>
      <td>${s.designation}</td>
      <td>${record.checkIn || `<button onclick="checkIn('${s.id}')">Check-in</button>`}</td>
      <td>${record.checkOut || `<button onclick="checkOut('${s.id}')">Checkout</button>`}</td>
      <td>${record.duration || "-"}</td>
      <td>${record.location || "-"}</td>
      <td><button onclick="removeRecord('${s.id}')" class="danger">❌</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("attendanceTable").classList.remove("hidden");
  document.getElementById("noRecords").classList.add("hidden");
}

function checkIn(id) {
  const today = new Date().toISOString().split("T")[0];
  const data = JSON.parse(localStorage.getItem("attendanceByDate") || "{}");
  const attendance = data[today] || [];
  const existing = attendance.find(a => a.id === id);
  if (existing?.checkIn) return alert("Already checked in");

  getLocation(loc => {
    attendance.push({
      id,
      checkIn: new Date().toLocaleTimeString(),
      checkInTime: new Date().toISOString(),
      location: loc
    });
    data[today] = attendance;
    localStorage.setItem("attendanceByDate", JSON.stringify(data));
    loadStaffTable();
  });
}

function checkOut(id) {
  const today = new Date().toISOString().split("T")[0];
  const data = JSON.parse(localStorage.getItem("attendanceByDate") || "{}");
  const attendance = data[today] || [];
  const record = attendance.find(a => a.id === id);
  if (!record?.checkIn) return alert("Please check in first");
  if (record.checkOut) return alert("Already checked out");

  getLocation(loc => {
    const checkInDate = new Date(record.checkInTime);
    const checkOutTime = new Date();
    const duration = formatDuration(checkOutTime - checkInDate);

    record.checkOut = checkOutTime.toLocaleTimeString();
    record.duration = duration;
    record.location = loc;

    data[today] = attendance;
    localStorage.setItem("attendanceByDate", JSON.stringify(data));
    loadStaffTable();
  });
}

function removeRecord(id) {
  const today = new Date().toISOString().split("T")[0];
  const data = JSON.parse(localStorage.getItem("attendanceByDate") || "{}");
  data[today] = (data[today] || []).filter(a => a.id !== id);
  localStorage.setItem("attendanceByDate", JSON.stringify(data));
  loadStaffTable();
}

function clearAll() {
  if (confirm("Clear today's attendance?")) {
    const today = new Date().toISOString().split("T")[0];
    const data = JSON.parse(localStorage.getItem("attendanceByDate") || "{}");
    delete data[today];
    localStorage.setItem("attendanceByDate", JSON.stringify(data));
    loadStaffTable();
  }
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

function pad(n) {
  return n.toString().padStart(2, '0');
}

function getLocation(cb) {
  if (!navigator.geolocation) return cb("Location not supported");
  navigator.geolocation.getCurrentPosition(async pos => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      const address = data.address;
      cb(`${address.city || address.town || address.village || ""}, ${address.state || ""}`);
    } catch {
      cb("Location unavailable");
    }
  }, () => cb("Permission denied"));
}

function downloadCSV() {
  const date = document.getElementById("selectedDate").value;
  if (!date) return alert("Please select a date");
  const data = JSON.parse(localStorage.getItem("attendanceByDate") || "{}");
  const attendance = data[date];
  if (!attendance || attendance.length === 0) return alert("No records found for selected date");

  const staff = JSON.parse(localStorage.getItem("staffRecords") || "[]");
  const rows = [["ID", "Name", "Designation", "Check-in", "Checkout", "Duration", "Location"]];

  attendance.forEach(rec => {
    const s = staff.find(st => st.id === rec.id);
    if (s) {
      rows.push([
        s.id,
        s.name,
        s.designation,
        rec.checkIn || "",
        rec.checkOut || "",
        rec.duration || "",
        rec.location || ""
      ]);
    }
  });

  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `attendance_${date}.csv`;
  a.click();
}

function showAttendanceByDate() {
  const date = document.getElementById("selectedDate").value;
  const data = JSON.parse(localStorage.getItem("attendanceByDate") || "{}");
  const staff = JSON.parse(localStorage.getItem("staffRecords") || "[]");
  const attendance = data[date] || [];

  const tbody = document.querySelector("#attendanceTable tbody");
  tbody.innerHTML = "";

  if (attendance.length === 0) {
    document.getElementById("attendanceTable").classList.add("hidden");
    document.getElementById("noRecords").classList.remove("hidden");
    return;
  }

  attendance.forEach(record => {
    const s = staff.find(st => st.id === record.id);
    if (!s) return;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.name}</td>
      <td>${s.designation}</td>
      <td>${record.checkIn || "-"}</td>
      <td>${record.checkOut || "-"}</td>
      <td>${record.duration || "-"}</td>
      <td>${record.location || "-"}</td>
      <td>-</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("attendanceTable").classList.remove("hidden");
  document.getElementById("noRecords").classList.add("hidden");
}
