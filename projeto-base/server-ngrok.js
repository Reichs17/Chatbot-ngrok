const express = require("express");
const path = require('path');
const http = require('http');
const fs = require('fs');

const app = express();
const PORT = 3000;
const OLLAMA_PORT = 11434;

// Array para armazenar perguntas em memória
let questionsLog = [];

// Objeto para armazenar sessões de conversa
let conversations = {};
const CONVERSATIONS_FILE = 'conversations.json';

// Carregar conversas salvas
function loadConversations() {
  try {
    if (fs.existsSync(CONVERSATIONS_FILE)) {
      const data = fs.readFileSync(CONVERSATIONS_FILE, 'utf8');
      conversations = JSON.parse(data);
      console.log(`📚 Conversas carregadas: ${Object.keys(conversations).length} sessões`);
    }
  } catch (error) {
    console.error('Erro ao carregar conversas:', error);
  }
}

// Salvar conversas
function saveConversations() {
  try {
    fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(conversations, null, 2));
  } catch (error) {
    console.error('Erro ao salvar conversas:', error);
  }
}

// Carregar conversas ao iniciar
loadConversations();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Log de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url} - IP: ${getClientIp(req)}`);
  next();
});

// Função para obter IP real do cliente
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',');
    return ips[0].trim();
  }
  return req.connection.remoteAddress || req.socket.remoteAddress || 'IP não detectado';
}

// Função para obter informações do user agent
function getUserAgentInfo(req) {
  const userAgent = req.headers['user-agent'] || 'Desconhecido';
  
  let device = 'Desktop';
  let browser = 'Desconhecido';
  
  if (userAgent.includes('Mobile')) device = 'Mobile';
  if (userAgent.includes('Tablet')) device = 'Tablet';
  
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  return {
    userAgent: userAgent,
    device: device,
    browser: browser
  };
}

// Função para obter ou criar sessão (APENAS por sessionId)
function getSession(sessionId) {
  if (!sessionId) {
    // Se não há sessionId, criar uma nova sessão
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  if (!conversations[sessionId]) {
    conversations[sessionId] = {
      id: sessionId,
      created: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 0,
      history: []
    };
    saveConversations();
  }
  
  return conversations[sessionId];
}

// Função para adicionar mensagem à sessão
function addToSession(sessionId, role, content) {
  const session = conversations[sessionId];
  if (!session) return;
  
  const message = {
    role: role,
    content: content,
    timestamp: new Date().toISOString(),
    time: new Date().toLocaleTimeString('pt-BR')
  };
  
  session.history.push(message);
  session.messageCount++;
  session.lastActivity = new Date().toISOString();
  
  // Manter apenas as últimas 20 mensagens para não sobrecarregar
  if (session.history.length > 20) {
    session.history = session.history.slice(-20);
  }
  
  saveConversations();
  return message;
}

// Função para salvar pergunta com IP
function saveQuestion(userMessage, clientInfo, sessionId = null, timestamp = new Date()) {
  const questionEntry = {
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    timestamp: timestamp.toISOString(),
    question: userMessage,
    ip: clientInfo.ip,
    sessionId: sessionId,
    userAgent: clientInfo.userAgent,
    device: clientInfo.device,
    browser: clientInfo.browser,
    time: timestamp.toLocaleTimeString('pt-BR'),
    date: timestamp.toLocaleDateString('pt-BR')
  };
  
  // Adicionar ao log em memória
  questionsLog.unshift(questionEntry);
  
  // Manter apenas as últimas 2000 perguntas
  if (questionsLog.length > 2000) {
    questionsLog = questionsLog.slice(0, 2000);
  }
  
  // Salvar em arquivo
  try {
    const logEntry = `${timestamp.toISOString()} | IP: ${clientInfo.ip} | Sessão: ${sessionId} | PERGUNTA: ${userMessage}\n`;
    fs.appendFileSync('questions_log.txt', logEntry, 'utf8');
  } catch (error) {
    console.error('Erro ao salvar log:', error);
  }
  
  console.log(`💾 Pergunta salva (sessão: ${sessionId}): ${userMessage.substring(0, 50)}...`);
  return questionEntry;
}

// Rota principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para o painel de administração
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor Kojima funcionando',
    timestamp: new Date().toISOString(),
    totalQuestions: questionsLog.length,
    totalSessions: Object.keys(conversations).length,
    yourIp: getClientIp(req)
  });
});

// Rota para obter todas as perguntas
app.get('/api/questions', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const page = parseInt(req.query.page) || 1;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const paginatedQuestions = questionsLog.slice(startIndex, endIndex);
  
  res.json({
    questions: paginatedQuestions,
    total: questionsLog.length,
    page: page,
    totalPages: Math.ceil(questionsLog.length / limit),
    hasNext: endIndex < questionsLog.length,
    hasPrev: page > 1
  });
});

// Rota para obter sessões
app.get('/api/sessions', (req, res) => {
  const sessions = Object.values(conversations)
    .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
    .map(session => ({
      id: session.id,
      created: session.created,
      lastActivity: session.lastActivity,
      messageCount: session.messageCount,
      historyPreview: session.history.slice(-3).map(msg => ({
        role: msg.role,
        content: msg.content.substring(0, 100) + '...',
        time: msg.time
      }))
    }));
  
  res.json({
    sessions: sessions,
    total: sessions.length
  });
});

// Rota para obter detalhes de uma sessão
app.get('/api/sessions/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  const session = conversations[sessionId];
  
  if (!session) {
    return res.status(404).json({ error: 'Sessão não encontrada' });
  }
  
  res.json(session);
});

// Rota para buscar perguntas
app.get('/api/questions/search', (req, res) => {
  const query = req.query.q?.toLowerCase();
  if (!query) {
    return res.status(400).json({ error: 'Parâmetro de busca (q) é obrigatório' });
  }
  
  const filteredQuestions = questionsLog.filter(q => 
    q.question.toLowerCase().includes(query) ||
    q.ip.toLowerCase().includes(query) ||
    (q.sessionId && q.sessionId.toLowerCase().includes(query))
  );
  
  res.json({
    query: query,
    results: filteredQuestions,
    total: filteredQuestions.length
  });
});

// Rota para estatísticas
app.get('/api/stats', (req, res) => {
  const today = new Date().toDateString();
  const todayQuestions = questionsLog.filter(q => 
    new Date(q.timestamp).toDateString() === today
  );
  
  // Análise de sessões ativas hoje
  const todaySessions = Object.values(conversations).filter(s => 
    new Date(s.lastActivity).toDateString() === today
  );
  
  // Análise de tópicos mais comuns
  const topicCount = {};
  questionsLog.forEach(q => {
    const question = q.question.toLowerCase();
    if (question.includes('dor')) topicCount.dor = (topicCount.dor || 0) + 1;
    if (question.includes('febre') || question.includes('febre')) topicCount.febre = (topicCount.febre || 0) + 1;
    if (question.includes('gripe')) topicCount.gripe = (topicCount.gripe || 0) + 1;
    if (question.includes('covid')) topicCount.covid = (topicCount.covid || 0) + 1;
    if (question.includes('pressão') || question.includes('pressao')) topicCount.pressao = (topicCount.pressao || 0) + 1;
    if (question.includes('diabete')) topicCount.diabetes = (topicCount.diabetes || 0) + 1;
  });
  
  const topTopics = Object.entries(topicCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, count }));
  
  // Análise de dispositivos
  const deviceCount = {};
  questionsLog.forEach(q => {
    deviceCount[q.device] = (deviceCount[q.device] || 0) + 1;
  });
  const topDevices = Object.entries(deviceCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([device, count]) => ({ device, count }));
  
  // Análise de navegadores
  const browserCount = {};
  questionsLog.forEach(q => {
    browserCount[q.browser] = (browserCount[q.browser] || 0) + 1;
  });
  const topBrowsers = Object.entries(browserCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([browser, count]) => ({ browser, count }));
  
  // IPs únicos (apenas para estatística)
  const uniqueIps = [...new Set(questionsLog.map(q => q.ip))].length;
  
  res.json({
    totalQuestions: questionsLog.length,
    todayQuestions: todayQuestions.length,
    totalSessions: Object.keys(conversations).length,
    uniqueIps: uniqueIps,
    activeSessionsToday: todaySessions.length,
    firstQuestion: questionsLog[questionsLog.length - 1]?.timestamp || null,
    lastQuestion: questionsLog[0]?.timestamp || null,
    topTopics: topTopics,
    topDevices: topDevices,
    topBrowsers: topBrowsers
  });
});

// Rota para exportar perguntas
app.get('/api/questions/export', (req, res) => {
  try {
    const csvContent = 'Data,Hora,IP,Sessão,Dispositivo,Navegador,Pergunta\n' + questionsLog.map(q => 
      `"${q.date}","${q.time}","${q.ip}","${q.sessionId || 'N/A'}","${q.device}","${q.browser}","${q.question.replace(/"/g, '""')}"`
    ).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=perguntas_kojima.csv');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao exportar perguntas' });
  }
});

