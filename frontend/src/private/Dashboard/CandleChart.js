import React, { useState, useEffect, useMemo } from 'react';

/**
 * props:
 * - symbol
 */
function CandleChart(props) {

    const [widget, setWidget] = useState({});

    useEffect(() => {

        const w = new window.TradingView.widget({
            symbol: 'BINANCE:' + props.symbol,
            autosize: true,
            interval: "1",
            timezone: "Etc/UTC",
            theme: "dark",
            style: "1",
            locale: "en",
            toolbar_bg: "#f1f3f6",
            hide_side_toolbar: false,
            enable_publishing: false,
            allow_symbol_change: false,
            details: true,
            withdateranges: true,
            studies: [
                "RSI@tv-basicstudies"
            ],
            container_id: "tradingview"
        });
        setWidget(w);

    }, [props.symbol])

    const widgetHtml = useMemo(() => (
        <div className="row">
            <div className="col-12 mb-4">
                <div className="card cardDark border-0 shadow">
                    <div className="card-body p-2">
                        <div className="tradingview-widget-container">
                            <div id="tradingview" className="divTradingView"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    ), [props.symbol])

    return widgetHtml;
}

export default CandleChart;