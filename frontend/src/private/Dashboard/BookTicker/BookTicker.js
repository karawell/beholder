import React, { useState, useEffect } from 'react';
import SelectQuote, { filterSymbolNames, getDefaultQuote } from '../../../components/SelectQuote/SelectQuote';
import '../Dashboard.css';
import { getSymbols } from '../../../services/SymbolsService';
import BookRow from './BookRow';

/**
 * props:
 * - data
 */
function BookTicker(props) {

    const [symbols, setSymbols] = useState([]);

    const [quote, setQuote] = useState(getDefaultQuote());

    useEffect(() => {
        const token = localStorage.getItem('token');
        getSymbols(token)
            .then(symbols => setSymbols(filterSymbolNames(symbols, quote)))
            .catch(err => console.error(err.response ? err.response.data : err.message))
    }, [quote])

    function onQuoteChange(event) {
        setQuote(event.target.value);
    }

    if (!props || !props.data) return (<React.Fragment></React.Fragment>);

    return (
        <React.Fragment>
            <div className="col-sm-12 col-md-6 mb-4">
                <div className="card border-0 shadow">
                    <div className="card-header">
                        <div className="row">
                            <div className="col">
                                <h2 className="fs-5 fw-bold mb-0">Book</h2>
                            </div>
                            <div className="col offset-md-3">
                                <SelectQuote onChange={onQuoteChange} />
                            </div>
                        </div>
                    </div>
                    <div className="table-responsive divScroll">
                        <table className="table align-items-center table-flush table-sm table-hover tableFixHead">
                            <thead className="thead-light">
                                <tr>
                                    <th className="border-bottom col-2" scope="col">SYMBOL</th>
                                    <th className="border-bottom col-2" scope="col">BID</th>
                                    <th className="border-bottom col-2" scope="col">ASK</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    Array.isArray(symbols) && symbols.map(item => (
                                        <BookRow key={item} symbol={item} data={props.data[item]} />
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default BookTicker;