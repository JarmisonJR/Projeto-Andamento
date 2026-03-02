// --- CONFIGURAÇÕES GLOBAIS E ESTADO ---
const slots = ["07:20 - 08:10", "08:10 - 09:00", "09:20 - 10:10", "10:10 - 11:00", "11:00 - 11:50", "12:00 - 13:00", "13:10 - 14:00", "14:00 - 14:50", "15:10 - 16:00", "16:00 - 16:50"];

let currentLab = "";
let selectedDate = new Date().toISOString().split('T')[0];
let dayToCustomize = null;

// Novos postos desejados
const novosPostos = [
    { posto: "Fila (manhã)" },
    { posto: "Sucos (almoço)" },
    { posto: "Fila (almoço)" },
    { posto: "Liberar salas (Almoço)" },
    { posto: "Fila (Tarde)" }
];

// Carrega o banco ou cria um novo
let db = JSON.parse(localStorage.getItem('portalEscolarDB')) || {
    professores: [],
    turmas: [],
    monitores: [],
    monitoriaEscala: novosPostos
};

// --- CORREÇÃO FORÇADA DE NOMES ---
// Verifica se o primeiro posto ainda é o antigo "Entrada Principal"
if (db.monitoriaEscala[0].posto === "Entrada Principal" || db.monitoriaEscala.length !== 5) {
    db.monitoriaEscala = novosPostos;
    localStorage.setItem('portalEscolarDB', JSON.stringify(db));
}

const saveDB = () => localStorage.setItem('portalEscolarDB', JSON.stringify(db));

// --- NAVEGAÇÃO ---
function showSection(id) {
    document.querySelectorAll('.app-section').forEach(s => s.classList.remove('active'));
    let targetId = id === 'menu' ? 'main-menu' : (id.startsWith('sec-') ? id : `sec-${id}`);
    const target = document.getElementById(targetId);
    
    if (target) {
        target.classList.add('active');
        if (id === 'monitoria') {
            initCalendarControls('monitoria');
            generateMonitoriaCalendar();
            updateGlobalDate();
        }
        if (id === 'cadastros') renderListasCadastros();
        if (id === 'reservas') {
            initCalendarControls('reserva');
            generateCalendar();
            updateGlobalDate();
        }
    }
}

function openLab(name) {
    currentLab = name;
    document.getElementById('currentLabTitle').innerText = name;
    showSection('reservas');
}

// --- CALENDÁRIO ---
function initCalendarControls(prefix) {
    const mSel = document.getElementById(`${prefix}-month`);
    const ySel = document.getElementById(`${prefix}-year`);
    if (!mSel || mSel.options.length > 0) return;

    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    meses.forEach((m, i) => mSel.add(new Option(m, i)));
    for (let i = 2026; i <= 2030; i++) ySel.add(new Option(i, i));

    mSel.value = new Date().getMonth();
    ySel.value = new Date().getFullYear();
}

function generateCalendarGeneric(gridId, monthId, yearId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    
    const month = parseInt(document.getElementById(monthId).value);
    const year = parseInt(document.getElementById(yearId).value);
    grid.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        if (dateStr === selectedDate) dayEl.classList.add('selected');

        const mark = JSON.parse(localStorage.getItem(`mark-${dateStr}`));
        dayEl.innerHTML = `<span>${d}</span>`;
        if (mark) {
            dayEl.classList.add(`status-${mark.type}`);
            dayEl.innerHTML += `<span class="day-label">${mark.desc}</span>`;
        }

        dayEl.onclick = () => { 
            selectedDate = dateStr; 
            updateGlobalDate(); 
            generateCalendar(); 
            generateMonitoriaCalendar(); 
        };
        
        dayEl.oncontextmenu = (e) => {
            e.preventDefault();
            dayToCustomize = dayEl;
            dayToCustomize.dataset.tempDate = dateStr;
            const menu = document.getElementById('custom-menu');
            menu.style.display = 'block';
            menu.style.left = e.pageX + 'px';
            menu.style.top = e.pageY + 'px';
        };
        grid.appendChild(dayEl);
    }
}

function generateCalendar() { generateCalendarGeneric('calendar-grid', 'reserva-month', 'reserva-year'); }
function generateMonitoriaCalendar() { generateCalendarGeneric('monitoria-grid', 'monitoria-month', 'monitoria-year'); }

function applyStatus(status) {
    if (!dayToCustomize) return;
    const dateStr = dayToCustomize.dataset.tempDate;
    if (status === 'letivo') {
        localStorage.removeItem(`mark-${dateStr}`);
    } else {
        const desc = prompt(`Descrição do ${status}:`, "");
        if (desc) localStorage.setItem(`mark-${dateStr}`, JSON.stringify({ type: status, desc }));
    }
    document.getElementById('custom-menu').style.display = 'none';
    generateCalendar();
    generateMonitoriaCalendar();
}

