let usuarioLogado = JSON.parse(sessionStorage.getItem('SAD_PRO_USER')) || null;

document.addEventListener('DOMContentLoaded', () => {
    if (usuarioLogado) {
        document.getElementById('welcome-text').innerText = `Olá, ${usuarioLogado.nome.split(' ')[0]}!`;
        showScreen('home-screen');
    } else {
        showScreen('auth-screen');
    }
    atualizarData();
    aplicarTemaSalvo();
});

// --- SISTEMA DE MODAL (UNIFICADO) ---
function openConfirm(titulo, msg, acao, tipo = 'confirm') {
    const modal = document.getElementById('custom-confirm');
    const btnSim = document.getElementById('confirm-yes');
    const btnNao = document.getElementById('confirm-no');
    
    document.getElementById('confirm-title').innerText = titulo;
    document.getElementById('confirm-message').innerText = msg;
    
    if (tipo === 'alert') {
        btnNao.innerText = "Entendido";
        btnSim.classList.add('hidden');
    } else {
        btnNao.innerText = "Cancelar";
        btnSim.innerText = "Confirmar";
        btnSim.classList.remove('hidden');
    }

    modal.classList.remove('hidden');

    const novoBtnSim = btnSim.cloneNode(true);
    btnSim.parentNode.replaceChild(novoBtnSim, btnSim);

    novoBtnSim.onclick = () => {
        if (acao) acao();
        closeConfirm();
    };
}

function closeConfirm() {
    document.getElementById('custom-confirm').classList.add('hidden');
}

// --- TELAS ---
function showScreen(id) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('main-layout').classList.add('hidden');

    if (id === 'auth-screen') {
        document.getElementById('auth-screen').classList.remove('hidden');
    } else {
        document.getElementById('main-layout').classList.remove('hidden');
        document.getElementById(id).classList.remove('hidden');
    }

    if (id === 'lista-screen') renderTable();
    updateStats();
}

// --- CRUD ORDENS ---
const serviceForm = document.getElementById('serviceForm');
if (serviceForm) {
    serviceForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const novaOS = {
            id: Date.now(),
            cliente: document.getElementById('cli-nome').value,
            aparelho: document.getElementById('apa-nome').value,
            defeito: document.getElementById('apa-defeito').value,
            data: document.getElementById('apa-data').value,
            status: 'Pendente'
        };
        let osList = JSON.parse(localStorage.getItem('SAD_PRO_OS') || '[]');
        osList.push(novaOS);
        localStorage.setItem('SAD_PRO_OS', JSON.stringify(osList));
        this.reset();
        openConfirm("Sucesso", "Ordem de serviço registrada!", () => showScreen('lista-screen'), 'alert');
    });
}

