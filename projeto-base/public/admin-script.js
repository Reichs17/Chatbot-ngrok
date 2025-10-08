let currentPage = 1;
        const limit = 20;

        // Elementos DOM
        const questionsList = document.getElementById('questionsList');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const pageInfo = document.getElementById('pageInfo');
        const refreshBtn = document.getElementById('refreshBtn');
        const searchInput = document.getElementById('searchInput');
        const exportBtn = document.getElementById('exportBtn');
        const ipModal = document.getElementById('ipModal');
        const closeModal = document.getElementById('closeModal');
        const ipModalContent = document.getElementById('ipModalContent');

        // Carregar sessões
        async function loadSessions() {
            try {
                const response = await fetch('/api/sessions');
                const data = await response.json();
                
                const sessionsList = document.getElementById('sessionsList');
                if (data.sessions && data.sessions.length > 0) {
                    sessionsList.innerHTML = data.sessions.slice(0, 10).map(session => 
                        `<div class="session-item">
                            <div>
                                <strong>${session.id.substring(0, 20)}...</strong><br>
                                <small>Mensagens: ${session.messageCount}</small><br>
                                <small>Última: ${new Date(session.lastActivity).toLocaleString('pt-BR')}</small>
                            </div>
                        </div>`
                    ).join('');
                } else {
                    sessionsList.innerHTML = '<div class="empty-state">Nenhuma sessão ativa</div>';
                }
            } catch (error) {
                console.error('Erro ao carregar sessões:', error);
                document.getElementById('sessionsList').innerHTML = '<div class="empty-state">Erro ao carregar sessões</div>';
            }
        }

        // Carregar estatísticas
        async function loadStats() {
            try {
                const response = await fetch('/api/stats');
                const stats = await response.json();
                
                document.getElementById('totalQuestions').textContent = stats.totalInteractions;
                document.getElementById('todayQuestions').textContent = stats.todayInteractions;
                document.getElementById('uniqueIps').textContent = stats.uniqueIps;
                document.getElementById('firstQuestion').textContent = stats.firstInteraction ? '📅' : '-';
                
                // Carregar tópicos
                const topicsList = document.getElementById('topicsList');
                if (stats.topTopics && stats.topTopics.length > 0) {
                    topicsList.innerHTML = stats.topTopics.map(topic => 
                        `<div class="topic-item">
                            <span>${topic.topic}</span>
                            <span>${topic.count}x</span>
                        </div>`
                    ).join('');
                } else {
                    topicsList.innerHTML = '<div class="empty-state">Nenhum tópico ainda</div>';
                }
                
                // Carregar dispositivos
                const devicesList = document.getElementById('devicesList');
                if (stats.topDevices && stats.topDevices.length > 0) {
                    devicesList.innerHTML = stats.topDevices.map(device => 
                        `<div class="device-item">
                            <span>${device.device}</span>
                            <span>${device.count}x</span>
                        </div>`
                    ).join('');
                } else {
                    devicesList.innerHTML = '<div class="empty-state">Nenhum dado</div>';
                }
                
                // Carregar navegadores
                const browsersList = document.getElementById('browsersList');
                if (stats.topBrowsers && stats.topBrowsers.length > 0) {
                    browsersList.innerHTML = stats.topBrowsers.map(browser => 
                        `<div class="browser-item">
                            <span>${browser.browser}</span>
                            <span>${browser.count}x</span>
                        </div>`
                    ).join('');
                } else {
                    browsersList.innerHTML = '<div class="empty-state">Nenhum dado</div>';
                }

                // Carregar sessões
                await loadSessions();
            } catch (error) {
                console.error('Erro ao carregar estatísticas:', error);
            }
        }

        // Carregar interações (perguntas e respostas)
        async function loadInteractions(page = 1, searchQuery = '') {
            try {
                questionsList.innerHTML = '<div class="loading">Carregando interações...</div>';
                
                let url = `/api/interactions?page=${page}&limit=${limit}`;
                if (searchQuery) {
                    url = `/api/interactions/search?q=${encodeURIComponent(searchQuery)}`;
                }
                
                const response = await fetch(url);
                const data = await response.json();
                
                if (!data.interactions || data.interactions.length === 0) {
                    questionsList.innerHTML = `
                        <div class="empty-state">
                            ${searchQuery ? 'Nenhuma interação encontrada para sua busca.' : 'Nenhuma interação ainda.'}
                        </div>
                    `;
                    return;
                }
                
                const interactionsHtml = data.interactions.map(interaction => `
                    <div class="question-item">
                        <div class="question-time">
                            <span>📅 ${interaction.date} 🕒 ${interaction.time}</span>
                            <span>#${interaction.id.substr(-6)}</span>
                        </div>
                        <div class="question-ip">
                            <span>🌐 <a href="#" class="ip-link" data-ip="${interaction.ip}">${interaction.ip}</a></span>
                            <span>Sessão: ${interaction.sessionId ? interaction.sessionId.substring(0, 15) + '...' : 'N/A'}</span>
                        </div>
                        <div class="question-device">
                            <span>📱 ${interaction.device}</span>
                            <span>🌐 ${interaction.browser}</span>
                        </div>
                        <div class="question-text">
                            <strong>Pergunta:</strong><br>
                            ${escapeHtml(interaction.question)}
                        </div>
                        <div class="ai-response">
                            <strong>Resposta da IA:</strong><br>
                            ${escapeHtml(interaction.response)}
                        </div>
                    </div>
                `).join('');
                
                questionsList.innerHTML = interactionsHtml;
                
                // Adicionar event listeners para os links de IP
                document.querySelectorAll('.ip-link').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const ip = e.target.getAttribute('data-ip');
                        showIpInfo(ip);
                    });
                });
                
                // Atualizar paginação (apenas se não for busca)
                if (!searchQuery) {
                    pageInfo.textContent = `Página ${data.page} de ${data.totalPages}`;
                    prevBtn.disabled = !data.hasPrev;
                    nextBtn.disabled = !data.hasNext;
                    currentPage = data.page;
                } else {
                    pageInfo.textContent = `${data.total} resultado(s) encontrado(s)`;
                    prevBtn.disabled = true;
                    nextBtn.disabled = true;
                }
                
            } catch (error) {
                console.error('Erro ao carregar interações:', error);
                questionsList.innerHTML = '<div class="empty-state">Erro ao carregar interações.</div>';
            }
        }

        // Mostrar informações do IP
        async function showIpInfo(ip) {
            try {
                ipModalContent.innerHTML = '<div class="loading">Carregando informações do IP...</div>';
                ipModal.style.display = 'flex';
                
                const response = await fetch(`/api/ip/${encodeURIComponent(ip)}`);
                const data = await response.json();
                
                ipModalContent.innerHTML = `
                    <div style="margin-bottom: 20px;">
                        <h4>🌐 IP: ${data.ip}</h4>
                        <p><strong>Total de Interações:</strong> ${data.totalInteractions}</p>
                        <p><strong>Primeira Vez:</strong> ${new Date(data.firstSeen).toLocaleString('pt-BR')}</p>
                        <p><strong>Última Vez:</strong> ${new Date(data.lastSeen).toLocaleString('pt-BR')}</p>
                        <p><strong>Dispositivo:</strong> ${data.device}</p>
                        <p><strong>Navegador:</strong> ${data.browser}</p>
                    </div>
                    <div>
                        <h5>Últimas Interações:</h5>
                        ${data.interactions.map(interaction => `
                            <div style="background: #333; padding: 10px; margin: 5px 0; border-radius: 5px;">
                                <div style="font-size: 0.8em; color: #888;">${new Date(interaction.timestamp).toLocaleString('pt-BR')}</div>
                                <div><strong>Pergunta:</strong> ${escapeHtml(interaction.question)}</div>
                                <div><strong>Resposta:</strong> ${escapeHtml(interaction.response)}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } catch (error) {
                console.error('Erro ao carregar informações do IP:', error);
                ipModalContent.innerHTML = '<div class="empty-state">Erro ao carregar informações do IP.</div>';
            }
        }

        // Exportar para CSV
        async function exportToCSV() {
            try {
                const response = await fetch('/api/interactions/export');
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'interacoes_kojima.csv';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Erro ao exportar:', error);
                alert('Erro ao exportar interações.');
            }
        }

        // Função para escapar HTML (segurança)
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Event Listeners
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                loadInteractions(currentPage - 1);
            }
        });

        nextBtn.addEventListener('click', () => {
            loadInteractions(currentPage + 1);
        });

        refreshBtn.addEventListener('click', () => {
            loadStats();
            loadInteractions(1);
            searchInput.value = '';
        });

        exportBtn.addEventListener('click', exportToCSV);

        closeModal.addEventListener('click', () => {
            ipModal.style.display = 'none';
        });

        // Fechar modal ao clicar fora
        ipModal.addEventListener('click', (e) => {
            if (e.target === ipModal) {
                ipModal.style.display = 'none';
            }
        });

        // Busca em tempo real
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = e.target.value.trim();
                if (query) {
                    loadInteractions(1, query);
                } else {
                    loadInteractions(1);
                }
            }, 500);
        });

        // Carregar inicial
        loadStats();
        loadInteractions();

        // Atualizar a cada 30 segundos
        setInterval(() => {
            loadStats();
            if (!searchInput.value) {
                loadInteractions(currentPage);
            }
        }, 30000);