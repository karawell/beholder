# 🤖 Beholder — Contexto Completo para Modernização

## 📌 O que é este projeto
Bot de trading automatizado para a **Binance**, desenvolvido com Node.js.
Baseado no curso **Beholder do LuizTools** (curso pago, versão original v1).
O projeto foi abandonado em **agosto de 2021** e precisa ser completamente modernizado.
O objetivo é colocá-lo em produção e operando com estratégias reais e lucrativas.

---

## 🧱 Arquitetura do Projeto

```
beholder/
├── backend/          # Node.js + Express + Sequelize + MySQL
│   ├── src/
│   │   ├── beholder.js       # Motor principal: BRAIN + MEMORY
│   │   ├── app-em.js         # Exchange Monitor (WebSockets da Binance)
│   │   ├── app-ws.js         # WebSocket Server (frontend <-> backend)
│   │   ├── app.js            # Express app
│   │   ├── server.js         # Entry point
│   │   ├── agenda.js         # Agendamentos (node-schedule)
│   │   ├── controllers/      # REST controllers
│   │   ├── models/           # Sequelize models
│   │   ├── repositories/     # Camada de acesso a dados
│   │   ├── routers/          # Rotas Express
│   │   ├── middlewares/      # Auth + Error handling
│   │   └── utils/
│   │       ├── exchange.js   # Wrapper da Binance API
│   │       ├── indexes.js    # Indicadores técnicos (RSI, MACD, BB, etc.)
│   │       ├── crypto.js     # Criptografia AES para senhas
│   │       ├── email.js      # SendGrid
│   │       └── sms.js        # Twilio
│   ├── migrations/           # Sequelize migrations (banco de dados)
│   ├── seeders/              # Dados iniciais
│   └── package.json
└── frontend/         # React 17 + WebSocket client
    └── src/
        ├── private/
        │   ├── Dashboard/    # Carteira, MiniTicker, BookTicker, CandleChart
        │   ├── Automations/  # Motor de automações + Grid Modal
        │   ├── Monitors/     # Configuração de monitores
        │   ├── Orders/       # Histórico de ordens
        │   ├── OrderTemplates/ # Templates de ordens
        │   └── Reports/      # Relatórios e gráficos
        └── services/         # Chamadas à API REST
```

### Como o motor funciona (BRAIN + MEMORY)
- **MEMORY**: objeto em memória que armazena preços, indicadores, carteira em tempo real
- **BRAIN**: mapa de automações indexadas por chaves de memória
- **BRAIN_INDEX**: índice reverso para encontrar automações que dependem de cada chave
- Quando qualquer valor muda na MEMORY, o BRAIN avalia se alguma automação deve disparar
- Se a condição for verdadeira, executa a ação (ordem, email, SMS, grid)

### Indicadores técnicos disponíveis (via `technicalindicators`)
Candlestick patterns: DOJI, HAMMER, ENGULFING, MORNING STAR, EVENING STAR, 3 BLACK CROWS, e 30+ outros
Indicadores: RSI, MACD, SMA, EMA, Bollinger Bands, StochRSI, ADX, ATR, OBV, CCI, MFI, PSAR, ROC, TRIX, KST, AO, ADL, Force Index, STOCH

---

## 🔴 BUGS E PROBLEMAS ENCONTRADOS

### BUG CRÍTICO #1 — beholder.js linha 220
```javascript
// ERRADO — atribuição ao invés de comparação!
else if (orderTemplate.quantity = 'LAST_ORDER_QTY') {

// CORRETO
else if (orderTemplate.quantity === 'LAST_ORDER_QTY') {
```
**Impacto:** A condição é sempre verdadeira, causando cálculo incorreto de quantidade em TODAS as ordens que deveriam usar quantidade fixa ou MAX_WALLET.

### BUG #2 — Credenciais expostas (JÁ REMOVER a pasta /chaves/)
A pasta `/chaves/` contém senhas reais commitadas no repositório. Deletar e limpar o histórico git.

