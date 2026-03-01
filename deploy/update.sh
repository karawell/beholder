#!/bin/bash

# ============================================================
# Beholder — Script de atualização
# Uso: bash deploy/update.sh
# ============================================================

set -e

APP_DIR="/home/beholder/app"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[..] $1${NC}"; }

echo ""
echo "============================================"
echo "  Beholder — Atualizando..."
echo "============================================"
echo ""

warn "Baixando atualizações do GitHub..."
git config --global --add safe.directory $APP_DIR
cd $APP_DIR
git reset --hard HEAD
git pull origin main
log "Código atualizado!"

warn "Atualizando dependências do backend..."
cd $APP_DIR/backend
npm install --omit=dev
log "Dependências atualizadas!"

warn "Rodando novas migrations..."
npx sequelize-cli db:migrate
log "Migrations executadas!"

warn "Reconstruindo frontend..."
cd $APP_DIR/frontend
find $APP_DIR/frontend/src -name "*.js" -delete
npm install
npm run build
mkdir -p /var/www/beholder
cp -r build/* /var/www/beholder/
log "Frontend atualizado!"

warn "Reiniciando bot..."
pm2 restart beholder
log "Bot reiniciado!"

echo ""
echo "============================================"
echo -e "  ${GREEN}Atualização concluída!${NC}"
echo "============================================"
pm2 status
echo ""
