// Component to display user's open positions
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import { useAllPositions, useClosePosition } from '../hooks/useClearingHouse';
import { useMarkPrice } from '../hooks/useVAMM';
import { SEPOLIA_CONTRACTS } from '../contracts/addresses';
import './PositionPanel.css';

export function PositionPanel() {
  const { address, isConnected } = useAccount();
  const { positions, isLoading, error } = useAllPositions();
  const [closingPosition, setClosingPosition] = useState(null);
  const [closeSize, setCloseSize] = useState('');

  if (!isConnected) {
    return (
      <div className="position-panel">
        <h3>Your Positions</h3>
        <div className="no-positions">
          <p>Please connect your wallet to view positions</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="position-panel">
        <h3>Your Positions</h3>
        <div className="loading">
          <p>Loading positions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="position-panel">
        <h3>Your Positions</h3>
        <div className="error">
          <p>Error loading positions: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!positions || positions.length === 0) {
    return (
      <div className="position-panel">
        <h3>Your Positions</h3>
        <div className="no-positions">
          <p>No open positions</p>
          <span style={{ fontSize: '0.9rem', color: '#888' }}>
            Open a position to get started
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="position-panel">
      <h3>Your Positions ({positions.length})</h3>
      <div className="positions-list">
        {positions.map((position, index) => (
          <PositionCard
            key={`${position.marketId}-${index}`}
            position={position}
            closingPosition={closingPosition}
            setClosingPosition={setClosingPosition}
            closeSize={closeSize}
            setCloseSize={setCloseSize}
          />
        ))}
      </div>
    </div>
  );
}

function PositionCard({ position, closingPosition, setClosingPosition, closeSize, setCloseSize }) {
  const isLong = position.isLong;
  const size = parseFloat(position.size);
  const absSize = Math.abs(size);
  const entryPrice = parseFloat(position.entryPriceX18);
  const margin = parseFloat(position.margin);
  const realizedPnL = parseFloat(position.realizedPnL);

  // Get current mark price for this market's vAMM
  const vammAddress = position.marketName === 'ETH-PERP-V2'
    ? SEPOLIA_CONTRACTS.vammProxy
    : SEPOLIA_CONTRACTS.vammProxyOld;

  const { markPrice } = useMarkPrice(vammAddress);
  const currentPrice = markPrice ? parseFloat(markPrice) : 0;

  // Calculate current PnL
  const openNotional = entryPrice * absSize;
  const currentPnL = currentPrice > 0
    ? isLong
      ? (currentPrice - entryPrice) * absSize
      : (entryPrice - currentPrice) * absSize
    : 0;

  const pnlPercent = openNotional > 0 ? (currentPnL / openNotional) * 100 : 0;
  const isProfitable = currentPnL >= 0;

  // Close position hook
  const { closePosition, isPending, isSuccess, hash } = useClosePosition(position.marketId);

  const handleClose = (closeAmount) => {
    if (!closeAmount || parseFloat(closeAmount) <= 0) {
      toast.error('Please enter a valid size to close');
      return;
    }

    if (parseFloat(closeAmount) > absSize) {
      toast.error(`Cannot close more than position size (${absSize.toFixed(4)})`);
      return;
    }

    try {
      closePosition(closeAmount, 0); // 0 = market price
      toast.loading('Closing position...', { id: 'close' });
      setClosingPosition(null);
      setCloseSize('');
    } catch (error) {
      console.error('Close position error:', error);
      toast.error('Failed to close position: ' + error.message);
    }
  };

  if (isSuccess) {
    toast.success('Position closed successfully!', { id: 'close' });
  }

  const isClosing = closingPosition === position.marketId;

  return (
    <div className={`position-card ${isLong ? 'long' : 'short'}`}>
      <div className="position-header">
        <div className="position-market">
          <span className="market-name">{position.marketName}</span>
          <span className={`position-side ${isLong ? 'long-badge' : 'short-badge'}`}>
            {isLong ? 'LONG' : 'SHORT'} {absSize.toFixed(4)}
          </span>
        </div>
        <div className={`position-pnl ${isProfitable ? 'profit' : 'loss'}`}>
          {isProfitable ? '+' : ''}${currentPnL.toFixed(2)}
          <span className="pnl-percent">
            ({isProfitable ? '+' : ''}{pnlPercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      <div className="position-details">
        <div className="detail-row">
          <span className="label">Entry Price:</span>
          <span className="value">${entryPrice.toFixed(2)}</span>
        </div>
        <div className="detail-row">
          <span className="label">Mark Price:</span>
          <span className="value">
            ${currentPrice > 0 ? currentPrice.toFixed(2) : 'Loading...'}
          </span>
        </div>
        <div className="detail-row">
          <span className="label">Size:</span>
          <span className="value">{absSize.toFixed(4)} ETH</span>
        </div>
        <div className="detail-row">
          <span className="label">Notional:</span>
          <span className="value">${openNotional.toFixed(2)}</span>
        </div>
        <div className="detail-row">
          <span className="label">Margin:</span>
          <span className="value">${margin.toFixed(2)}</span>
        </div>
        <div className="detail-row">
          <span className="label">Realized PnL:</span>
          <span className={`value ${realizedPnL >= 0 ? 'profit' : 'loss'}`}>
            ${realizedPnL.toFixed(2)}
          </span>
        </div>
      </div>

      {!isClosing ? (
        <div className="position-actions">
          <button
            className="close-button-small"
            onClick={() => setClosingPosition(position.marketId)}
          >
            Close Position
          </button>
        </div>
      ) : (
        <div className="close-position-form">
          <div className="close-input-row">
            <input
              type="number"
              placeholder={`Max: ${absSize.toFixed(4)}`}
              value={closeSize}
              onChange={(e) => setCloseSize(e.target.value)}
              className="close-size-input"
              step="0.0001"
            />
            <button
              className="max-btn"
              onClick={() => setCloseSize(absSize.toString())}
            >
              MAX
            </button>
          </div>
          <div className="close-actions">
            <button
              className="confirm-close"
              onClick={() => handleClose(closeSize)}
              disabled={isPending}
            >
              {isPending ? 'Closing...' : 'Confirm Close'}
            </button>
            <button
              className="cancel-close"
              onClick={() => {
                setClosingPosition(null);
                setCloseSize('');
              }}
            >
              Cancel
            </button>
          </div>
          {hash && (
            <div className="tx-link-small">
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View tx →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PositionPanel;
