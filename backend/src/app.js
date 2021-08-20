const express = require('express');
const authMiddleware = require('./middlewares/authMiddleware');
const authController = require('./controllers/authController');
const morgan = require("morgan");

require('express-async-errors');

const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

app.use(helmet());

app.use(express.json());

app.use(morgan('dev'));

app.post('/login', authController.doLogin);

const settingsRouter = require('./routers/settingsRouter');
app.use('/settings', authMiddleware, settingsRouter);

const symbolsRouter = require('./routers/symbolsRouter');
app.use('/symbols', authMiddleware, symbolsRouter);

const exchangeRouter = require('./routers/exchangeRouter');
app.use('/exchange', authMiddleware, exchangeRouter);

const ordersRouter = require('./routers/ordersRouter');
app.use('/orders', authMiddleware, ordersRouter);

const monitorsRouter = require('./routers/monitorsRouter');
app.use('/monitors', authMiddleware, monitorsRouter);

const automationsRouter = require('./routers/automationsRouter');
app.use('/automations', authMiddleware, automationsRouter);

const orderTemplatesRouter = require('./routers/orderTemplatesRouter');
app.use('/ordertemplates', authMiddleware, orderTemplatesRouter);

const beholderRouter = require('./routers/beholderRouter');
app.use('/beholder', authMiddleware, beholderRouter);

app.post('/logout', authController.doLogout);

// app.get('/test', (req,res, next) => {
//     try {
//         const beholder = require('./beholder');
//         beholder.updateMemory("MATIC", "WALLET", null, 1000, false);
//         const qty = beholder.calcQty({
//             symbol: "MATICUSDT",
//             side: "SELL",
//             type: "MARKET",
//             name: "Sell teste",
//             quantity: "MAX_WALLET",
//             quantityMultiplier: 0.05
//         }, 1.07206, {
//             symbol: "MATICUSDT",
//             basePrecision: 8,
//             quotePrecision: 8,
//             minNotional: "10.00000000",
//             minLotSize: "0.10000000",
//             stepSize: "0.10000000",
//             base: "MATIC",
//             quote: "USDT"
//         }, false)
//         console.log(qty);
//         res.json(qty);
//     } catch (err) {
//         console.log(err);
//     }
// })

app.use(require('./middlewares/errorMiddleware'));

module.exports = app;