### VULNERABILIDADES — 36 no total (7 críticas)
| Pacote | Versão Atual | Problema | Ação |
|---|---|---|---|
| `mysql2` | ^2.2.5 | RCE + SQL Injection + Prototype Pollution | Atualizar para ^3.9.0 |
| `sequelize` | ^6.6.2 | SQL Injection + information disclosure | Atualizar para ^6.37.0 |
| `node-binance-api` | ^0.12.5 | form-data inseguro, API desatualizada | Atualizar para ^1.0.22 |
| `ws` | ^7.5.0 | DoS por flood de HTTP headers | Atualizar para ^8.18.0 |
| `url-parse` | (transitiva) | Authorization bypass | Resolvida atualizando acima |
| `jsonwebtoken` | ^8.5.1 | Vulnerabilidades conhecidas | Atualizar para ^9.0.0 |
| `helmet` | ^4.6.0 | Desatualizado | Atualizar para ^8.0.0 |

### PROBLEMA #3 — node-binance-api v0.12.5 muito desatualizada
A Binance fez mudanças importantes desde 2021:
- Novo sistema de autenticação (Ed25519 keys recomendado em 2024)
- `userDataStream` agora requer keepalive periódico (pingUserData a cada 30min)
- BUSD descontinuado — usar apenas pares USDT
- Mudanças no formato do bookTicker WebSocket
- Rate limits mais rigorosos

### PROBLEMA #4 — React 17 e react-scripts 4 desatualizados
Frontend usa React 17 (atual: 19) e react-scripts 4 (descontinuado). Migrar para Vite + React 18.

### PROBLEMA #5 — Sem mecanismo de reconexão WebSocket
Se a conexão com a Binance cair, o bot para silenciosamente sem reconectar.

### PROBLEMA #6 — eval() no motor de automações
```javascript
const isValid = evalCondition ? eval(evalCondition) : true;
```
Funciona mas é risco de segurança. Manter por ora mas documentar como dívida técnica.

### PROBLEMA #7 — node-schedule sem persistência
Automações agendadas são perdidas se o servidor reiniciar.

---

## ✅ PLANO DE MODERNIZAÇÃO — PASSO A PASSO

### FASE 1 — Segurança Urgente (Fazer PRIMEIRO)

**Passo 1.1 — Remover credenciais expostas**
```bash
# Deletar a pasta /chaves/ do projeto e histórico
git filter-branch --tree-filter 'rm -rf chaves' HEAD
# ou usar BFG Repo-Cleaner (mais simples)
git rm -r --cached chaves/
echo "chaves/" >> .gitignore
git add .gitignore
git commit -m "remove: pasta chaves com credenciais expostas"
git push --force
```

**Passo 1.2 — Criar .env correto**
```bash
# backend/.env (nunca commitar este arquivo)
PORT=3001
JWT_SECRET=GERAR_STRING_ALEATORIA_FORTE_AQUI
JWT_EXPIRES=1800
DB_NAME=beholder
DB_USER=beholder_user
DB_PWD=SENHA_FORTE_AQUI
DB_HOST=localhost
DB_PORT=3306
AES_KEY=GERAR_32_CHARS_ALEATORIOS_AQUI
CORS_ORIGIN=http://localhost:3000
BEHOLDER_LOGS=false
AUTOMATION_INTERVAL=0
```

**Passo 1.3 — Verificar .gitignore**
```
# Garantir que existe no backend/.gitignore
.env
node_modules/
chaves/
```

### FASE 2 — Corrigir Bugs (Fazer SEGUNDO)

**Passo 2.1 — Corrigir bug crítico em beholder.js**
```javascript
// Arquivo: backend/src/beholder.js — linha ~220
// ANTES:
else if (orderTemplate.quantity = 'LAST_ORDER_QTY') {
// DEPOIS:
else if (orderTemplate.quantity === 'LAST_ORDER_QTY') {
```

**Passo 2.2 — Atualizar package.json do backend**
```json
{
  "dependencies": {
    "@sendgrid/mail": "^8.1.3",
    "aes-js": "^3.1.2",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "express-async-errors": "^3.1.1",
    "helmet": "^8.0.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "mysql2": "^3.9.0",
    "node-binance-api": "^1.0.22",
    "node-schedule": "^2.1.1",
    "sequelize": "^6.37.3",
    "technicalindicators": "^3.1.0",
    "twilio": "^5.3.0",
    "ws": "^8.18.0"
  }
}
```

