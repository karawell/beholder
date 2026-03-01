#!/bin/bash

# ============================================================
# Beholder — Setup automático VPS Ubuntu 22.04
# ============================================================

set -e  # Para o script se qualquer comando falhar

# ─── VARIÁVEIS — altere apenas se necessário ───
DB_PASS="123159Well@5cd7*"
REPO_URL="https://github.com/karawell/beholder.git"
APP_DIR="/home/beholder/app"
# ────────────────────────────────────────────────

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[..] $1${NC}"; }
fail() { echo -e "${RED}[ERRO] $1${NC}"; exit 1; }

echo ""
echo "============================================"
echo "  Beholder VPS Setup — Iniciando..."
echo "============================================"
echo ""

# ─── 1. Atualizar sistema ───────────────────────
warn "Atualizando sistema..."
apt update -y && apt upgrade -y
apt install -y curl git ufw nginx
log "Sistema atualizado!"

# ─── 2. Instalar Node.js 20 ─────────────────────
warn "Instalando Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
log "Node.js $(node -v) instalado!"

# ─── 3. Instalar PM2 ────────────────────────────
warn "Instalando PM2..."
npm install -g pm2
log "PM2 instalado!"

# ─── 4. Instalar MySQL ──────────────────────────
warn "Instalando MySQL..."
apt install -y mysql-server

# Iniciar MySQL
systemctl start mysql
systemctl enable mysql

# Configurar banco e usuário
mysql -e "CREATE DATABASE IF NOT EXISTS beholder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'beholder'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON beholder.* TO 'beholder'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
log "MySQL configurado!"

# ─── 5. Criar usuário do sistema ────────────────
warn "Criando usuário beholder..."
if ! id "beholder" &>/dev/null; then
    useradd -m -s /bin/bash beholder
fi
log "Usuário beholder criado!"

# ─── 6. Clonar repositório ──────────────────────
warn "Clonando repositório..."
mkdir -p $APP_DIR
git clone $REPO_URL $APP_DIR || (cd $APP_DIR && git pull)
chown -R beholder:beholder /home/beholder
log "Repositório clonado em $APP_DIR!"

# ─── 7. Instalar dependências do backend ────────
warn "Instalando dependências do backend..."
cd $APP_DIR/backend
npm install --omit=dev
log "Dependências do backend instaladas!"

# ─── 8. Criar .env do backend ───────────────────
warn "Criando arquivo .env..."

# Gerar segredos automaticamente
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
AES_KEY=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")

# Pegar IP público do servidor
PUBLIC_IP=$(curl -s ifconfig.me)

cat > $APP_DIR/backend/.env << EOF
PORT=3001
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES=1800
DB_NAME=beholder
DB_USER=beholder
DB_PWD=${DB_PASS}
DB_HOST=localhost
DB_PORT=3306
DB_LOGS=false
DB_DIALECT=mysql
AES_KEY=${AES_KEY}
CORS_ORIGIN=http://${PUBLIC_IP}
BEHOLDER_LOGS=false
AUTOMATION_INTERVAL=0
AGENDA_LOGS=false
LOG_LEVEL=info
EOF

chown beholder:beholder $APP_DIR/backend/.env
chmod 600 $APP_DIR/backend/.env
log ".env criado com segredos gerados automaticamente!"

# ─── 9. Rodar migrations e seeders ──────────────
warn "Rodando migrations do banco de dados..."
cd $APP_DIR/backend
npx sequelize-cli db:migrate
log "Migrations executadas!"

warn "Rodando seeders (dados iniciais)..."
npx sequelize-cli db:seed:all
log "Seeders executados!"

# ─── 10. Build do frontend ──────────────────────
warn "Instalando dependências do frontend..."
cd $APP_DIR/frontend
npm install --omit=dev

warn "Gerando build do frontend..."
cat > $APP_DIR/frontend/.env.production.local << EOF
REACT_APP_API_URL=http://${PUBLIC_IP}/api
REACT_APP_WS_URL=ws://${PUBLIC_IP}/ws
REACT_APP_BWS_URL=wss://stream.binance.com:9443/ws
EOF

npm run build
log "Frontend buildado!"

# ─── 11. Configurar pasta do frontend ───────────
warn "Publicando frontend..."
mkdir -p /var/www/beholder
cp -r $APP_DIR/frontend/build/* /var/www/beholder/
log "Frontend publicado!"

# ─── 12. Configurar Nginx ───────────────────────
warn "Configurando Nginx..."
cat > /etc/nginx/sites-available/beholder << EOF
server {
    listen 80;
    server_name ${PUBLIC_IP};

    # Frontend React
    root /var/www/beholder;
    index index.html;

    # SPA — redireciona tudo para o index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy para API REST do backend
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_cache_bypass \$http_upgrade;
    }

    # Proxy para WebSocket do backend
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
        proxy_read_timeout 86400;
    }
}
EOF

ln -sf /etc/nginx/sites-available/beholder /etc/nginx/sites-enabled/beholder
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
log "Nginx configurado!"

# ─── 13. Configurar Firewall ────────────────────
warn "Configurando firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
log "Firewall configurado!"

# ─── 14. Iniciar bot com PM2 ────────────────────
warn "Iniciando Beholder com PM2..."
cd $APP_DIR/backend
pm2 start beholder-pm2.json --env production
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash
log "Beholder iniciado com PM2!"

# ─── RESUMO FINAL ───────────────────────────────
echo ""
echo "============================================"
echo -e "  ${GREEN}Setup concluído com sucesso!${NC}"
echo "============================================"
echo ""
echo "  URL do Beholder:  http://${PUBLIC_IP}"
echo "  Health check:     http://${PUBLIC_IP}/health"
echo ""
echo "  Login padrão:"
echo "    Email: karawell@gmail.com"
echo "    Senha: 123159Well@"
echo ""
echo -e "  ${YELLOW}IMPORTANTE: troque a senha após o primeiro login!${NC}"
echo ""
echo "  Comandos úteis:"
echo "    pm2 status              → ver status do bot"
echo "    pm2 logs beholder       → ver logs em tempo real"
echo "    pm2 restart beholder    → reiniciar o bot"
echo ""
echo "============================================"