// --- TABELAS E DADOS ---
function updateGlobalDate() {
    const [y, m, d] = selectedDate.split('-');
    const fmt = `${d}/${m}/${y}`;
    if (document.getElementById('selected-date-label')) document.getElementById('selected-date-label').innerText = `Horários para: ${fmt}`;
    if (document.getElementById('selected-monitoria-date-label')) document.getElementById('selected-monitoria-date-label').innerText = `Horários para: ${fmt}`;
    renderTable();
    renderMonitoria();
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    if (!tbody || !currentLab) return;
    tbody.innerHTML = slots.map((slot, i) => {
        const key = `res-${currentLab}-${selectedDate}-${slot}`;
        const data = JSON.parse(localStorage.getItem(key)) || { p: '', t: '' };
        return `<tr>
            <td><strong>${slot}</strong></td>
            <td><select onchange="saveRes('${slot}',${i},'p')" id="p-${i}">
                <option value="">Selecione...</option>
                ${db.professores.map(p => `<option value="${p}" ${data.p === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select></td>
            <td><select onchange="saveRes('${slot}',${i},'t')" id="t-${i}">
                <option value="">Turma</option>
                ${db.turmas.map(t => `<option value="${t}" ${data.t === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select></td>
        </tr>`;
    }).join('');
}

function saveRes(slot, i, field) {
    const val = document.getElementById(`${field}-${i}`).value;
    const key = `res-${currentLab}-${selectedDate}-${slot}`;
    const data = JSON.parse(localStorage.getItem(key)) || { p: '', t: '' };
    data[field] = val;
    localStorage.setItem(key, JSON.stringify(data));
}

function renderMonitoria() {
    const tbody = document.getElementById('tableBodyMonitoria');
    if (!tbody) return;
    tbody.innerHTML = db.monitoriaEscala.map((item, index) => {
        const key = `mon-${item.posto}-${selectedDate}`;
        const data = JSON.parse(localStorage.getItem(key)) || { m: '', t: '' };
        return `<tr>
            <td><strong>${item.posto}</strong></td>
            <td><select onchange="saveMon('${item.posto}','m',this.value)">
                <option value="">Selecione...</option>
                ${db.monitores.map(m => `<option value="${m}" ${data.m === m ? 'selected' : ''}>${m}</option>`).join('')}
            </select></td>
            <td><select onchange="saveMon('${item.posto}','t',this.value)">
                <option value="">Turma</option>
                ${db.turmas.map(t => `<option value="${t}" ${data.t === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select></td>
        </tr>`;
    }).join('');
}

function saveMon(posto, field, val) {
    const key = `mon-${posto}-${selectedDate}`;
    const data = JSON.parse(localStorage.getItem(key)) || { m: '', t: '' };
    data[field] = val;
    localStorage.setItem(key, JSON.stringify(data));
}

// --- CADASTROS E LOGIN ---
function cadastrarItem(tipo, inputId) {
    const input = document.getElementById(inputId);
    if (!input.value.trim()) return;
    db[tipo].push(input.value.trim());
    saveDB(); input.value = ""; renderListasCadastros();
}

function removerItem(tipo, index) { db[tipo].splice(index, 1); saveDB(); renderListasCadastros(); }

function renderListasCadastros() {
    ['professores', 'turmas', 'monitores'].forEach(tipo => {
        const el = document.getElementById(`list-${tipo}`);
        if (el) el.innerHTML = db[tipo].map((item, i) => `<li>${item} <button onclick="removerItem('${tipo}',${i})">×</button></li>`).join('');
    });
}

function handleLogin() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    const users = JSON.parse(localStorage.getItem('usuarios')) || [];
    const user = users.find(u => u.email === email && u.pass === pass);
    if (user) {
        document.getElementById('auth-screen').classList.remove('active');
        document.getElementById('app-content').style.display = 'flex';
        document.getElementById('welcome-user').innerText = `Olá, ${user.nome}!`;
        showSection('menu');
    } else alert("Erro no login.");
}

function toggleAuth(type) {
    document.getElementById('login-form').style.display = type === 'signup' ? 'none' : 'block';
    document.getElementById('signup-form').style.display = type === 'signup' ? 'block' : 'none';
}

function handleSignup() {
    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    const users = JSON.parse(localStorage.getItem('usuarios')) || [];
    users.push({ nome, email, pass });
    localStorage.setItem('usuarios', JSON.stringify(users));
    alert("Conta criada!"); toggleAuth('login');
}

function toggleCalendarView() {
    const el = document.getElementById('calendar-expandable');
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
    if(el.style.display === 'block') generateCalendar();
}

function logout() { location.reload(); }

window.onclick = (e) => { if (!e.target.closest('#custom-menu')) document.getElementById('custom-menu').style.display = 'none'; };

document.addEventListener('DOMContentLoaded', () => {
    // Força a tela de login inicial
    if(document.getElementById('auth-screen')) document.getElementById('auth-screen').classList.add('active');
});
