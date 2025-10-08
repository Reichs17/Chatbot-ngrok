const chat = document.getElementById("chat");
const input = document.getElementById("input");
const send = document.getElementById("send");
const messages = document.getElementById("messages");

// Estado do chatbot
let isProcessing = false;
let currentSessionId = generateSessionId();

// Gerar ID único para sessão
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Adicionar mensagem inicial
window.addEventListener('DOMContentLoaded', () => {
    addBotMessage("Olá! Sou o Kojima, seu assistente virtual de saúde. 😊\n\nEstou aqui para ajudar com dúvidas médicas, sintomas e orientações de saúde. Como posso ajudá-lo hoje?\n\n💡 *Cada conversa é independente - recarregue a página para começar uma nova conversa*");
    
    // Mostrar session ID no console para debug
    console.log("Nova sessão iniciada:", currentSessionId);
});

function addBotMessage(text, isContextual = false) {
    const botMsg = document.createElement("div");
    botMsg.className = "message bot";
    
    let messageContent = text;
    if (isContextual) {
        messageContent = "🧠 " + messageContent;
    }
    
    botMsg.innerHTML = messageContent.replace(/\n/g, '<br>');
    messages.appendChild(botMsg);
    messages.scrollTop = messages.scrollHeight;
}

function addUserMessage(text) {
    const userMsg = document.createElement("div");
    userMsg.className = "message user";
    userMsg.textContent = text;
    messages.appendChild(userMsg);
    messages.scrollTop = messages.scrollHeight;
}

async function sendToOllama(prompt, sessionId) {
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                sessionId: sessionId
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || `Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao conectar com Ollama:', error);
        throw new Error(error.message || 'Não foi possível conectar ao serviço de IA.');
    }
}

async function sendMessage() {
    const text = input.value.trim();
    if (!text || isProcessing) return;

    isProcessing = true;
    chat.classList.add("active");
    
    // Mensagem do usuário
    addUserMessage(text);
    input.value = "";

    // Mensagem de "digitando"
    const typingMsg = document.createElement("div");
    typingMsg.className = "message bot";
    typingMsg.innerHTML = "🤔 <em>Pensando e consultando o histórico...</em>";
    typingMsg.id = "typing-message";
    messages.appendChild(typingMsg);
    messages.scrollTop = messages.scrollHeight;

    try {
        console.log("Enviando para Ollama (sessão:", currentSessionId, "):", text);
        
        const response = await sendToOllama(text, currentSessionId);
        
        // Remover mensagem de "digitando"
        document.getElementById('typing-message')?.remove();
        
        // Não atualizamos o sessionId - mantemos o mesmo
        // currentSessionId permanece igual
        
        // Mostrar indicador de contexto se houver histórico
        const isContextual = response.messageCount > 1;
        addBotMessage(response.response, isContextual);
        
    } catch (err) {
        console.error("Erro:", err);
        document.getElementById('typing-message')?.remove();
        addBotMessage(`❌ Oops! Encontrei um problema:\n\n${err.message}\n\n💡 Verifique se o Ollama está rodando no terminal com o comando "ollama serve".`);
    }

    isProcessing = false;
    messages.scrollTop = messages.scrollHeight;
}

// Event listeners
send.addEventListener("click", sendMessage);
input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

// Sistema de sugestões
const suggestions = [ 
    "Dor de cabeça forte, o que pode ser?", 
    "Engasgo com comida, o que fazer?",
    "Sintomas de gripe, o que devo fazer?",
    "Quais são os sintomas de COVID-19?",
    "O que fazer em caso de queimadura?",
    "Como tratar uma entorse?",
    "O que é pressão alta e como controlá-la?",
    "Quais são os sintomas de diabetes?",
];

const suggestionBox = document.querySelector(".suggestion");
let currentSuggestionIndex = 0;

function showNextSuggestion() {
    if (suggestionBox) {
        suggestionBox.textContent = suggestions[currentSuggestionIndex];
        currentSuggestionIndex = (currentSuggestionIndex + 1) % suggestions.length;
    }
}

// Iniciar sugestões apenas se o elemento existir
if (suggestionBox) {
    setInterval(showNextSuggestion, 3000);
    showNextSuggestion();

    suggestionBox.addEventListener("click", () => {
        if (suggestionBox.textContent && suggestionBox.textContent !== "Nenhuma sugestão encontrada") {
            input.value = suggestionBox.textContent;
            input.focus();
        }
    });
}

// Sugestões flutuantes
const toggleBtn = document.querySelector(".suggestion-button");
if (toggleBtn) {
    const floatingBox = document.createElement("div");
    floatingBox.classList.add("floating-suggestions");
    document.body.appendChild(floatingBox);

    suggestions.forEach(sug => {
        const sugDiv = document.createElement("div");
        sugDiv.classList.add("suggestion-item");
        sugDiv.textContent = sug;
        floatingBox.appendChild(sugDiv);
        sugDiv.addEventListener("click", () => {
            input.value = sug;
            floatingBox.classList.remove("active");
            input.focus();
        });
    });

    toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        floatingBox.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
        if (!floatingBox.contains(e.target) && e.target !== toggleBtn) {
            floatingBox.classList.remove("active");
        }
    });
}

// Reconhecimento de voz
const speakButton = document.getElementById("speak");
if (speakButton) {
    speakButton.addEventListener("click", () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = false;
        recognition.interimResults = false;

        speakButton.textContent = "🔴";
        speakButton.style.background = "#ff4444";
        
        recognition.start();

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            input.value = transcript;
            speakButton.textContent = "🎤";
            speakButton.style.background = "";
        };

        recognition.onerror = (event) => {
            console.error("Erro de reconhecimento de fala:", event.error);
            speakButton.textContent = "🎤";
            speakButton.style.background = "";
            if (event.error === 'not-allowed') {
                alert("Permissão de microfone negada. Por favor, permita o acesso ao microfone.");
            }
        };

        recognition.onend = () => {
            speakButton.textContent = "🎤";
            speakButton.style.background = "";
        };
    });
}

// Focar no input quando a página carregar
window.addEventListener('load', () => {
    input.focus();
});