@echo off
chcp 65001 >nul
echo.
echo 🤖 KOJIMA CHATBOT - BACKUP DO LOG
echo ================================
echo.

set timestamp=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set timestamp=%timestamp: =0%

copy questions_log.txt backup_questions_%timestamp%.txt

if errorlevel 1 (
    echo ❌ Erro ao criar backup
) else (
    echo ✅ Backup criado: backup_questions_%timestamp%.txt
)

echo.
pause