const technicalindicators = require('technicalindicators');

const indexKeys = {
    RSI: 'RSI',
    MACD: 'MACD',
    SMA: 'SMA',
    EMA: 'EMA',
    STOCH_RSI: 'SRSI',
    BOLLINGER_BANDS: 'BB',
    MINI_TICKER: 'MINI_TICKER',
    BOOK: 'BOOK',
    WALLET: 'WALLET',
    LAST_ORDER: 'LAST_ORDER',
    LAST_CANDLE: 'LAST_CANDLE'
}

function RSI(closes, period = 14) {
    const rsiResult = technicalindicators.rsi({
        period,
        values: closes
    })
    return {
        current: parseFloat(rsiResult[rsiResult.length - 1]),
        previous: parseFloat(rsiResult[rsiResult.length - 2]),
    }
}

function MACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const macdResult = technicalindicators.macd({
        values: closes,
        SimpleMAOscillator: false,
        SimpleMASignal: false,
        fastPeriod,
        slowPeriod,
        signalPeriod
    });
    return {
        current: macdResult[macdResult.length - 1],
        previous: macdResult[macdResult.length - 2]
    }
}

function StochRSI(closes, dPeriod = 3, kPeriod = 3, rsiPeriod = 14, stochasticPeriod = 14) {
    const stochResult = technicalindicators.stochasticrsi({
        dPeriod,
        kPeriod,
        rsiPeriod,
        stochasticPeriod,
        values: closes
    });
    return {
        current: parseFloat(stochResult[stochResult.length - 1]),
        previous: parseFloat(stochResult[stochResult.length - 2])
    }
}

function BollingerBands(closes, period = 20, stdDev = 2) {
    const bbResult = technicalindicators.bollingerbands({
        period,
        stdDev,
        values: closes
    })
    return {
        current: bbResult[bbResult.length - 1],
        previous: bbResult[bbResult.length - 2]
    }
}

function SMA(closes, period = 10) {
    const smaResult = technicalindicators.sma({
        values: closes,
        period
    });
    return {
        current: smaResult[smaResult.length - 1],
        previous: smaResult[smaResult.length - 2],
    }
}

function EMA(closes, period = 10) {
    const emaResult = technicalindicators.ema({
        values: closes,
        period
    });
    return {
        current: emaResult[smaResult.length - 1],
        previous: emaResult[smaResult.length - 2],
    }
}

module.exports = {
    RSI,
    MACD,
    StochRSI,
    BollingerBands,
    SMA,
    EMA,
    indexKeys
}