**Passo 2.3 — Instalar dependências atualizadas**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm audit fix
npm audit  # verificar se ainda há críticos
```

### FASE 3 — Compatibilidade com nova node-binance-api (Fazer TERCEIRO)

A atualização de 0.12.5 para 1.0.22 pode ter breaking changes. Verificar e ajustar:

**Passo 3.1 — Testar exchange.js com nova versão**
```javascript
// Possíveis mudanças na API da lib:
// - Verificar se binance.balance() ainda retorna mesmo formato
// - Verificar se websockets.miniTicker ainda funciona igual
// - Verificar se websockets.bookTickers ainda funciona igual
// - Adicionar keepalive para userDataStream
```

**Passo 3.2 — Adicionar keepalive no userDataStream**
```javascript
// backend/src/utils/exchange.js
// Adicionar após iniciar userDataStream:
setInterval(() => {
    binance.keepAlive(); // Evita timeout do stream
}, 30 * 60 * 1000); // A cada 30 minutos
```

**Passo 3.3 — Adicionar reconexão automática**
```javascript
// Adicionar lógica de reconnect em caso de queda do WebSocket
// Usando eventos 'close' e 'error' dos streams
```

### FASE 4 — Melhorias de Robustez (Fazer QUARTO)

**Passo 4.1 — Logging estruturado**
```bash
npm install winston
```
Substituir `console.log/error` por logger estruturado com níveis (info, warn, error) e saída em arquivo.

**Passo 4.2 — Health check endpoint**
```javascript
// GET /health — retorna status do bot, conexões ativas, memória usada
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date()
    });
});
```

**Passo 4.3 — Tratamento de erros global melhorado**
Garantir que erros não derrubem o processo. Usar `process.on('unhandledRejection')` e `process.on('uncaughtException')`.

### FASE 5 — Estratégias de Trading (Fazer QUINTO)

O sistema de automações já está implementado. As estratégias são configuradas via interface. Mas podemos criar automações padrão via seeders:

**Estratégia 1 — RSI Oversold/Overbought (Mais simples)**
```
Condição de COMPRA:  RSI_14 < 30  (ativo sobrevendido)
Condição de VENDA:   RSI_14 > 70  (ativo sobrecomprado)
Par sugerido: BTCUSDT no intervalo 1h
```

**Estratégia 2 — EMA Crossover (Tendência)**
```
Condição de COMPRA:  EMA_9 cruza acima de EMA_21
Condição de VENDA:   EMA_9 cruza abaixo de EMA_21
Par sugerido: BTCUSDT ou ETHUSDT no intervalo 4h
```

**Estratégia 3 — Bollinger Bands (Reversão)**
```
Condição de COMPRA:  Preço toca a banda inferior (lower)
Condição de VENDA:   Preço toca a banda superior (upper)
Par sugerido: BTCUSDT no intervalo 1h
```

**Estratégia 4 — Grid Trading (Mercado lateral — JÁ IMPLEMENTADO)**
```
Definir range de preço (ex: BTC entre $80,000 e $100,000)
Definir número de níveis (ex: 10 grids)
Bot compra nas quedas e vende nas altas automaticamente
Melhor em mercado sem tendência definida
```

**Estratégia 5 — MACD Signal**
```
Condição de COMPRA:  MACD cruza acima da linha de sinal (histogram > 0)
Condição de VENDA:   MACD cruza abaixo da linha de sinal (histogram < 0)
Par sugerido: ETHUSDT no intervalo 4h
```

**⚠️ IMPORTANTE sobre estratégias:**
- Sempre testar primeiro na **Binance Testnet** antes de usar dinheiro real
- Começar com valores pequenos (equivalente a $20-50 USDT)
- Nunca arriscar mais do que pode perder
- Estratégias passadas não garantem resultados futuros

### FASE 6 — Deploy em Produção (Fazer SEXTO)

**Opção recomendada: VPS DigitalOcean ou Vultr (~$6/mês)**
Motivo: bot precisa rodar 24/7 sem sleep, Railway e Render têm limitações.

**Passo 6.1 — Criar VPS (Ubuntu 22.04)**
```bash
# Após criar o servidor e conectar via SSH:
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git
```

**Passo 6.2 — Instalar Node.js 20 LTS**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # deve mostrar v20.x
```

