import React, { useState, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';

/**
 * props:
 * - symbol
 * - onChange
 */
function SymbolPrice(props) {

    const [symbol, setSymbol] = useState('BTCUSDT');
    const [book, setBook] = useState({ bid: '0', ask: '0' });

    useEffect(() => {
        if (!props.symbol) return;
        setSymbol(props.symbol);
    }, [props.symbol])

    function getBinanceWSUrl() {
        return `${process.env.REACT_APP_BWS_URL}/${symbol.toLowerCase()}@bookTicker`;
    }

    const { lastJsonMessage, sendJsonMessage } = useWebSocket(getBinanceWSUrl(), {
        onOpen: () => {
            console.log(`Connected to Binance Stream ${symbol}`);
            sendJsonMessage({
                method: "SUBSCRIBE",
                params: [`${symbol.toLowerCase()}@bookTicker`],
                id: 1
            })
        },
        onMessage: () => {
            if (lastJsonMessage) {
                const b = { bid: lastJsonMessage.b, ask: lastJsonMessage.a };
                setBook(b);
                if (props.onChange) props.onChange(b);
            }
        },
        onError: (event) => console.error(event),
        shouldReconnect: (closeEvent) => true,
        reconnectInterval: 3000
    });

    return (
        <div className="form-group">
            <label>Market Price</label><br />
            BID: {book.bid}<br />
            ASK: {book.ask}
        </div>
    )
}

export default SymbolPrice;