// Component to display wallet connection status and balances
import { useAccount, useBalance, useChainId } from "wagmi";
import { sepolia } from "wagmi/chains";
import toast from "react-hot-toast";
import { SEPOLIA_CONTRACTS } from "../contracts/addresses";
import "./WalletStatus.css";

export function WalletStatus() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address,
    chainId: sepolia.id,
  });

  // Get USDC balance
  const { data: usdcBalance } = useBalance({
    address,
    token: SEPOLIA_CONTRACTS.usdc,
    chainId: sepolia.id,
  });

  if (!isConnected) {
    return (
      <div className="wallet-status disconnected">
        <div className="wallet-header">
          <h3>Wallet</h3>
          <div className="status-badge offline">Disconnected</div>
        </div>
        <div className="wallet-info-text">
          Connect your wallet to start trading
        </div>
      </div>
    );
  }

  const isWrongNetwork = chainId !== sepolia.id;

  return (
    <div
      className={`wallet-status ${
        isWrongNetwork ? "wrong-network" : "connected"
      }`}
    >
      <div className="wallet-header">
        <h3>Wallet</h3>
        <div
          className={`status-badge ${isWrongNetwork ? "warning" : "online"}`}
        >
          {isWrongNetwork ? "Wrong Network" : "Connected"}
        </div>
      </div>

      <div className="wallet-address-row">
        <span className="address-label">Address:</span>
        <span className="address-value">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button
          className="copy-button"
          onClick={() => {
            navigator.clipboard.writeText(address);
            toast.success("Address copied!");
          }}
          title="Copy address"
        >
          Copy
        </button>
      </div>

      {isWrongNetwork ? (
        <div className="network-warning-inline">
          Please switch to Sepolia network
        </div>
      ) : (
        <div className="wallet-balances">
          <div className="balance-item">
            <span className="balance-label">ETH Balance</span>
            <span className="balance-value">
              {ethBalance
                ? parseFloat(ethBalance.formatted).toFixed(4)
                : "0.0000"}{" "}
              ETH
            </span>
          </div>
          <div className="balance-item">
            <span className="balance-label">USDC Balance</span>
            <span className="balance-value">
              {usdcBalance
                ? parseFloat(usdcBalance.formatted).toFixed(2)
                : "0.00"}{" "}
              USDC
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default WalletStatus;
