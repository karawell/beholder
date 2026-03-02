const Binance = require('node-binance-api');

module.exports = (settings) => {

    if (!settings) throw new Error('The settings object is required to connect on exchange.');

    const binance = new Binance({
        APIKEY: settings.accessKey,
        APISECRET: settings.secretKey,
        recvWindow: 60000,
        urls: {
            base: settings.apiUrl.endsWith('/') ? settings.apiUrl : settings.apiUrl + '/',
            stream: settings.streamUrl.endsWith('/') ? settings.streamUrl : settings.streamUrl + '/',
        }
    })

    function balance() {
        return binance.balance();
    }

    function exchangeInfo() {
        return binance.exchangeInfo();
    }

    function buy(symbol, quantity, price, options) {
        if (price)
            return binance.buy(symbol, quantity, price, options);

        return binance.marketBuy(symbol, quantity);
    }

    function sell(symbol, quantity, price, options) {
        if (price)
            return binance.sell(symbol, quantity, price, options);

        return binance.marketSell(symbol, quantity);
    }

    function cancel(symbol, orderId) {
        return binance.cancel(symbol, orderId);
    }

    function miniTickerStream(callback) {
        binance.websockets.miniTicker(markets => callback(markets));
    }

    function bookStream(callback) {
        const reconnect = () => bookStream(callback);
        binance.websockets.subscribe('!bookTicker@arr', data => {
            const orders = Array.isArray(data) ? data : [data];
            orders.forEach(d => callback({
                updateId: d.u,
                symbol: d.s,
                bestBid: d.b,
                bestBidQty: d.B,
                bestAsk: d.a,
                bestAskQty: d.A
            }));
        }, reconnect);
    }

    async function userDataStream(balanceCallback, executionCallback, listStatusCallback) {
        const RETRY_INTERVAL = 30000;
        let keepAliveTimer = null;

        function listenKeyRequest(method, listenKey) {
            return new Promise((resolve, reject) => {
                const apiBase = settings.apiUrl.endsWith('/') ? settings.apiUrl : settings.apiUrl + '/';
                const path = listenKey
                    ? `v3/userDataStream?listenKey=${listenKey}`
                    : 'v3/userDataStream';
                const url = new URL(path, apiBase);
                const lib = url.protocol === 'https:' ? require('https') : require('http');

                const req = lib.request({
                    hostname: url.hostname,
                    port: url.port || undefined,
                    path: url.pathname + url.search,
                    method,
                    headers: { 'X-MBX-APIKEY': settings.accessKey, 'Content-Length': 0 }
                }, (res) => {
                    let body = '';
                    res.on('data', d => body += d);
                    res.on('end', () => {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            try { resolve(body ? JSON.parse(body) : {}); }
                            catch (e) { reject(new Error(body)); }
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                        }
                    });
                });
                req.on('error', reject);
                req.end();
            });
        }

        const connect = async () => {
            if (keepAliveTimer) {
                clearInterval(keepAliveTimer);
                keepAliveTimer = null;
            }

            try {
                const data = await listenKeyRequest('POST');
                const listenKey = data.listenKey;

                binance.websockets.subscribe(listenKey, msg => {
                    if (msg.e === 'outboundAccountPosition') {
                        balanceCallback(msg);
                    } else if (msg.e === 'executionReport') {
                        executionCallback(msg);
                    } else if (msg.e === 'listStatus' && listStatusCallback) {
                        listStatusCallback(msg);
                    }
                });

                keepAliveTimer = setInterval(() => {
                    listenKeyRequest('PUT', listenKey)
                        .catch(err => {
                            console.error('userDataStream keepalive error:', err.message);
                            clearInterval(keepAliveTimer);
                            keepAliveTimer = null;
                            connect();
                        });
                }, 30 * 60 * 1000);

                console.log('userDataStream: connected via listen key');
            } catch (err) {
                console.error(`userDataStream error: ${err.message}. Retrying in ${RETRY_INTERVAL / 1000}s...`);
                setTimeout(connect, RETRY_INTERVAL);
            }
        };

        await connect();
    }

    async function chartStream(symbol, interval, callback) {
        let prevTick = null;
        binance.websockets.chart(symbol, interval, (symbol, interval, chart) => {
            const tick = binance.last(chart);
            if (!tick || tick === prevTick) return;
            prevTick = tick;

            const ohlc = { open: [], high: [], low: [], close: [], volume: [] };
            Object.values(chart).forEach(candle => {
                ohlc.open.push(parseFloat(candle.open));
                ohlc.high.push(parseFloat(candle.high));
                ohlc.low.push(parseFloat(candle.low));
                ohlc.close.push(parseFloat(candle.close));
                ohlc.volume.push(parseFloat(candle.volume));
            });
            callback(ohlc);
        })
    }

    function terminateChartStream(symbol, interval) {
        binance.websockets.terminate(`${symbol.toLowerCase()}@kline_${interval}`);
        console.log(`Chart Stream ${symbol.toLowerCase()}@kline_${interval} terminated!`);
    }

    return {
        exchangeInfo,
        miniTickerStream,
        bookStream,
        userDataStream,
        chartStream,
        balance,
        buy,
        sell,
        cancel,
        terminateChartStream
    }
}