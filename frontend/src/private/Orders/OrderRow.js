import React from 'react';

/**
 * props:
 * - data
 * - onClick
 */
function OrderRow(props) {

    function getDate(timestamp) {
        const date = new Date(timestamp);
        return Intl.DateTimeFormat('en-US', {
            dateStyle: 'short',
            timeStyle: 'short'
        })
            .format(date);
    }

    function getStatusClass(status) {
        switch (status) {
            case 'PARTIALLY_FILLED': return 'text-info';
            case 'FILLED': return 'text-success';
            case 'REJECTED':
            case 'EXPIRED':
            case 'CANCELED': return 'text-danger';
            default: return 'fw-normal';
        }
    }

    return (
        <tr>
            <td>{props.data.symbol}</td>
            <td><span className="fw-normal">{getDate(props.data.transactTime)}</span></td>
            <td><span className="fw-normal">{props.data.side}</span></td>
            <td><span className="fw-normal">{props.data.quantity}</span></td>
            <td><span className="fw-bold">{props.data.net}</span></td>
            <td><span className={getStatusClass(props.data.status)}>{props.data.status}</span></td>
            <td>
                <button id={"view" + props.data.id} type="button" className="btn btn-info btn-xs" data-bs-toggle="modal" data-bs-target="#modalViewOrder" onClick={props.onClick}>
                    <svg className="icon icon-xs" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                </button>
            </td>
        </tr>
    )
}

export default OrderRow;