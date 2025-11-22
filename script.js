// URL da API do IBGE para obter a lista de municípios
const IBGE_CITIES_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios';
const KNOWLEDGE_BASE_URL = 'data.json'; // URL da base de conhecimento estática

// --- VARIÁVEIS DE ESTADO E INICIALIZAÇÃO ---

// RESET CRÍTICO: Limpa o localStorage de peças para garantir um novo setup a cada visita.
localStorage.removeItem('chatSetupState');
localStorage.removeItem('setupPecas');

// Variável para armazenar a base de dados do data.json
let STATIC_KNOWLEDGE = [];

let CONVERSATION_STATE = {
    step: 'get_location', // Estado inicial
    location: null,
    pecas: [], // Lista de peças em construção
    peca_found_waiting_confirmation: null // Peça encontrada esperando 'Sim/Não'
};

// --- FUNÇÕES DE SETUP E HELPERS ---

// Função para carregar a base de conhecimento estática
async function loadStaticKnowledge() {
    try {
        const response = await fetch(KNOWLEDGE_BASE_URL);
        if (!response.ok) throw new Error('Falha ao carregar data.json.');
        STATIC_KNOWLEDGE = await response.json();
        console.log(`Base de conhecimento estática carregada: ${STATIC_KNOWLEDGE.length} itens.`);
    } catch (error) {
        console.error("Erro ao carregar base de conhecimento estática:", error);
    }
}

// Inicia o carregamento da base de dados estática
loadStaticKnowledge();

// Função que adiciona a mensagem ao DOM
function adicionarMensagem(sender, text) {
    const chatMessages = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.classList.add('message', sender);
    div.innerHTML = text.replace(/\n/g, '<br>');
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return div; // Retorna o elemento criado
}

// Função para simular a chamada de função (Tool Call) e redirecionar
function callSetupPecas(pecasData) {
    adicionarMensagem('gemini', "Ótimo! Encontrei as peças do seu setup e estou gerando a lista de preços. Redirecionando...");

    setTimeout(() => {
        // Armazena a lista final no localStorage para o lista.html acessar
        localStorage.setItem('setupPecas', JSON.stringify(pecasData));

        // Vai para a página de listagem
        window.location.href = 'lista.html';
    }, 2000);
}

/**
 * Pesquisa flexível na base de conhecimento estática.
 * @param {string} searchText - O texto de busca do usuário.
 * @returns {Object|null} A peça encontrada ou null.
 */
function findPecaInKnowledgeBase(searchText) {
    // Normaliza o texto de busca (minúsculas e remove caracteres não alfanuméricos)
    const normalizedSearch = searchText.toLowerCase().replace(/[^a-z0-9]/g, '');

    for (const peca of STATIC_KNOWLEDGE) {
        const normalizedName = peca.nome.toLowerCase().replace(/[^a-z0-9]/g, '');

        // Critério 1: Contém o texto de busca normalizado no nome da peça
        if (normalizedName.includes(normalizedSearch) && normalizedSearch.length >= 5) {
            return peca;
        }

        // Critério 2: Contém a maioria das palavras-chave (para ser mais robusto)
        const searchWords = normalizedSearch.split(' ').filter(w => w.length > 2);
        let matchCount = 0;

        for (const word of searchWords) {
            if (normalizedName.includes(word)) {
                matchCount++;
            }
        }
        // Se a maioria das palavras (pelo menos 75%) corresponder
        if (searchWords.length > 0 && matchCount / searchWords.length >= 0.75) {
             return peca;
        }
    }
    return null;
}

