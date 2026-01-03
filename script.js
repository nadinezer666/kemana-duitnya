let currentTab = 'tab-transaksi';
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let goals = JSON.parse(localStorage.getItem('goals')) || [];
let budgets = JSON.parse(localStorage.getItem('budgets')) || [];
let categories = JSON.parse(localStorage.getItem('customCategories')) || ['Makan', 'Transportasi', 'Jajan', 'Umum'];

const modal = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');

function openTab(evt, tabName) {
    currentTab = tabName;
    let tabcontent = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabcontent.length; i++) tabcontent[i].style.display = "none";
    let tablinks = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tablinks.length; i++) tablinks[i].className = tablinks[i].className.replace(" active", "");
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

// MODAL CONTROLLER
document.getElementById('open-modal-btn').onclick = () => {
    document.querySelectorAll('.modal-form').forEach(f => f.style.display = 'none');
    document.querySelectorAll('.modal-form').forEach(f => f.reset());
    
    if(currentTab === 'tab-transaksi') {
        modalTitle.innerText = 'Tambah Transaksi';
        document.getElementById('form-transaksi').style.display = 'block';
        document.getElementById('edit-id-trans').value = '';
    } else if(currentTab === 'tab-tabungan') {
        modalTitle.innerText = 'Tambah Target';
        document.getElementById('form-tabungan').style.display = 'block';
        document.getElementById('edit-id-goal').value = '';
    } else {
        modalTitle.innerText = 'Set Budget';
        document.getElementById('form-budget').style.display = 'block';
    }
    modal.style.display = 'flex';
};

document.getElementById('close-modal-btn').onclick = () => modal.style.display = 'none';

function updateLS() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('goals', JSON.stringify(goals));
    localStorage.setItem('budgets', JSON.stringify(budgets));
    localStorage.setItem('customCategories', JSON.stringify(categories));
}

// FORMAT RUPIAH
document.querySelectorAll('.format-rupiah').forEach(inp => {
    inp.addEventListener('keyup', function() {
        let val = this.value.replace(/\D/g, '');
        this.value = val ? parseInt(val).toLocaleString('id-ID') : '';
    });
});

function renderCats() {
    const s1 = document.getElementById('category-select');
    const s2 = document.getElementById('budget-category-select');
    s1.innerHTML = s2.innerHTML = '';
    categories.forEach(c => {
        s1.innerHTML += `<option value="${c}">${c}</option>`;
        s2.innerHTML += `<option value="${c}">${c}</option>`;
    });
}

document.getElementById('add-cat-btn').onclick = () => {
    let n = prompt("Kategori Baru:");
    if(n && !categories.includes(n)) { categories.push(n); updateLS(); renderCats(); }
};

// SUBMIT TRANSAKSI
document.getElementById('form-transaksi').onsubmit = (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id-trans').value;
    const amt = parseInt(document.getElementById('amount').value.replace(/\./g, ''));
    const data = {
        id: id ? parseInt(id) : Date.now(),
        text: document.getElementById('text').value,
        amount: document.getElementById('type').value === 'minus' ? -amt : amt,
        date: document.getElementById('date').value,
        category: document.getElementById('category-select').value
    };
    if(id) { transactions[transactions.findIndex(t => t.id === parseInt(id))] = data; }
    else { transactions.push(data); }
    updateLS(); init(); modal.style.display = 'none';
};

// SUBMIT TABUNGAN
document.getElementById('form-tabungan').onsubmit = (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id-goal').value;
    const data = {
        id: id ? parseInt(id) : Date.now(),
        name: document.getElementById('goal-name').value,
        target: parseInt(document.getElementById('goal-target').value.replace(/\./g, '')),
        initial: parseInt(document.getElementById('goal-current').value.replace(/\./g, ''))
    };
    if(id) { goals[goals.findIndex(g => g.id === parseInt(id))] = data; }
    else { goals.push(data); }
    updateLS(); init(); modal.style.display = 'none';
};

// SUBMIT BUDGET
document.getElementById('form-budget').onsubmit = (e) => {
    e.preventDefault();
    const cat = document.getElementById('budget-category-select').value;
    const limit = parseInt(document.getElementById('budget-limit').value.replace(/\./g, ''));
    budgets = budgets.filter(b => b.category !== cat);
    budgets.push({ category: cat, limit: limit });
    updateLS(); init(); modal.style.display = 'none';
};

// EDIT TRANS
window.editTransaction = (id) => {
    const t = transactions.find(x => x.id === id);
    modalTitle.innerText = 'Edit Transaksi';
    document.getElementById('form-transaksi').style.display = 'block';
    document.getElementById('edit-id-trans').value = t.id;
    document.getElementById('text').value = t.text;
    document.getElementById('amount').value = Math.abs(t.amount).toLocaleString('id-ID');
    document.getElementById('date').value = t.date;
    document.getElementById('category-select').value = t.category;
    document.getElementById('type').value = t.amount < 0 ? 'minus' : 'plus';
    modal.style.display = 'flex';
};

// EDIT GOAL
window.editGoal = (id) => {
    const g = goals.find(x => x.id === id);
    modalTitle.innerText = 'Edit Target';
    document.getElementById('form-tabungan').style.display = 'block';
    document.getElementById('edit-id-goal').value = g.id;
    document.getElementById('goal-name').value = g.name;
    document.getElementById('goal-target').value = g.target.toLocaleString('id-ID');
    document.getElementById('goal-current').value = g.initial.toLocaleString('id-ID');
    modal.style.display = 'flex';
};

