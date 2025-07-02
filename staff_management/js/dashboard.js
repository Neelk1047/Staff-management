document.addEventListener("DOMContentLoaded", () => {
  updateDashboard();
  setInterval(updateTime, 1000);
});

function updateDashboard() {
  const staff = JSON.parse(localStorage.getItem("staffRecords") || "[]");
  const feedbacks = JSON.parse(localStorage.getItem("feedbackRecords") || "[]");
  const attendanceData = JSON.parse(localStorage.getItem("attendanceByDate") || "{}");
  const today = new Date().toISOString().split("T")[0];

  const todayAttendance = attendanceData[today] || [];
  const presentIds = todayAttendance.map(r => r.id);
  const uniquePresentIds = [...new Set(presentIds)];
  const present = uniquePresentIds.length;
  const absent = staff.length - present;

  document.getElementById("totalStaff").textContent = staff.length;
  document.getElementById("feedbackCount").textContent = feedbacks.length;
  document.getElementById("todayAttendance").textContent = `${present} Present / ${absent} Absent`;
}

function updateTime() {
  const now = new Date();
  document.getElementById("liveDate").textContent = now.toLocaleDateString();
  document.getElementById("liveTime").textContent = now.toLocaleTimeString();
}

function exportCSV() {
  const attendanceData = JSON.parse(localStorage.getItem("attendanceByDate") || "{}");
  const staff = JSON.parse(localStorage.getItem("staffRecords") || "[]");
  const today = new Date().toISOString().split("T")[0];
  const todayRecords = attendanceData[today] || [];

  if (todayRecords.length === 0) return alert("No attendance records for today!");

  const rows = [["Staff ID", "Name", "Designation", "Check-in", "Checkout", "Work Hours", "Location"]];

  todayRecords.forEach(record => {
    const s = staff.find(st => st.id === record.id);
    if (s) {
      rows.push([
        s.id,
        s.name,
        s.designation,
        record.checkIn || "",
        record.checkOut || "",
        record.duration || "",
        record.location || ""
      ]);
    }
  });

  const csvContent = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `attendance_${today}.csv`;
  a.click();
}