// Rota para informações do IP
app.get('/api/ip/:ip', (req, res) => {
  const ip = req.params.ip;
  
  // Encontrar todas as perguntas deste IP
  const ipQuestions = questionsLog.filter(q => q.ip === ip)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10); // Últimas 10 perguntas
  
  if (ipQuestions.length === 0) {
    return res.status(404).json({ error: 'Nenhuma pergunta encontrada para este IP' });
  }
  
  const firstSeen = ipQuestions[ipQuestions.length - 1].timestamp;
  const lastSeen = ipQuestions[0].timestamp;
  
  res.json({
    ip: ip,
    totalQuestions: ipQuestions.length,
    firstSeen: firstSeen,
    lastSeen: lastSeen,
    device: ipQuestions[0].device,
    browser: ipQuestions[0].browser,
    questions: ipQuestions.map(q => ({
      question: q.question,
      timestamp: q.timestamp,
      sessionId: q.sessionId
    }))
  });
});

// Proxy para Ollama com contexto
app.post("/api/generate", (req, res) => {
  const userPrompt = req.body.prompt;
  const sessionId = req.body.sessionId; // ID da sessão do frontend (OBRIGATÓRIO)
  const clientIp = getClientIp(req);
  const userAgentInfo = getUserAgentInfo(req);
  
  const clientInfo = {
    ip: clientIp,
    ...userAgentInfo
  };
  
  // Verificar se temos sessionId
  if (!sessionId) {
    return res.status(400).json({ 
      error: "SessionId é obrigatório",
      solution: "Recarregue a página para iniciar uma nova sessão"
    });
  }
  
  console.log(`🤖 Recebendo pergunta (sessão: ${sessionId}): ${userPrompt?.substring(0, 100)}...`);
  
  // Salvar apenas a pergunta
  saveQuestion(userPrompt, clientInfo, sessionId);
  
  // Obter ou criar sessão APENAS pelo sessionId
  const session = getSession(sessionId);
  
  // Adicionar pergunta do usuário à sessão
  addToSession(sessionId, 'user', userPrompt);
  
  // Construir contexto com histórico
  let context = "Você é o Kojima, um assistente de saúde inteligente. Use o histórico da conversa para responder de forma contextualizada.\n\n";
  
  // Adicionar histórico recente (últimas 5 trocas)
  const recentHistory = session.history.slice(-10); // 5 user + 5 assistant
  if (recentHistory.length > 0) {
    context += "Histórico recente da conversa:\n";
    recentHistory.forEach(msg => {
      const role = msg.role === 'user' ? 'Usuário' : 'Kojima';
      context += `${role}: ${msg.content}\n`;
    });
    context += "\n";
  }
  
  context += `Pergunta atual: ${userPrompt}`;
  
  const options = {
    hostname: 'localhost',
    port: OLLAMA_PORT,
    path: '/api/generate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const ollamaReq = http.request(options, (ollamaRes) => {
    let data = '';

    ollamaReq.on('error', (error) => {
      console.error("❌ Erro de conexão com Ollama:", error);
      res.status(500).json({ 
        error: "Não foi possível conectar ao Ollama",
        details: error.message,
        solution: "Verifique se o Ollama está rodando: 'ollama serve'"
      });
    });

    ollamaRes.on('data', (chunk) => {
      data += chunk;
    });

    ollamaRes.on('end', () => {
      try {
        const parsedData = JSON.parse(data);
        console.log("✅ Resposta do Ollama recebida");

        // Adicionar resposta do assistente à sessão
        addToSession(sessionId, 'assistant', parsedData.response);

        // Retornar resposta com sessionId para o frontend
        res.json({
          response: parsedData.response,
          sessionId: sessionId, // Manter o mesmo sessionId
          messageCount: session.messageCount
        });
      } catch (error) {
        console.error("❌ Erro ao parsear resposta do Ollama:", error);
        res.status(500).json({ 
          error: "Erro ao processar resposta da IA",
          details: error.message 
        });
      }
    });
  });

  // Enviar dados para Ollama
  ollamaReq.write(JSON.stringify({
    model: "llama3",
    prompt: context,
    stream: false
  }));

  ollamaReq.end();
});