function renderTable() {
    const tbody = document.getElementById('table-body');
    let osList = JSON.parse(localStorage.getItem('SAD_PRO_OS') || '[]');
    
    if (osList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Nenhuma ordem encontrada.</td></tr>';
        return;
    }

    tbody.innerHTML = osList.reverse().map(os => `
        <tr>
            <td><strong>${os.cliente}</strong></td>
            <td>${os.aparelho}</td>
            <td>${os.defeito}</td>
            <td><span class="status-badge ${os.status === 'Pendente' ? 'status-pendente' : 'status-concluido'}" onclick="toggleStatus(${os.id})" style="cursor:pointer">${os.status}</span></td>
            <td><button onclick="removerOS(${os.id})" class="btn-delete-table"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
}

function toggleStatus(id) {
    let osList = JSON.parse(localStorage.getItem('SAD_PRO_OS') || '[]');
    osList = osList.map(os => {
        if (os.id === id) os.status = os.status === 'Pendente' ? 'Concluído' : 'Pendente';
        return os;
    });
    localStorage.setItem('SAD_PRO_OS', JSON.stringify(osList));
    renderTable();
}

function removerOS(id) {
    openConfirm("Excluir", "Deseja apagar este registro?", () => {
        let osList = JSON.parse(localStorage.getItem('SAD_PRO_OS') || '[]');
        osList = osList.filter(o => o.id !== id);
        localStorage.setItem('SAD_PRO_OS', JSON.stringify(osList));
        renderTable();
        updateStats();
    });
}

function limparBanco() {
    openConfirm("Limpar Tudo", "Isso apagará permanentemente todos os registros!", () => {
        localStorage.removeItem('SAD_PRO_OS');
        renderTable();
        updateStats();
    });
}

// --- AUTENTICAÇÃO ---
function handleAuth() {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-pass').value;
    const isRegister = !document.getElementById('register-fields').classList.contains('hidden');
    let users = JSON.parse(localStorage.getItem('SAD_PRO_USERS') || '[]');

    if (isRegister) {
        const nome = document.getElementById('reg-nome').value;
        if (!nome || !email || !pass) {
            openConfirm("Erro", "Preencha todos os campos.", null, 'alert');
            return;
        }
        users.push({ nome, email, pass, cargo: document.getElementById('reg-cargo').value });
        localStorage.setItem('SAD_PRO_USERS', JSON.stringify(users));
        openConfirm("Sucesso", "Conta criada!", () => toggleAuthMode(), 'alert');
    } else {
        const user = users.find(u => u.email === email && u.pass === pass);
        if (user) {
            sessionStorage.setItem('SAD_PRO_USER', JSON.stringify(user));
            location.reload();
        } else {
            openConfirm("Erro", "E-mail ou senha incorretos.", null, 'alert');
        }
    }
}

function logout() {
    openConfirm("Sair", "Deseja encerrar a sessão?", () => {
        sessionStorage.clear();
        location.reload();
    });
}

// --- UTILITÁRIOS ---
function updateStats() {
    const osList = JSON.parse(localStorage.getItem('SAD_PRO_OS') || '[]');
    const counter = document.getElementById('count-total');
    if (counter) counter.innerText = osList.length;
}

function atualizarData() {
    const el = document.getElementById('current-date');
    if (el) el.innerText = new Date().toLocaleDateString('pt-br', { weekday: 'long', day: 'numeric', month: 'long' });
}

function toggleAuthMode() {
    const fields = document.getElementById('register-fields');
    fields.classList.toggle('hidden');
    const isReg = !fields.classList.contains('hidden');
    document.getElementById('auth-title').innerText = isReg ? "Criar Conta" : "Technician PRO";
    document.getElementById('btn-submit').innerText = isReg ? "Cadastrar" : "Entrar no Sistema";
    document.getElementById('auth-toggle').innerHTML = isReg ? "Já tem conta? <span>Entrar</span>" : "Não tem conta? <span>Cadastre-se</span>";
}

function toggleTheme() {
    const body = document.body;
    const isDark = body.classList.contains('dark-theme');
    body.classList.toggle('dark-theme', !isDark);
    body.classList.toggle('light-theme', isDark);
    document.getElementById('theme-icon').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('SAD_PRO_THEME', isDark ? 'light' : 'dark');
}

function aplicarTemaSalvo() {
    if (localStorage.getItem('SAD_PRO_THEME') === 'light') toggleTheme();
}

function togglePasswordVisibility(id, icon) {
    const input = document.getElementById(id);
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    icon.className = isPass ? 'fas fa-eye-slash' : 'fas fa-eye';
}
function showScreen(id) {
    // 1. Esconde todas as seções
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('main-layout').classList.add('hidden');

    // 2. Mostra a tela correta
    if (id === 'auth-screen') {
        document.getElementById('auth-screen').classList.remove('hidden');
    } else {
        document.getElementById('main-layout').classList.remove('hidden');
        document.getElementById(id).classList.remove('hidden');
    }

    // 3. ATUALIZA O BOTÃO SELECIONADO NA SIDEBAR
    document.querySelectorAll('.nav-item').forEach(btn => {
        // Remove a classe active de todos os botões
        btn.classList.remove('active');
        
        // Se o clique do botão contiver o ID da tela, adiciona active
        const acaoBotao = btn.getAttribute('onclick');
        if (acaoBotao && acaoBotao.includes(id)) {
            btn.classList.add('active');
        }
    });

    // Funções extras de carregamento
    if (id === 'lista-screen') renderTable();
    updateStats();
}
