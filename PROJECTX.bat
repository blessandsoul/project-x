@echo off
echo Stopping any running Node.js processes...
taskkill /F /IM node.exe /T > nul 2>&1

echo Starting code-graph-rag-mcp...
start "CodeGraphRAGMCP" cmd /c "npm run code-graph-rag-mcp"
echo Starting server...
cd server
start "Server" cmd /c "npm run dev"
cd ..
echo Starting client...
cd client
start "Client" cmd /c "npm run dev"

echo Client started successfully.