// --- FUNÇÃO PRINCIPAL DE PROCESSAMENTO E SIMULAÇÃO ---
async function processUserMessage(userMessage) {
    let responseText = '';

    // --- ETAPA 1: OBTENÇÃO DA LOCALIZAÇÃO ---
    if (CONVERSATION_STATE.step === 'get_location') {

        const loadingMessageElement = adicionarMensagem('gemini', 'Verificando localização...');

        try {
            const citiesResponse = await fetch(IBGE_CITIES_URL);
            const cities = await citiesResponse.json();

            // Tenta encontrar a cidade ou estado do usuário
            const foundCity = cities.find(c =>
                c.nome.toLowerCase() === userMessage.toLowerCase() ||
                (c.municipio && c.municipio.nome.toLowerCase() === userMessage.toLowerCase()) ||
                (c.microrregiao && c.microrregiao.mesorregiao.UF.nome.toLowerCase().includes(userMessage.toLowerCase()))
            );

            loadingMessageElement.remove();

            if (foundCity) {
                const uf = foundCity.microrregiao.mesorregiao.UF.sigla;
                const nomeCidade = foundCity.nome || foundCity.municipio.nome;

                CONVERSATION_STATE.location = `${nomeCidade}/${uf}`;
                CONVERSATION_STATE.step = 'get_pecas'; // SOMENTE AQUI MUDA PARA O PRÓXIMO PASSO

                responseText = `✅ Localização definida como <strong>${nomeCidade}/${uf}</strong>. Agora, me diga qual <strong>CPU</strong> (processador) você gostaria de precificar ou usar no seu setup?`;

            } else {
                responseText = "❌ Não consegui confirmar essa localização. Por favor, tente novamente digitando o nome completo da sua cidade e estado (Ex: <strong>São Paulo/SP</strong>).";
            }
        } catch (error) {
            loadingMessageElement.remove();
            console.error("Erro ao buscar API do IBGE:", error);
            responseText = "Desculpe, a busca por cidades falhou. Por favor, insira o nome da sua cidade/estado para continuarmos.";
        }
    }

    // --- ETAPA 2: OBTENÇÃO E BUSCA DE PEÇAS ---
    else if (CONVERSATION_STATE.step === 'get_pecas') {

        userMessage = userMessage.toLowerCase().trim();

        // Lógica para finalizar a lista
        if (userMessage.includes("finalizar") || userMessage.includes("pronto") || userMessage.includes("ver lista")) {
            if (CONVERSATION_STATE.pecas.length >= 1) { // Permite finalizar com pelo menos 1 peça
                callSetupPecas(CONVERSATION_STATE.pecas);
                return;
            } else {
                responseText = "Você ainda não adicionou nenhuma peça. Por favor, me diga pelo menos a CPU antes de finalizar.";
            }
        } else if (userMessage.length < 3) {
            responseText = "O nome da peça é muito curto. Tente ser mais específico.";
        }
        
        // 1. Buscando a peça na base de conhecimento estática
        const pecaEncontrada = findPecaInKnowledgeBase(userMessage);

        if (pecaEncontrada) {
            // PEÇA ENCONTRADA NA BASE! Entra em estado de confirmação.
            CONVERSATION_STATE.step = 'confirm_peca';
            // Armazena a peça encontrada esperando a confirmação
            CONVERSATION_STATE.peca_found_waiting_confirmation = pecaEncontrada;

            responseText = `Encontrei uma peça em nossa base de dados que corresponde a <strong>${pecaEncontrada.nome}</strong> (Tipo: ${pecaEncontrada.tipo}) com preços já definidos.`;
            responseText += `\n\nConfirma que esta é a peça que você deseja adicionar? <strong>(Sim/Não)</strong>`;

        } else {
            // PEÇA NÃO ENCONTRADA NA BASE: Segue a simulação de precificação aleatória (lógica original)

            const pecaNome = userMessage.split(' ').slice(-3).join(' ').replace(/,/g, '');
            // Simulação de valores e tipo (melhorado com IA simulada):
            const tipo = userMessage.includes("rtx") || userMessage.includes("gtx") || userMessage.includes("radeon") ? "GPU" :
                         userMessage.includes("ryzen") || userMessage.includes("intel") ? "CPU" :
                         userMessage.includes("ram") || userMessage.includes("memoria") ? "RAM" :
                         "Outros";

            const min = Math.floor(Math.random() * 500) + 200;
            const max = min + Math.floor(Math.random() * 800);

            const novaPeca = {
                id: Date.now().toString() + CONVERSATION_STATE.pecas.length, // ID único simples
                nome: pecaNome.charAt(0).toUpperCase() + pecaNome.slice(1),
                tipo: tipo,
                precoMin: min,
                precoMax: max,
                localizacao: CONVERSATION_STATE.location
            };

            CONVERSATION_STATE.pecas.push(novaPeca);

            responseText = `Entendido! Adicionei <strong>${novaPeca.nome}</strong> (Tipo: ${tipo}) com preços <strong>estimados</strong> (Não estava na nossa base). Agora temos <strong>${CONVERSATION_STATE.pecas.length}</strong> peças. Qual o próximo componente (ex: Placa-Mãe, Fonte, etc.) ou diga "<strong>Finalizar</strong>" para ver a avaliação de preços.`;
        }
    }
    // --- ETAPA 3: CONFIRMAÇÃO DE PEÇA ENCONTRADA NA BASE ---
    else if (CONVERSATION_STATE.step === 'confirm_peca') {
        userMessage = userMessage.toLowerCase().trim();
        const pecaConfirmada = CONVERSATION_STATE.peca_found_waiting_confirmation;

        if (userMessage === 'sim' || userMessage === 's' || userMessage.includes('sim')) {
            // Adiciona a peça da base de conhecimento
            if (pecaConfirmada) {
                // Cria um novo objeto para não modificar a base estática
                const pecaToAdd = {
                    // Novo ID para a lista de setup
                    id: Date.now().toString() + CONVERSATION_STATE.pecas.length,
                    nome: pecaConfirmada.nome,
                    tipo: pecaConfirmada.tipo,
                    precoMin: pecaConfirmada.precoMin,
                    precoMax: pecaConfirmada.precoMax,
                    link: pecaConfirmada.link || '',
                    localizacao: CONVERSATION_STATE.location // Usa a localização do usuário
                };

                CONVERSATION_STATE.pecas.push(pecaToAdd);

                responseText = `✅ Peça <strong>${pecaToAdd.nome}</strong> adicionada usando a base de conhecimento. Agora temos <strong>${CONVERSATION_STATE.pecas.length}</strong> peças. Qual o próximo componente ou diga "<strong>Finalizar</strong>" para ver a avaliação de preços.`;
            }

            // Volta ao estado de espera de novas peças
            CONVERSATION_STATE.step = 'get_pecas';
            CONVERSATION_STATE.peca_found_waiting_confirmation = null;

        } else if (userMessage === 'nao' || userMessage === 'n' || userMessage.includes('nao')) {
            // Ignora a peça encontrada e pede a peça novamente
            responseText = "Entendido. Qual o nome da peça que você realmente gostaria de adicionar? Tente ser mais específico.";

            // Volta ao estado de espera de novas peças
            CONVERSATION_STATE.step = 'get_pecas';
            CONVERSATION_STATE.peca_found_waiting_confirmation = null;

        } else {
            // Resposta inválida
            responseText = `Não entendi. Por favor, responda com "<strong>Sim</strong>" ou "<strong>Não</strong>" para confirmar a peça <strong>${pecaConfirmada.nome}</strong>.`;
        }
    }


    // Salva o estado atual no localStorage e exibe a mensagem de resposta
    if (responseText) {
        localStorage.setItem('chatSetupState', JSON.stringify(CONVERSATION_STATE));
        adicionarMensagem('gemini', responseText);
    }
}
// --- FIM DA FUNÇÃO PRINCIPAL ---


// Função que lida com o envio do formulário
document.getElementById('chat-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const userMessage = input.value.trim();
    input.value = '';

    if (!userMessage) return;

    // Desabilita input e botão para evitar múltiplos cliques
    input.disabled = true;
    document.querySelector('#chat-form button').disabled = true;

    adicionarMensagem('user', userMessage);

    // Processa a mensagem no fluxo estático
    await processUserMessage(userMessage);

    // Reabilita input e botão
    input.disabled = false;
    document.querySelector('#chat-form button').disabled = false;
    input.focus();
});
