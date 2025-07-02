document.addEventListener("DOMContentLoaded", () => {
  loadStaff();
  setInterval(() => {
    document.getElementById("datetime").textContent = new Date().toLocaleString();
  }, 1000);
});

const nameInput = document.getElementById("name");
const designationInput = document.getElementById("designation");
const phoneInput = document.getElementById("phone");
const externalIdInput = document.getElementById("externalId");
const externalIdImageInput = document.getElementById("externalIdImage");
const searchInput = document.getElementById("searchInput");
const designationFilter = document.getElementById("designationFilter");
const addBtn = document.getElementById("addBtn");
const updateBtn = document.getElementById("updateBtn");

let currentEditId = null;
let currentIdImage = "";

externalIdImageInput.onchange = function () {
  const reader = new FileReader();
  reader.onload = function (e) {
    currentIdImage = e.target.result;
  };
  reader.readAsDataURL(this.files[0]);
};

function generateStaffId() {
  return "STF" + Math.floor(1000 + Math.random() * 9000);
}

function loadStaff() {
  const records = JSON.parse(localStorage.getItem("staffRecords") || "[]");
  displayStaff(records);
}

function displayStaff(records) {
  const tbody = document.querySelector("#staffTable tbody");
  tbody.innerHTML = "";
  records.forEach((staff, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${staff.name}</td>
      <td>${staff.id}</td>
      <td>${staff.phone}</td>
      <td>${staff.designation}</td>
      <td>${staff.externalId}</td>
      <td><button onclick="previewIdImage('${staff.idImage}')">🖼️</button></td>
      <td>${staff.joiningDate}</td>
      <td class="action-btns">
        <button onclick="editStaff(${i})">✏️</button>
        <button onclick="deleteStaff(${i})">🗑️</button>
      </td>`;
    tbody.appendChild(row);
  });
}

document.getElementById("staffForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = nameInput.value.trim();
  const designation = designationInput.value;
  const phone = phoneInput.value.trim();
  const externalId = externalIdInput.value.trim();

  if (!name || !designation || !phone || !externalId || !currentIdImage) {
    alert("Please fill all fields and upload ID image.");
    return;
  }

  const records = JSON.parse(localStorage.getItem("staffRecords") || "[]");
  const staffData = {
    id: currentEditId !== null ? records[currentEditId].id : generateStaffId(),
    name,
    designation,
    phone,
    externalId,
    idImage: currentIdImage,
    joiningDate: currentEditId !== null ? records[currentEditId].joiningDate : new Date().toLocaleDateString(),
  };

  if (currentEditId !== null) {
    records[currentEditId] = staffData;
  } else {
    records.push(staffData);
  }

  localStorage.setItem("staffRecords", JSON.stringify(records));
  loadStaff();
  resetForm();
});

function resetForm() {
  nameInput.value = "";
  designationInput.value = "";
  phoneInput.value = "";
  externalIdInput.value = "";
  externalIdImageInput.value = "";
  currentIdImage = "";
  currentEditId = null;
  updateBtn.style.display = "none";
  addBtn.style.display = "inline-block";
}

window.editStaff = function (id) {
  const records = JSON.parse(localStorage.getItem("staffRecords") || "[]");
  const staff = records[id];
  nameInput.value = staff.name;
  designationInput.value = staff.designation;
  phoneInput.value = staff.phone;
  externalIdInput.value = staff.externalId;
  currentIdImage = staff.idImage;
  currentEditId = id;
  addBtn.style.display = "none";
  updateBtn.style.display = "inline-block";
};

window.deleteStaff = function (id) {
  const records = JSON.parse(localStorage.getItem("staffRecords") || "[]");
  records.splice(id, 1);
  localStorage.setItem("staffRecords", JSON.stringify(records));
  loadStaff();
};

window.previewIdImage = function (img) {
  const modal = document.getElementById("modalPreview");
  const modalImg = document.getElementById("modalImg");
  modalImg.src = img;
  modal.style.display = "flex";
};

function filterStaff() {
  const search = searchInput.value.toLowerCase();
  const designation = designationFilter.value;
  const records = JSON.parse(localStorage.getItem("staffRecords") || "[]");
  const filtered = records.filter(staff => {
    return (
      (!designation || staff.designation === designation) &&
      (staff.name.toLowerCase().includes(search) ||
       staff.phone.includes(search) ||
       staff.id.includes(search) ||
       staff.externalId.includes(search))
    );
  });
  displayStaff(filtered);
}

searchInput.addEventListener("input", filterStaff);
designationFilter.addEventListener("change", filterStaff);

function clearFilters() {
  searchInput.value = "";
  designationFilter.value = "";
  loadStaff();
}

function downloadPDF() {
  const records = JSON.parse(localStorage.getItem("staffRecords") || "[]");
  if (!records.length) return alert("No data found.");

  const hotelName = prompt("Enter Hotel Name for PDF:");
  if (!hotelName) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`${hotelName} - Staff Records`, 14, 18);
  doc.setFontSize(10);
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 24);

  const headers = [["Staff ID", "Name", "Phone", "Designation", "External ID", "Joining Date"]];
  const data = records.map(r => [r.id, r.name, r.phone, r.designation, r.externalId, r.joiningDate]);

  doc.autoTable({
    startY: 30,
    head: headers,
    body: data,
    styles: { fontSize: 9 },
    didDrawPage: function (data) {
      doc.setFontSize(9);
      doc.text("Powered by Ailexity Pvt Ltd", 14, doc.internal.pageSize.height - 10);
      doc.text("Page " + doc.internal.getNumberOfPages(), doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
    }
  });

  doc.save("staff_records.pdf");
}
