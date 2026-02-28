#!/bin/bash
# =============================================================================
# Beholder — Script de atualização (rodar no VPS a cada novo deploy)
# Uso: bash update.sh
# =============================================================================

set -e

APP_DIR="/home/beholder/app"
WEB_DIR="/var/www/beholder"

echo "======================================================"
echo "  Beholder — Atualizando deploy"
echo "======================================================"

# 1. Pull das mudanças
echo "[1/5] Baixando atualizações..."
cd "${APP_DIR}"
git pull origin main

# 2. Backend — dependências e migrations
echo "[2/5] Atualizando backend..."
cd "${APP_DIR}/backend"
npm install --omit=dev
npx sequelize-cli db:migrate

# 3. Frontend — rebuild
echo "[3/5] Rebuilding frontend..."
cd "${APP_DIR}/frontend"
npm install
npm run build

# 4. Copiar build para Nginx
echo "[4/5] Copiando build para ${WEB_DIR}..."
rm -rf "${WEB_DIR:?}"/*
cp -r build/* "${WEB_DIR}/"

# 5. Reiniciar backend com PM2
echo "[5/5] Reiniciando backend..."
cd "${APP_DIR}/backend"
pm2 restart beholder --update-env

echo ""
echo "======================================================"
echo "  Atualização concluída!"
echo "  Verifique: pm2 logs beholder --lines 50"
echo "  Saúde: curl http://localhost/health"
echo "======================================================"
