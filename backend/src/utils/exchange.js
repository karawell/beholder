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
        binance.websockets.bookTickers(order => callback(order));
    }

    function userDataStream(balanceCallback, executionCallback, listStatusCallback) {
        binance.websockets.userData(
            null,
            balance => balanceCallback(balance),
            executionData => executionCallback(executionData),
            subscribedData => console.log(`userDataStream:subscribed: ${subscribedData}`),
            listStatusData => listStatusCallback ? listStatusCallback(listStatusData) : null
        )
    }

    async function chartStream(symbol, interval, callback) {
        binance.websockets.chart(symbol, interval, (symbol, interval, chart) => {
            const tick = binance.last(chart);
            if (tick && chart[tick] && chart[tick].isFinal === false)
                return;

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