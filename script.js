// --- CONFIGURAÇÕES GLOBAIS ---
const slots = ["07:20 - 08:10", "08:10 - 09:00", "09:20 - 10:10", "10:10 - 11:00", "11:00 - 11:50", "12:00 - 13:00", "13:10 - 14:00", "14:00 - 14:50", "15:10 - 16:00", "16:00 - 16:50"];
let currentLab = "";
let selectedDate = new Date().toISOString().split('T')[0];

// --- AUTH E NAVEGAÇÃO ---
function toggleAuth(type) {
    document.getElementById('login-form').style.display = type === 'signup' ? 'none' : 'block';
    document.getElementById('signup-form').style.display = type === 'signup' ? 'block' : 'none';
}

function handleSignup() {
    const nome = document.getElementById('reg-nome').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-pass').value;

    if (!nome || !email || !pass) return alert("Preencha todos os campos");
    if (!email.endsWith("@gmail.com")) return alert("Use um e-mail @gmail.com");

    localStorage.setItem('user', JSON.stringify({ nome, email }));
    alert("Conta criada com sucesso! Faça login.");
    toggleAuth('login');
}

function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    if (email.endsWith("@gmail.com")) {
        document.getElementById('auth-screen').classList.remove('active');
        document.getElementById('app-content').style.display = 'flex';
        showSection('menu');
        initCalendarControls();
    } else {
        alert("Acesse com e-mail @gmail.com");
    }
}

function showSection(id) {
    document.querySelectorAll('.app-section').forEach(s => s.classList.remove('active'));
    const target = id === 'menu' ? 'main-menu' : `sec-${id}`;
    document.getElementById(target).classList.add('active');
    if(id === 'cadastros') renderListasCadastros();
}

function openLab(name) {
    currentLab = name;
    document.getElementById('currentLabTitle').innerText = name;
    showSection('reservas');
    updateGlobalDate();
}

// --- CALENDÁRIO ---
function toggleCalendarView() {
    const el = document.getElementById('calendar-expandable');
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
    if(el.style.display === 'block') generateCalendar();
}

function initCalendarControls() {
    const mSel = document.getElementById('reserva-month');
    const ySel = document.getElementById('reserva-year');
    if(!mSel || mSel.options.length > 0) return;
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    meses.forEach((m, i) => mSel.add(new Option(m, i)));
    for(let i=2026; i<=2030; i++) ySel.add(new Option(i, i));
    mSel.value = new Date().getMonth(); 
    ySel.value = new Date().getFullYear();
}

function generateCalendar() {
    const month = parseInt(document.getElementById('reserva-month').value);
    const year = parseInt(document.getElementById('reserva-year').value);
    const grid = document.getElementById('calendar-grid');
    if(!grid) return;
    grid.innerHTML = "";
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for(let i=0; i<firstDay; i++) grid.appendChild(document.createElement('div'));

    for(let d=1; d<=daysInMonth; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        if(dateStr === selectedDate) dayEl.classList.add('selected');

        const mark = JSON.parse(localStorage.getItem(`mark-${dateStr}`));
        if(mark) {
            dayEl.classList.add(mark.type);
            dayEl.innerHTML = `<span>${d}</span><span class="day-label">${mark.desc}</span>`;
        } else {
            dayEl.innerHTML = `<span>${d}</span>`;
        }

        dayEl.onclick = () => { selectedDate = dateStr; updateGlobalDate(); generateCalendar(); };
        dayEl.oncontextmenu = (e) => { e.preventDefault(); openEventModal(dateStr); };
        grid.appendChild(dayEl);
    }
}

// --- MODAIS E EVENTOS ---
function openEventModal(date) {
    selectedDate = date;
    document.getElementById('modal-date-display').innerText = date.split('-').reverse().join('/');
    document.getElementById('event-modal').style.display = 'flex';
}

function closeEventModal() { document.getElementById('event-modal').style.display = 'none'; }

function saveEvent() {
    const type = document.getElementById('event-type').value;
    const desc = document.getElementById('event-desc').value;
    if(type === 'normal') localStorage.removeItem(`mark-${selectedDate}`);
    else localStorage.setItem(`mark-${selectedDate}`, JSON.stringify({type, desc}));
    closeEventModal();
    generateCalendar();
    updateGlobalDate();
}

function updateGlobalDate() {
    const [y, m, d] = selectedDate.split('-');
    const label = document.getElementById('selected-date-label');
    if(label) label.innerText = `Horários para: ${d}/${m}/${y}`;
    renderTable();
}

// --- GESTÃO DE DADOS (CADASTROS) ---
function cadastrarItem(tipo, inputId) {
    const input = document.getElementById(inputId);
    let val = input.value.trim(); 
    if(!val) return;
    
    let lista = JSON.parse(localStorage.getItem(tipo)) || [];
    if(!lista.includes(val)) lista.push(val);
    
    localStorage.setItem(tipo, JSON.stringify(lista));
    input.value = ""; 
    renderListasCadastros();
}

function renderListasCadastros() {
    ['professores', 'turmas', 'monitores'].forEach(tipo => {
        const lista = JSON.parse(localStorage.getItem(tipo)) || [];
        const el = document.getElementById(`list-${tipo}`);
        if(el) {
            el.innerHTML = lista.map(i => `
                <li>
                    ${i} 
                    <button onclick="removerItem('${tipo}','${i}')">×</button>
                </li>
            `).join('');
        }
    });
}

function removerItem(tipo, item) {
    let lista = JSON.parse(localStorage.getItem(tipo)) || [];
    lista = lista.filter(i => i !== item);
    localStorage.setItem(tipo, JSON.stringify(lista));
    renderListasCadastros();
}

// --- RENDERIZAÇÃO DA TABELA ---
function renderTable() {
    const tbody = document.getElementById('tableBody');
    if(!tbody || !currentLab) return;
    const profs = JSON.parse(localStorage.getItem('professores')) || [];
    const turmas = JSON.parse(localStorage.getItem('turmas')) || [];

    tbody.innerHTML = slots.map((slot, i) => {
        const key = `res-${currentLab}-${selectedDate}-${slot}`;
        const data = JSON.parse(localStorage.getItem(key)) || {p:'', t:''};
        return `<tr>
            <td><strong>${slot}</strong></td>
            <td><select onchange="saveRes('${slot}',${i},'p')" id="p-${i}">
                <option value="">Selecione...</option>
                ${profs.map(p=>`<option value="${p}" ${data.p===p?'selected':''}>${p}</option>`).join('')}
            </select></td>
            <td><select onchange="saveRes('${slot}',${i},'t')" id="t-${i}">
                <option value="">Turma</option>
                ${turmas.map(t=>`<option value="${t}" ${data.t===t?'selected':''}>${t}</option>`).join('')}
            </select></td>
        </tr>`;
    }).join('');
}

function saveRes(slot, i, field) {
    const val = document.getElementById(`${field}-${i}`).value;
    const key = `res-${currentLab}-${selectedDate}-${slot}`;
    const data = JSON.parse(localStorage.getItem(key)) || {p:'', t:''};
    data[field] = val;
    localStorage.setItem(key, JSON.stringify(data));
}

function logout() { location.reload(); }