**Passo 6.3 — Instalar MySQL**
```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
sudo mysql -e "CREATE DATABASE beholder;"
sudo mysql -e "CREATE USER 'beholder'@'localhost' IDENTIFIED BY 'SENHA_FORTE';"
sudo mysql -e "GRANT ALL PRIVILEGES ON beholder.* TO 'beholder'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

**Passo 6.4 — Instalar PM2 (manter bot vivo)**
```bash
sudo npm install -g pm2
```

**Passo 6.5 — Clonar projeto e configurar**
```bash
git clone https://github.com/karawell/beholder.git
cd beholder/backend
cp .env.example .env
nano .env  # preencher com dados reais
npm install
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

**Passo 6.6 — Iniciar com PM2**
```bash
# Usar o arquivo pm2 que já existe no projeto
pm2 start beholder-pm2.json
pm2 save
pm2 startup  # configurar para reiniciar com o sistema
```

**Passo 6.7 — Configurar Nginx como proxy reverso (opcional)**
```bash
sudo apt install -y nginx
# Configurar para servir o frontend e fazer proxy do backend
```

**Passo 6.8 — Build do frontend para produção**
```bash
cd frontend
npm install
npm run build
# Copiar /build para pasta servida pelo Nginx
```

### FASE 7 — Monitoramento (Fazer SÉTIMO)

**Passo 7.1 — Configurar alertas no PM2**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

**Passo 7.2 — Configurar alertas de email/SMS**
O sistema já tem suporte a SendGrid e Twilio.
Criar automação no Beholder para alertar em caso de:
- Ordem executada
- Erro de conexão
- Saldo abaixo de threshold

**Passo 7.3 — Configurar Binance Testnet para testes**
```
API URL Testnet: https://testnet.binance.vision/api/
Stream URL: wss://testnet.binance.vision/stream
Criar conta em: https://testnet.binance.vision/
```

---

## 🔑 Configurações da Binance necessárias

**Para criar API Key na Binance:**
1. Acessar Binance → Perfil → Gerenciamento de API
2. Criar nova API Key com permissões:
   - ✅ Leitura de dados
   - ✅ Trading Spot & Margin
   - ❌ Saques (NUNCA habilitar)
3. Restringir por IP do servidor VPS (mais seguro)

**URLs de produção:**
```
API URL: https://api.binance.com/api/
Stream URL: wss://stream.binance.com:9443/
```

---

## 📦 Stack Tecnológica

| Componente | Tecnologia | Versão Alvo |
|---|---|---|
| Runtime | Node.js | 20 LTS |
| Framework | Express | 4.21+ |
| ORM | Sequelize | 6.37+ |
| Banco de dados | MySQL | 8.0+ |
| WebSocket server | ws | 8.18+ |
| Binance API | node-binance-api | 1.0.22+ |
| Indicadores | technicalindicators | 3.1.0 |
| Agendamento | node-schedule | 2.1+ |
| Processo manager | PM2 | latest |
| Frontend | React | 17 (manter por ora) |
| Auth | JWT | 9.0+ |
| Email | SendGrid | 8.x |
| SMS | Twilio | 5.x |

---

## 🎯 Objetivo Final

Ter o Beholder rodando 24/7 em produção numa VPS, com:
1. Conexão estável com a Binance via WebSocket
2. Pelo menos 2-3 estratégias configuradas e testadas
3. Alertas de email/Telegram para cada ordem executada
4. Dashboard acessível via browser para monitoramento
5. Reconexão automática em caso de queda
6. Logs estruturados para auditoria de trades

**Ordem de implementação sugerida ao abrir Claude Code:**
```
1. Corrija o bug crítico no beholder.js linha 220
2. Atualize o package.json com as versões seguras listadas
3. Verifique compatibilidade do exchange.js com node-binance-api 1.0.22
4. Adicione reconexão automática nos WebSocket streams
5. Adicione health check endpoint
6. Prepare scripts de deploy para VPS Ubuntu
```
