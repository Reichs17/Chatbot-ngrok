# 🤖 Kojima Chatbot - Assistente de Saúde Inteligente

<div align="center">

  Um assistente virtual de saúde com IA, memória contextual e painel de monitoramento

  ![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
  ![Express](https://img.shields.io/badge/Express-5.0-blue?logo=express)
  ![Ollama](https://img.shields.io/badge/Ollama-Llama3-orange)
  ![License](https://img.shields.io/badge/License-MIT-yellow.svg)
</div>

---

## 📋 Sobre o Projeto

O **Kojima Chatbot** é um assistente virtual de saúde inteligente que utiliza inteligência artificial (**Ollama + Llama3**) para responder perguntas médicas e de saúde. O sistema possui memória contextual por sessão, interface moderna e painel administrativo completo para monitoramento em tempo real.

### ✨ Destaques

- 🧠 **Memória Contextual**: Mantém o contexto da conversa durante a sessão.
- 🎯 **Foco em Saúde**: Especializado em orientações médicas e de bem-estar.
- 📊 **Monitoramento Completo**: Painel admin com estatísticas detalhadas.
- 🔒 **Privacidade**: Sessões isoladas e dados temporários.
- 🎨 **Interface Moderna**: Design escuro com experiência de usuário intuitiva.

---

## 🚀 Funcionalidades

### 🤖 Chatbot Principal
- **Conversas Contextuais**: IA que lembra do histórico da sessão.
- **Múltiplas Formas de Input**: Texto, sugestões rápidas e reconhecimento de voz.
- **Sugestões Inteligentes**: Perguntas pré-definidas sobre saúde.
- **Interface Responsiva**: Funciona em desktop e mobile.
- **Sessões Isoladas**: Cada aba inicia uma nova conversa independente.

### 👨‍💼 Painel Administrativo
- **Dashboard em Tempo Real**: Estatísticas atualizadas automaticamente.
- **Busca Avançada**: Filtre por perguntas, IPs, dispositivos.
- **Exportação de Dados**: Download completo em CSV.
- **Análise de Métricas**: IPs únicos, dispositivos, navegadores, tópicos.
- **Monitoramento de Sessões**: Visualização das conversas ativas.

---

## 🔧 Recursos Técnicos

- **API RESTful**: Endpoints para integração.
- **Logs Detalhados**: Registro completo de todas as interações.
- **Detecção Automática**: IP, dispositivo, navegador e localização.
- **Limpeza Automática**: Sessões expiram após 24h.

---

## 🛠️ Tecnologias

| Camada       | Tecnologias                  |
|--------------|------------------------------|
| **Backend**  | Node.js, Express, HTTP       |
| **Frontend** | HTML5, CSS3, JavaScript      |
| **IA**       | Ollama, Llama3               |
| **Armazenamento** | JSON, File System       |
| **Monitoramento** | API Customizada, Logs   |

---

## 📦 Instalação

### Pré-requisitos
- **Node.js 18+**
- **Ollama** com modelo **Llama3**
- Navegador moderno (Chrome, Firefox, Edge)

### 🛠️ Configuração Rápida

1. Clone o repositório:
   ```bash
   git clone https://github.com/Reichs17/Chatbot-ngrok.git
   cd kojima-chatbot
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Certifique-se que o Ollama está rodando:
   ```bash
   ollama serve
   # Em outro terminal:
   ollama pull llama3
   ```
4. Inicie o servidor:
   ```bash
   # Método 1: Script do Windows
   start-ngrok.bat

   # Método 2: Node.js diretamente
   node server-ngrok.js
   ```
5. Acesse as interfaces:
   - 🤖 Chatbot: [http://localhost:3000](http://localhost:3000)
   - 👨‍💼 Painel Admin: [http://localhost:3000/admin](http://localhost:3000/admin)
   - 📊 Health Check: [http://localhost:3000/health](http://localhost:3000/health)

### 🌐 Acesso Externo (Opcional)
Para acesso externo via Ngrok:

```bash
ngrok http 3000
```

---

## 📁 Estrutura do Projeto

```
kojima-chatbot/
├── 📄 server-ngrok.js          # Servidor principal
├── 📦 package.json            # Dependências e scripts
├── ⚡ start-ngrok.bat         # Script de inicialização (Windows)
├── 💾 conversations.json      # Armazenamento de sessões
├── 📝 questions_log.txt       # Log completo de perguntas
└── 📁 public/
    ├── 🎨 index.html          # Interface do chatbot
    ├── ⚡ script.js           # Lógica do frontend
    ├── 🎨 style.css           # Estilos e animações
    ├── 👨‍💼 admin.html          # Painel administrativo
    └── 🏷️ Kojima_Productions_logo.png
```

---

## 🔌 API Endpoints

| Método | Endpoint                              | Descrição                          |
|--------|---------------------------------------|------------------------------------|
| **GET**    | `/api/stats`                        | Estatísticas do sistema            |
| **GET**    | `/api/questions`                   | Lista de perguntas (com paginação) |
| **GET**    | `/api/sessions`                    | Sessões ativas                     |
| **GET**    | `/api/questions/search?q=termo`    | Busca por perguntas                 |
| **POST**   | `/api/generate`                    | Geração de respostas da IA         |
| **GET**    | `/api/questions/export`             | Exportação CSV                     |
| **GET**    | `/api/ip/:ip`                       | Informações de um IP específico   |

---

## 🎯 Como Funciona

### 🔄 Fluxo de Conversação
1. **Início**: Usuário abre o chatbot → Gera sessionId único
2. **Pergunta**: Usuário digita/fala/seleciona sugestão
3. **Processamento**:
   - Sistema registra: IP, dispositivo, navegador, sessionId
   - IA processa com contexto do histórico da sessão
4. **Resposta**:
   - IA gera resposta contextual
   - Interface atualiza em tempo real
5. **Armazenamento**:
   - Pergunta e resposta salvos na sessão
   - Logs atualizados para monitoramento

---

## 📊 Sistema de Monitoramento
- **Tempo Real**: Atualizações automáticas a cada 30s
- **Métricas**: Perguntas, sessões, dispositivos, tópicos
- **Busca**: Filtros por múltiplos critérios
- **Exportação**: Dados completos para análise

---

### Personalização do Modelo de IA
No server-ngrok.js, modifique:

```javascript
// Linha ~472
ollamaReq.write(JSON.stringify({
    model: "llama3",  // Altere para seu modelo preferido
    prompt: context,
    stream: false
}));
```

---

## 📊 Métricas e Estatísticas
O sistema monitora automaticamente:

- 📈 **Volume**: Total de perguntas e perguntas do dia
- 👥 **Usuários**: IPs únicos e sessões ativas
- 📱 **Dispositivos**: Desktop vs Mobile, navegadores
- 🎯 **Tópicos**: Assuntos de saúde mais frequentes
- ⏰ **Atividade**: Primeira/última pergunta, tempo de atividade

---

## 🔒 Privacidade e Segurança
- ✅ **Sessões Isoladas**: Conversas não são compartilhadas entre abas
- ✅ **Dados Temporários**: Sessões expiram em 24h de inatividade
- ✅ **Logs Limitados**: Apenas 2000 perguntas mantidas em memória
- ✅ **IP Anônimo**: Endereços usados apenas para estatísticas
- ✅ **Local First**: Dados processados localmente (Ollama)
