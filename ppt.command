

# 切换到脚本所在目录（防止路径问题）
cd /Volumes/MacSD/GitHub/banana-slides

#!/bin/bash

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

echo "🍌 Banana Slides 一键启动脚本 🍌"

# 1. 环境检查
echo "[1/5] 检查运行环境..."
if ! command -v python3.10 &> /dev/null; then
    echo "❌ 错误: 未发现 Python 3.10。请确保已通过 brew 或官网安装。"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未发现 npm。请确保安装了 Node.js。"
    exit 1
fi

# 2. 读取配置
if [ -f .env ]; then
    PORT=$(grep "^PORT=" .env | cut -d '=' -f 2)
fi
PORT=${PORT:-5001}
FRONTEND_PORT=3000

echo "配置: 后端端口=$PORT, 前端端口=$FRONTEND_PORT"

# 3. 清理端口占用
cleanup_port() {
    local port=$1
    local name=$2
    local pid=$(lsof -t -i :$port)
    if [ ! -z "$pid" ]; then
        echo "⚠️ $name 端口 $port 被占用 (PID: $pid)，正在清理..."
        kill -9 $pid
        sleep 1
    fi
}

echo "[2/5] 清理端口占用..."
cleanup_port $PORT "后端"
cleanup_port $FRONTEND_PORT "前端"

# 4. 启动后端
echo "[3/5] 启动后端服务..."
if [ ! -d "venv" ]; then
    echo "首次运行，创建虚拟环境并安装依赖..."
    python3.10 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install flask flask-cors flask-sqlalchemy google-genai openai pydantic pillow python-pptx python-dotenv reportlab werkzeug markitdown tenacity alembic flask-migrate img2pdf
else
    source venv/bin/activate
fi

cd backend
# 运行迁移
alembic upgrade head
# 后台启动
nohup python app.py > server_run.log 2>&1 &
BACKEND_PID=$!
echo "后端已启动 (PID: $BACKEND_PID)"
cd "$PROJECT_ROOT"

# 5. 启动前端
echo "[4/5] 启动前端服务..."
cd frontend
# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo "首次运行，安装前端依赖..."
    npm install
fi
# 后台启动
nohup npm run dev > frontend_run.log 2>&1 &
FRONTEND_PID=$!
echo "前端已启动 (PID: $FRONTEND_PID)"
cd "$PROJECT_ROOT"

# 等待服务就绪
echo "[5/5] 等待服务初始化..."
MAX_RETRIES=30
COUNT=0
READY=false

while [ $COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:$PORT/health | grep -q "ok"; then
        READY=true
        break
    fi
    sleep 2
    COUNT=$((COUNT+1))
    printf "."
done

if [ "$READY" = true ]; then
    echo -e "\n✅ 服务已就绪！"
    echo "👉 后端: http://localhost:$PORT"
    echo "👉 前端: http://localhost:$FRONTEND_PORT"
    
    # 自动打开网页
    if command -v open &> /dev/null; then
        open http://localhost:$FRONTEND_PORT
    elif command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:$FRONTEND_PORT
    fi
else
    echo -e "\n❌ 后端服务启动超时，请检查 backend/server_run.log"
fi

echo "提示: 如需停止服务，请使用 'kill $BACKEND_PID $FRONTEND_PID' 或再次运行此脚本。"