function init() {
    // --- TARUH INI DI BAGIAN ATAS SCRIPT (Di bawah deklarasi variabel) ---
// Set default filter ke bulan sekarang pas aplikasi dibuka
const monthInput = document.getElementById('month-filter');
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0'); // Jan = 01
monthInput.value = `${yyyy}-${mm}`;

// Kalau user ganti bulan, refresh datanya
monthInput.onchange = () => init();


// --- GANTI FUNCTION init() LAMA DENGAN INI ---
function init() {
    const listEl = document.getElementById('list');
    listEl.innerHTML = '';
    
    // 1. Hitung TOTAL SALDO (Global / Semua Waktu)
    // Saldo asli dompet ga boleh berubah cuma gara-gara filter bulan
    let globalTotal = transactions.reduce((acc, t) => acc + t.amount, 0);
    document.getElementById('balance').innerText = `Rp ${globalTotal.toLocaleString('id-ID')}`;

    // 2. Ambil nilai bulan yang dipilih user
    const selectedMonth = monthInput.value; // Format: "2023-10"

    // 3. Filter Transaksi sesuai bulan & Sortir berdasarkan TANGGAL (Newest First)
    let filteredTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
    
    filteredTransactions.sort((a, b) => {
        // Bandingkan tanggal dulu
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA; 
        // Kalau tanggal sama, baru urutkan berdasarkan ID (biar input terakhir tetep di atas)
    });

    // 4. Render ke Layar
    if (filteredTransactions.length === 0) {
        listEl.innerHTML = '<li style="justify-content:center; color:#aaa; font-size:12px;">Belum ada transaksi bulan ini</li>';
    } else {
        filteredTransactions.forEach(t => {
            listEl.innerHTML += `<li>
                <div class="info">
                    <strong>${t.text}</strong>
                    <small>${t.date} • ${t.category}</small>
                </div>
                <div class="amount-area">
                    <span style="color:${t.amount < 0 ? '#e74c3c' : '#2ecc71'}; font-weight:700">
                        Rp ${Math.abs(t.amount).toLocaleString('id-ID')}
                    </span>
                    <span class="edit-link" onclick="editTransaction(${t.id})">Edit</span>
                </div>
                <button class="del-btn-corner" onclick="removeTransaction(${t.id})">×</button>
            </li>`;
        });
    }

    renderGoals(); 
    renderBudgets();
}
}

function removeTransaction(id) { if(confirm('Hapus?')) { transactions = transactions.filter(t => t.id !== id); updateLS(); init(); } }

function renderBudgets() {
    const bList = document.getElementById('budget-list');
    bList.innerHTML = '';
    budgets.forEach(b => {
        let spent = Math.abs(transactions.filter(t => t.category === b.category && t.amount < 0).reduce((acc, t) => acc + t.amount, 0));
        let p = Math.min((spent / b.limit) * 100, 100);
        let color = p > 90 ? 'bg-red' : (p > 70 ? 'bg-orange' : 'bg-blue');
        bList.innerHTML += `<div class="card">
            <button class="del-btn-corner" onclick="removeBudget('${b.category}')">×</button>
            <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; padding-top:5px"><span>${b.category}</span><span>${p.toFixed(0)}%</span></div>
            <div class="progress-bar"><div class="progress-fill ${color}" style="width:${p}%"></div></div>
            <div style="display:flex; justify-content:space-between; font-size:10px; color:#888"><span>Rp ${spent.toLocaleString()}</span><span>Limit: Rp ${b.limit.toLocaleString()}</span></div>
        </div>`;
    });
}

window.removeBudget = (cat) => { if(confirm('Hapus budget?')) { budgets = budgets.filter(b => b.category !== cat); updateLS(); init(); } };

function renderGoals() {
    const gList = document.getElementById('goals-list');
    gList.innerHTML = '';
    goals.forEach(g => {
        let added = transactions.filter(t => t.text.toLowerCase().includes(g.name.toLowerCase())).reduce((acc, t) => acc + Math.abs(t.amount), 0);
        let cur = g.initial + added;
        let p = Math.min((cur / g.target) * 100, 100);
        gList.innerHTML += `<div class="card">
            <button class="del-btn-corner" onclick="removeGoal(${g.id})">×</button>
            <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:600; padding-top:5px"><span>${g.name}</span><span>Rp ${cur.toLocaleString()}</span></div>
            <div class="progress-bar"><div class="progress-fill bg-green" style="width:${p}%"></div></div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <small style="font-size:10px; color:#888">Target: Rp ${g.target.toLocaleString()}</small>
                <span class="edit-link" onclick="editGoal(${g.id})">Edit</span>
            </div>
        </div>`;
    });
}

window.removeGoal = (id) => { if(confirm('Hapus target?')) { goals = goals.filter(g => g.id !== id); updateLS(); init(); } };

document.getElementById('download-report').onclick = () => {
    let r = `LAPORAN KEUANGAN\n------------------\n\n`;
    transactions.forEach(t => { r += `[${t.date}] (${t.category}) ${t.text}: Rp ${t.amount.toLocaleString()}\n`; });
    const blob = new Blob([r], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Laporan.txt`; a.click();
};

renderCats(); init();
