// URL SIMULADA DA BASE INICIAL (Arquivo estático)
const DATA_FILE_URL = 'data.json';

// Inicializando a Variável Global para armazenar a lista de peças atual
let listaPecasAtual = [];

// --- FUNÇÃO DE PERSISTÊNCIA ---
// Salva o estado atual da lista no localStorage
function savePecas() {
    localStorage.setItem('pecasList', JSON.stringify(listaPecasAtual));
}

// Função auxiliar para calcular totais (usada também no server.js original)
function calcularTotais(pecas) {
    const totalAtual = pecas.reduce((acc, p) => {
        const valorAtual = (p.precoMin + p.precoMax) / 2;
        return acc + valorAtual;
    }, 0);

    const totalRevenda = totalAtual * 0.8; 
    return { totalAtual, totalRevenda };
}

// Função para carregar e renderizar a lista
async function carregarPecas() {
    const setupDataJSON = localStorage.getItem('setupPecas');
    const pecasListJSON = localStorage.getItem('pecasList');
    let pecasToRender = [];
    
    // 1. Prioridade: Lista gerada pelo Chat Setup (index.html)
    if (setupDataJSON) {
        console.log('Carregando lista do Chat Setup.');
        pecasToRender = JSON.parse(setupDataJSON);
        localStorage.removeItem('setupPecas'); // Limpa a lista de setup após o primeiro uso
        
    } 
    // 2. Segunda Prioridade: Lista da última sessão (localStorage)
    else if (pecasListJSON) {
        console.log('Carregando lista da última sessão.');
        pecasToRender = JSON.parse(pecasListJSON);
        
    } 
    // 3. Última Prioridade: Carregar do arquivo data.json
    else {
        console.log('Carregando lista inicial do data.json.');
        try {
            const response = await fetch(DATA_FILE_URL);
            if (!response.ok) throw new Error('Falha ao carregar data.json.');
            pecasToRender = await response.json();
        } catch (error) {
            console.warn('Não foi possível carregar data.json ou a lista está vazia.', error);
            pecasToRender = [];
        }
    }
    
    // Atribui ao array global e salva no localStorage para persistência
    listaPecasAtual = pecasToRender;
    savePecas(); 

    // --- CÁLCULO E RENDERIZAÇÃO ---
    
    const { totalAtual, totalRevenda } = calcularTotais(listaPecasAtual);

    const listaCorpo = document.getElementById('lista-corpo');
    listaCorpo.innerHTML = ''; 

    document.getElementById('total-atual').textContent = totalAtual.toFixed(2);
    document.getElementById('total-revenda').textContent = totalRevenda.toFixed(2);

    listaPecasAtual.forEach((peca, index) => {
        // Garante que a peça tem um ID único. Usaremos um timestamp/string simples no estático
        if (!peca.id) peca.id = Date.now().toString() + index; 
        
        const tr = document.createElement('tr');
        const searchUrl = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(peca.nome)}`;
        
        // Calcula os valores estimados localmente (já que o server não faz mais isso)
        const valorAtual = ((peca.precoMin + peca.precoMax) / 2).toFixed(2);
        const revendaEstimada = (valorAtual * 0.8).toFixed(2);
        
        tr.innerHTML = `
            <td>${peca.id.slice(-4)}</td> 
            <td>${peca.nome}</td>
            <td>${peca.tipo}</td>
            <td>${peca.precoMin.toFixed(2)}</td>
            <td>${peca.precoMax.toFixed(2)}</td>
            <td><strong>${valorAtual}</strong></td>
            <td><strong>${revendaEstimada}</strong></td>
            <td><a href="${searchUrl}" target="_blank" rel="noopener noreferrer">Buscar Preço</a></td>
            <td class="actions">
                <button onclick="editarPeca('${peca.id}')">Editar</button>
                <button class="delete" onclick="excluirPeca('${peca.id}')">Excluir</button>
            </td>
        `;
        listaCorpo.appendChild(tr);
    });
}

// Função para Adicionar ou Atualizar peça (Manipula localStorage)
document.getElementById('peca-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const id = document.getElementById('peca-id').value;
    const nome = document.getElementById('nome').value;
    const tipo = document.getElementById('tipo').value;
    const precoMin = parseFloat(document.getElementById('precoMin').value) || 0;
    const precoMax = parseFloat(document.getElementById('precoMax').value) || 0;
    const link = document.getElementById('link').value;
    
    // 1. MODO DE EDIÇÃO
    if (id) { 
        const index = listaPecasAtual.findIndex(p => p.id === id);
        if (index !== -1) {
            listaPecasAtual[index] = {
                ...listaPecasAtual[index], // Mantém dados existentes como localização
                nome,
                tipo,
                precoMin,
                precoMax,
                link };
        }

    // 2. MODO DE ADIÇÃO
    } else { 
        // Cria um ID único no Front-end (timestamp)
        const newId = Date.now().toString(); 
        const novaPeca = { 
            id: newId, 
            nome, 
            tipo, 
            precoMin, 
            precoMax,
            link,
            localizacao: 'Manual (Estático)'
        };
        listaPecasAtual.push(novaPeca);
    }

    // Salva, limpa o formulário e recarrega a lista
    savePecas(); 
    limparFormulario();
    carregarPecas();

});

// Função para preencher o formulário no modo de Edição (Permanece igual)
function editarPeca(id) {
    const peca = listaPecasAtual.find(p => p.id === id);
    if (!peca) return; // Se a peça não for encontrada, não faz nada

    document.getElementById('peca-id').value = peca.id;
    document.getElementById('nome').value = peca.nome;
    document.getElementById('tipo').value = peca.tipo;
    document.getElementById('precoMin').value = peca.precoMin;
    document.getElementById('precoMax').value = peca.precoMax;
    document.getElementById('link').value = peca.link || ''; // Preenche o campo de link

    document.getElementById('submit-button').textContent = 'Salvar Edição';
    document.getElementById('cancel-edit').style.display = 'inline';
    window.scrollTo(0, 0); 
}

// Função para cancelar o modo de Edição (Permanece igual)
document.getElementById('cancel-edit').addEventListener('click', limparFormulario);

// Função para Limpar o Formulário (Permanece igual)
function limparFormulario() {
    document.getElementById('peca-form').reset();
    document.getElementById('peca-id').value = '';
    document.getElementById('submit-button').textContent = 'Adicionar Peça';
    document.getElementById('cancel-edit').style.display = 'none';
}

// Função para Excluir peça (Manipula localStorage)
async function excluirPeca(id) {
    if (!confirm('Tem certeza que deseja excluir esta peça?')) return;

    // Filtra a lista, mantendo todas as peças cujo ID NÃO seja o ID a ser excluído
    listaPecasAtual = listaPecasAtual.filter(p => p.id !== id);
    
    savePecas(); // Salva a lista atualizada
    carregarPecas(); // Recarrega a lista
}

// --- LÓGICA DO CHAT CRUD (Removido o fetch para a API do Gemini) ---

// Apenas a lógica de toggle do chat permanece (O CRUD em si não funcionará sem o Gemini)
// const chatCrudContainer = document.getElementById('chat-crud-container');
// const chatCrudToggle = document.getElementById('chat-crud-toggle');
// const chatCrudHeader = document.getElementById('chat-crud-header');

// // Inicia o chat aberto
// chatCrudContainer.style.display = 'flex';
// chatCrudToggle.style.display = 'none';

// chatCrudHeader.addEventListener('click', () => {
//     chatCrudContainer.style.display = 'none';
//     chatCrudToggle.style.display = 'block';
// });

// chatCrudToggle.addEventListener('click', () => {
//     chatCrudContainer.style.display = 'flex';
//     chatCrudToggle.style.display = 'none';
// });

// // Opcional: Adiciona um aviso de que o chat CRUD está desativado no modo estático
// function adicionarCrudMessage(sender, responseData) { 
//     const chatMessages = document.getElementById('chat-crud-messages');
//     const text = (typeof responseData === 'string' ? responseData : responseData.response || '');
//     // ... (código para renderizar a mensagem) ...
//     // Simplificado para o contexto do estático
//     const div = document.createElement('div');
//     div.style.marginBottom = '10px';
//     div.style.textAlign = (sender === 'user' ? 'right' : 'left');
//     const span = document.createElement('span');
//     span.style.padding = '8px';
//     span.style.borderRadius = '12px';
//     span.style.maxWidth = '80%';
//     span.style.backgroundColor = (sender === 'user' ? '#dc3545' : '#f8d7da');
//     span.style.color = (sender === 'user' ? 'white' : '#333');
//     span.innerHTML = text.replace(/\n/g, '<br>');
//     div.appendChild(span);
//     chatMessages.appendChild(div);
//     chatMessages.scrollTop = chatMessages.scrollHeight;
// }

// document.getElementById('chat-crud-form').addEventListener('submit', function(e) {
//     e.preventDefault();
//     const input = document.getElementById('chat-crud-input');
//     const userMessage = input.value.trim();
//     input.value = '';
//     if (!userMessage) return;

//     adicionarCrudMessage('user', userMessage);
    
//     // SIMULAÇÃO: O chat CRUD não funciona no modo estático
//     setTimeout(() => {
//         adicionarCrudMessage('gemini', '❌ Este chat de gerenciamento está desativado no modo estático do projeto. Use o formulário acima para adicionar e editar peças. O ID do MongoDB (final 4 dígitos) não é usado aqui.');
//     }, 500);
// });

// --- LÓGICA DOS NOVOS BOTÕES ---

// Botão Limpar Lista (Manipula localStorage)
document.getElementById('clear-button').addEventListener('click', () => {
    if (!confirm('ATENÇÃO: Isso apagará TODAS as peças da lista permanentemente. Deseja continuar?')) {
        return;
    }
    // Limpa o array global e o localStorage
    listaPecasAtual = [];
    localStorage.removeItem('pecasList');
    carregarPecas();
    alert('Lista de peças limpa com sucesso!');
});

// Botão Imprimir Lista (Permanece igual)
document.getElementById('print-button').addEventListener('click', () => {
    window.print();
});

// --- Inicialização ---

// Mensagem inicial no chat CRUD (Aviso de desativação)
// adicionarCrudMessage('gemini', "🚨 Aviso: O chat CRUD está desativado no modo estático. Use o formulário manual acima.");

// Inicia o carregamento da lista
carregarPecas();
