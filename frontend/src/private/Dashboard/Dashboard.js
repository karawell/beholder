import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import useWebSocket from 'react-use-websocket';
import Menu from '../../components/Menu/Menu';
import MiniTicker from './MiniTicker/MiniTicker';
import BookTicker from './BookTicker/BookTicker';
import Wallet from './Wallet/Wallet';
import NewOrderButton from '../../components/NewOrder/NewOrderButton';
import NewOrderModal from '../../components/NewOrder/NewOrderModal';
import CandleChart from './CandleChart';
import SelectSymbol from '../../components/SelectSymbol/SelectSymbol';
import Footer from '../../components/Footer/Footer';
import Toast from '../../components/Toast/Toast';

function Dashboard() {

    const history = useHistory();

    const [miniTickerState, setMiniTickerState] = useState({});

    const [bookState, setBookState] = useState({});

    const [balanceState, setBalanceState] = useState({});

    const [wallet, setWallet] = useState({});

    const [notification, setNotification] = useState({ type: '', text: '' });

    const [chartSymbol, setChartSymbol] = useState("BTCBUSD");

    function onWalletUpdate(walletObj) {
        setWallet(walletObj);
    }

    function onOrderSubmit(order) {
        history.push('/orders/' + order.symbol);
    }

    const { lastJsonMessage } = useWebSocket(process.env.REACT_APP_WS_URL, {
        onOpen: () => console.log(`Connected to App WS Server`),
        onMessage: () => {
            if (lastJsonMessage) {
                if (lastJsonMessage.miniTicker) setMiniTickerState(lastJsonMessage.miniTicker);
                if (lastJsonMessage.book) {
                    lastJsonMessage.book.forEach(b => bookState[b.symbol] = b);
                    setBookState(bookState);
                }
                if (lastJsonMessage.balance) setBalanceState(lastJsonMessage.balance);
            }
        },
        queryParams: { "token": localStorage.getItem('token') },
        onError: (err) => {
            console.error(err);
            setNotification({ type: 'error', text: err.message });
        },
        shouldReconnect: (closeEvent) => true,
        reconnectInterval: 3000
    })

    function onChangeSymbol(event) {
        setChartSymbol(event.target.value);
    }

    return (
        <React.Fragment>
            <Menu />
            <main className="content">
                <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center py-4">
                    <div className="d-block mb-4 mb-md-0">
                        <h1 className="h4">Dashboard</h1>
                    </div>
                    <div className="btn-toolbar mb-md-0">
                        <div className="d-inline-flex align-items-center">
                            <SelectSymbol onChange={onChangeSymbol} />
                        </div>
                        <div className="ms-2 ms-lg-3">
                            <NewOrderButton />
                        </div>
                    </div>
                </div>
                <CandleChart symbol={chartSymbol} />
                <div className="row">
                    <MiniTicker data={miniTickerState} />
                </div>
                <div className="row">
                    <BookTicker data={bookState} />
                    <Wallet data={balanceState} onUpdate={onWalletUpdate} />
                </div>
                <Footer />
            </main>
            <NewOrderModal wallet={wallet} onSubmit={onOrderSubmit} />
            <Toast type={notification.type} text={notification.text} />
        </React.Fragment>
    );
}

export default Dashboard;