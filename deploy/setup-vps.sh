#!/bin/bash
# =============================================================================
# Beholder — Setup inicial da VPS (Ubuntu 22.04)
# Executar como root ou com sudo na primeira vez que acessar o servidor
#
# Uso: bash setup-vps.sh
# =============================================================================

set -e  # Aborta em qualquer erro

# --- Variáveis — EDITE ANTES DE EXECUTAR ---
DB_NAME="beholder"
DB_USER="beholder"
DB_PASS="TROCAR_SENHA_FORTE_DO_BANCO"
REPO_URL="https://github.com/karawell/beholder.git"
APP_DIR="/home/beholder/app"
WEB_DIR="/var/www/beholder"

echo "======================================================"
echo "  Beholder VPS Setup — Ubuntu 22.04"
echo "======================================================"

# =============================================================================
# 1. Sistema
# =============================================================================
echo "[1/8] Atualizando sistema..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl git build-essential ufw

# =============================================================================
# 2. Node.js 20 LTS
# =============================================================================
echo "[2/8] Instalando Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v
npm -v

# =============================================================================
# 3. MySQL 8
# =============================================================================
echo "[3/8] Instalando MySQL 8..."
apt-get install -y mysql-server

echo "  Criando banco e usuário..."
mysql -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
echo "  MySQL configurado: banco=${DB_NAME}, user=${DB_USER}"

# =============================================================================
# 4. PM2
# =============================================================================
echo "[4/8] Instalando PM2..."
npm install -g pm2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# =============================================================================
# 5. Nginx
# =============================================================================
echo "[5/8] Instalando Nginx..."
apt-get install -y nginx
systemctl enable nginx

# =============================================================================
# 6. Clonar projeto
# =============================================================================
echo "[6/8] Clonando repositório..."
mkdir -p "$(dirname ${APP_DIR})"
git clone "${REPO_URL}" "${APP_DIR}"
cd "${APP_DIR}/backend"

echo "  Criando .env — preencha os valores depois!"
cat > .env << 'ENVEOF'
PORT=3001
JWT_SECRET=TROCAR_POR_STRING_ALEATORIA_FORTE_MINIMO_32_CHARS
JWT_EXPIRES=1800
DB_NAME=beholder
DB_USER=beholder
DB_PWD=TROCAR_PELA_SENHA_DO_BANCO
DB_HOST=localhost
DB_PORT=3306
DB_LOGS=false
DB_DIALECT=mysql
AES_KEY=TROCAR_POR_32_CHARS_ALEATORIOS_AQUI
CORS_ORIGIN=http://SEU_IP_OU_DOMINIO
BEHOLDER_LOGS=false
AUTOMATION_INTERVAL=0
AGENDA_LOGS=false
LOG_LEVEL=info
ENVEOF

echo "  Instalando dependências do backend..."
npm install --omit=dev

echo "  Rodando migrations..."
npx sequelize-cli db:migrate

echo "  Rodando seeders..."
npx sequelize-cli db:seed:all

# =============================================================================
# 7. Build do frontend
# =============================================================================
echo "[7/8] Buildando frontend..."
cd "${APP_DIR}/frontend"

cat > .env.production.local << 'FRONTENVEOF'
REACT_APP_API_URL=http://SEU_IP_OU_DOMINIO/api
REACT_APP_WS_URL=ws://SEU_IP_OU_DOMINIO/ws
REACT_APP_BWS_URL=wss://stream.binance.com:9443/ws
FRONTENVEOF

npm install
npm run build

mkdir -p "${WEB_DIR}"
cp -r build/* "${WEB_DIR}/"
echo "  Frontend copiado para ${WEB_DIR}"

# =============================================================================
# 8. Nginx + PM2
# =============================================================================
echo "[8/8] Configurando Nginx e PM2..."

# Nginx
cp "${APP_DIR}/deploy/nginx.conf" /etc/nginx/sites-available/beholder
sed -i "s|/var/www/beholder|${WEB_DIR}|g" /etc/nginx/sites-available/beholder
ln -sf /etc/nginx/sites-available/beholder /etc/nginx/sites-enabled/beholder
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# PM2
cd "${APP_DIR}/backend"
pm2 start beholder-pm2.json --env production
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash

# Firewall
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

echo ""
echo "======================================================"
echo "  Setup concluído!"
echo "  ⚠️  AÇÕES NECESSÁRIAS:"
echo "  1. Editar ${APP_DIR}/backend/.env com valores reais"
echo "  2. Editar ${WEB_DIR}/... (rebuild do frontend após editar)"
echo "  3. Verificar: pm2 logs beholder"
echo "  4. Verificar: curl http://localhost/health"
echo "======================================================"