// Limpeza de sessões antigas (mais de 24 horas)
function cleanupOldSessions() {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  let removedCount = 0;
  Object.keys(conversations).forEach(sessionId => {
    const session = conversations[sessionId];
    if (new Date(session.lastActivity) < oneDayAgo) {
      delete conversations[sessionId];
      removedCount++;
    }
  });
  
  if (removedCount > 0) {
    saveConversations();
    console.log(`🧹 ${removedCount} sessões antigas removidas`);
  }
}

// Agendar limpeza a cada hora
setInterval(cleanupOldSessions, 60 * 60 * 1000);

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
✨ ===================================
🤖    KOJIMA CHATBOT SERVER
✨ ===================================

✅ Servidor iniciado com sucesso!
📍 URL Local: http://localhost:${PORT}
👤 Chatbot: http://localhost:${PORT}
👨‍💼 Admin: http://localhost:${PORT}/admin
📊 Estatísticas: http://localhost:${PORT}/api/stats
📝 Perguntas: http://localhost:${PORT}/api/questions
💬 Sessões: http://localhost:${PORT}/api/sessions
📤 Exportar: http://localhost:${PORT}/api/questions/export

🚀 Para acesso externo, execute:
   ngrok http ${PORT}

💡 AGORA COM MEMÓRIA CONTEXTUAL POR SESSÃO!
   Cada aba/recarregamento inicia uma nova conversa

✨ ===================================
  `);
});