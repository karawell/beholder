import React, { useState, useEffect } from 'react';

/**
 * props:
 * - data
 */
function LineChart(props) {

    const [lineChart, setLineChart] = useState({});
    const [report, setReport] = useState({
        profit: 0,
        profitPerc: 0,
        sellVolume: 0,
        buyVolume: 0,
        series: [],
        subs: []
    })

    useEffect(() => {
        if (!report || !report.series || !report.series.length) return;

        const mod = report.subs.length > 20 ? 2 : 1;
        let cont = 0;
        const subs = report.subs.map(s => {
            return cont++ % mod === 0 ? s : '';
        });

        const chart = new window.Chartist.Line('.ct-chart-sales-value', {
            labels: subs,
            series: [report.series]
        }, {
            showArea: true,
            fullWidth: true,
            chartPadding: { right: 20 },
            axisX: { showGrid: true },
            axisY: {
                showGrid: true,
                showLabel: true
            }
        })

        setLineChart(chart);
    }, [report])

    useEffect(() => {
        if (!props.data) return;
        setReport(props.data);
    }, [props.data])

    function getText(value) {
        const signal = value > 0 ? '+' : '';
        return signal + (value ? value.toFixed(2) : value);
    }

    function getTextClass(value) {
        return parseFloat(value) > 0 ? 'text-success' : 'text-danger';
    }

    return (
        <React.Fragment>
            <div className="row">
                <div className="col-12 mb-4">
                    <div className="card bg-yellow-100 border-0 shadow">
                        <div className="card-header d-sm-flex flex-row align-item-center flex-0">
                            <div className="d-block mb-3 mb-sm-0">
                                <h2 className="fs-3 fw-extrabold">{report.quote} {getText(report.sellVolume - report.buyVolume)}</h2>
                            </div>
                            <div className="d-block ms-3">
                                <div className="small">
                                    <span className={getTextClass(report.profitPerc) + " fw-bold"}>
                                        ({getText(report.profitPerc)}%)
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="card-body p-2">
                            <div className="ct-chart-sales-value ct-double-octave"></div>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default LineChart;