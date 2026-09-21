const STORAGE_KEY_STUDENTS = 'sinking_fund_students';
const STORAGE_KEY_PAYMENTS = 'sinking_fund_payments';

const addStudentForm = document.getElementById('addStudentForm');
const paymentForm = document.getElementById('paymentForm');
const newStudentNameInput = document.getElementById('newStudentName');
const selectStudent = document.getElementById('selectStudent');
const paymentAmountInput = document.getElementById('paymentAmount');
const paymentDateInput = document.getElementById('paymentDate');
const monthPicker = document.getElementById('monthPicker');
const headerRow = document.getElementById('headerRow');
const rosterBody = document.getElementById('rosterBody');
const emptyRosterMessage = document.getElementById('emptyRosterMessage');

const today = new Date();
const currentIsoDate = today.toISOString().split('T')[0];
const currentMonthStr = currentIsoDate.substring(0, 7);

paymentDateInput.value = currentIsoDate;
monthPicker.value = currentMonthStr;

let students = JSON.parse(localStorage.getItem(STORAGE_KEY_STUDENTS)) || [];
let payments = JSON.parse(localStorage.getItem(STORAGE_KEY_PAYMENTS)) || {};

function saveData() {
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(payments));
}

function formatPeso(val) {
  return '₱' + Number(val).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getDaysInMonth(yearMonthStr) {
  const [year, month] = yearMonthStr.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const dates = [];

  while (date.getMonth() === month - 1) {
    const dayStr = String(date.getDate()).padStart(2, '0');
    const monthStr = String(month).padStart(2, '0');
    dates.push({
      iso: `${year}-${monthStr}-${dayStr}`,
      dayNumber: date.getDate()
    });
    date.setDate(date.getDate() + 1);
  }

  return dates;
}

function updateStudentDropdown() {
  selectStudent.innerHTML = '<option value="">-- Choose Student --</option>';
  students.forEach(student => {
    const opt = document.createElement('option');
    opt.value = student;
    opt.textContent = student;
    selectStudent.appendChild(opt);
  });
}

function renderGrid() {
  const selectedMonth = monthPicker.value || currentMonthStr;
  const monthDays = getDaysInMonth(selectedMonth);

  headerRow.innerHTML = `
    <th class="sticky-col">Student Name</th>
    <th>Total Paid</th>
  `;

  monthDays.forEach(dayObj => {
    const th = document.createElement('th');
    th.textContent = dayObj.dayNumber;
    th.className = 'grid-cell';
    headerRow.appendChild(th);
  });

  const actionTh = document.createElement('th');
  actionTh.textContent = 'Action';
  headerRow.appendChild(actionTh);

  rosterBody.innerHTML = '';

  if (students.length === 0) {
    emptyRosterMessage.style.display = 'block';
    return;
  }

  emptyRosterMessage.style.display = 'none';

  students.forEach((student) => {
    const studentPayments = payments[student] || {};

    let totalPaid = 0;
    Object.values(studentPayments).forEach(amt => {
      totalPaid += Number(amt);
    });

    const tr = document.createElement('tr');

    let boxesHtml = '';
    monthDays.forEach(dayObj => {
      const dateStr = dayObj.iso;
      const amountOnDay = studentPayments[dateStr] || 0;
      const isPaid = amountOnDay > 0;
      const titleText = isPaid
        ? `${dateStr}: Paid ${formatPeso(amountOnDay)}`
        : `${dateStr}: No Payment`;

      boxesHtml += `
        <td class="grid-cell" title="${titleText}">
          <span class="box ${isPaid ? 'box-paid' : 'box-unpaid'}"></span>
        </td>
      `;
    });

    tr.innerHTML = `
      <td class="sticky-col"><strong>${escapeHtml(student)}</strong></td>
      <td><strong>${formatPeso(totalPaid)}</strong></td>
      ${boxesHtml}
      <td>
        <button class="btn-delete" onclick="removeStudent('${escapeHtml(student)}')">Remove</button>
      </td>
    `;

    rosterBody.appendChild(tr);
  });
}

addStudentForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = newStudentNameInput.value.trim();

  if (name && !students.includes(name)) {
    students.push(name);
    if (!payments[name]) payments[name] = {};
    saveData();
    updateStudentDropdown();
    renderGrid();
    newStudentNameInput.value = '';
  }
});

paymentForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const student = selectStudent.value;
  const amount = parseFloat(paymentAmountInput.value);
  const date = paymentDateInput.value;

  if (!student || isNaN(amount) || !date) return;

  if (!payments[student]) payments[student] = {};

  payments[student][date] = (payments[student][date] || 0) + amount;

  saveData();

  const paymentMonth = date.substring(0, 7);
  monthPicker.value = paymentMonth;

  renderGrid();

  paymentAmountInput.value = '';
  selectStudent.value = '';
});

monthPicker.addEventListener('change', renderGrid);

function removeStudent(studentName) {
  students = students.filter(s => s !== studentName);
  delete payments[studentName];
  saveData();
  updateStudentDropdown();
  renderGrid();
}

updateStudentDropdown();
renderGrid();