@echo off
chcp 65001 >nul
echo.
echo 🤖 KOJIMA CHATBOT - INICIANDO
echo =============================
echo.

:: Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERRO: Node.js não encontrado!
    echo 💡 Instale Node.js em: https://nodejs.org/
    pause
    exit /b 1
)

:: Verificar dependências
if not exist "node_modules" (
    echo 📦 Instalando dependências...
    npm install
)

echo ✅ Dependências verificadas!
echo.

:: Iniciar servidor
echo 🚀 Iniciando servidor Kojima...
echo 📍 Acesso local: http://localhost:3000
echo.
node server-ngrok.js