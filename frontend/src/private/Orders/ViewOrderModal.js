import React, { useRef, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { cancelOrder } from '../../services/OrdersService';

/**
 * props:
 * - data
 * - onCancel
 */
function ViewOrderModal(props) {

    const history = useHistory();

    const [error, setError] = useState('');
    const [order, setOrder] = useState({
        symbol: ''
    })

    useEffect(() => {
        if (props.data) {
            setOrder(props.data);

            btnCancel.current.disabled = props.data.status !== 'NEW';
        }
    }, [props.data])

    const btnClose = useRef('');
    const btnCancel = useRef('');

    function getStatusClass(status) {
        switch (status) {
            case 'PARTIALLY_FILLED': return "badge bg-info";
            case 'FILLED': return "badge bg-success";
            case 'REJECTED':
            case 'EXPIRED':
            case 'CANCELED': return "badge bg-danger";
            default: return "badge bg-primary";
        }
    }

    function getDate(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'medium'
        }).format(date);
    }

    function onCancelClick(event) {
        const token = localStorage.getItem('token');
        cancelOrder(order.symbol, order.orderId, token)
            .then(result => {
                btnClose.current.click();
                if (props.onCancel) props.onCancel({ target: { id: 'order', value: order.orderId } });
                return history.push('/orders/' + order.symbol);
            })
            .catch(err => {
                console.error(err.response ? err.response.data : err.message);
                setError(err.response ? err.response.data : err.message);
            })
    }

    return (
        <div className="modal fade" id="modalViewOrder" tabIndex="-1" role="dialog" aria-labelledby="modalTitleNotify" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <p className="modal-title">Order Details</p>
                        <button ref={btnClose} type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                        <div className="form-group">
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <b>Symbol:</b> {order.symbol}
                                </div>
                                <div className="col-md-6 mb-3">
                                    <span className={getStatusClass(order.status)}>{order.status}</span>
                                    {
                                        order.isMaker
                                            ? <span className="badge bg-warning" title="MAKER">M</span>
                                            : <React.Fragment></React.Fragment>
                                    }
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <b>Beholder ID:</b> {order.id}
                                </div>
                                {
                                    order.automationId
                                        ? (
                                            <div className="col-md-6 mb-3">
                                                <b>Automation ID:</b> {order.automationId}
                                            </div>
                                        )
                                        : <React.Fragment></React.Fragment>
                                }
                            </div>
                            <div className="row">
                                <div className="col-12 mb-3">
                                    <b>Binance IDs:</b> {order.orderId} / {order.clientOrderId}
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <b>Side:</b> {order.side}
                                </div>
                                <div className="col-md-6 mb-3">
                                    <b>Type:</b> {order.type}
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <b>Quantity:</b> {order.quantity}
                                </div>
                                <div className="col-md-6 mb-3">
                                    <b>Unit Price:</b> {order.limitPrice}
                                </div>
                            </div>
                            <div className="row">
                                {
                                    order.icebergQuantity
                                        ? (
                                            <div className="col-md-6 mb-3">
                                                <b>Iceberg Qty:</b> {order.icebergQuantity}
                                            </div>
                                        )
                                        : <React.Fragment></React.Fragment>
                                }
                                {
                                    order.stopPrice
                                        ? (
                                            <div className="col-md-6 mb-3">
                                                <b>Stop Price:</b> {order.stopPrice}
                                            </div>
                                        )
                                        : <React.Fragment></React.Fragment>
                                }
                                <div className="col-md-6 mb-3">
                                    <b>Avg Price:</b> {order.avgPrice}
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-12 mb-3">
                                    <b>Date:</b> {getDate(order.transactTime)}
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <b>Commission:</b> {order.commission}
                                </div>
                                <div className="col-md-6 mb-3">
                                    <b>Net:</b> {order.net}
                                </div>
                            </div>
                            {
                                order.obs
                                    ? (
                                        <div className="row">
                                            <div className="col-12 mb-3">
                                                <b>Obs:</b> {order.obs}
                                            </div>
                                        </div>
                                    )
                                    : <React.Fragment></React.Fragment>
                            }
                        </div>
                    </div>
                    <div className="modal-footer">
                        {
                            error
                                ? <div className="alert alert-danger mt-1 col-9 py-1">{error}</div>
                                : <React.Fragment></React.Fragment>
                        }
                        <button type="button" ref={btnCancel} className="btn btn-danger btn-sm" onClick={onCancelClick}>
                            <svg className="icon icon-xs" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" onClick={onCancelClick}>
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg> Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ViewOrderModal;