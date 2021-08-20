import React, { useMemo } from 'react';

/**
 * props:
 * - wallet
 */
function WalletSummary(props) {

    const walletSummary = useMemo(() => (
        <div className="row">
            <div className="col-md-6 mb-3">
                <div className="form-group">
                    <div className="alert alert-success py-1">
                        {`${props.wallet.base.symbol}: ${props.wallet.base.qty ? props.wallet.base.qty : 0}`}
                    </div>
                </div>
            </div>
            <div className="col-md-6 mb-3">
                <div className="form-group">
                    <div className="alert alert-info py-1">
                        {`${props.wallet.quote.symbol}: ${props.wallet.quote.qty ? props.wallet.quote.qty : 0}`}
                    </div>
                </div>
            </div>
        </div>
    ), [props.wallet.base, props.wallet.quote])

    return walletSummary;
}

export default WalletSummary;