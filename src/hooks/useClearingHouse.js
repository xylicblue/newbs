// Hooks for ClearingHouse contract interactions
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'ethers';
import { SEPOLIA_CONTRACTS, MARKET_IDS } from '../contracts/addresses';
import ClearingHouseABI from '../contracts/abis/ClearingHouse.json';

const SEPOLIA_CHAIN_ID = 11155111;

/**
 * Get user's position for a specific market
 * @param {string} marketId - Market ID (keccak256 of market name)
 * @param {string} userAddress - User's wallet address (optional, uses connected wallet)
 */
export function usePosition(marketId, userAddress = null) {
  const { address: connectedAddress } = useAccount();
  const addressToUse = userAddress || connectedAddress;

  const { data, isLoading, error, refetch } = useReadContract({
    address: SEPOLIA_CONTRACTS.clearingHouse,
    abi: ClearingHouseABI.abi,
    functionName: 'getPosition',
    args: [addressToUse, marketId],
    chainId: SEPOLIA_CHAIN_ID,
    query: {
      enabled: !!addressToUse && !!marketId,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  // Position struct: PositionView { size, margin, entryPriceX18, lastFundingIndex, realizedPnL }
  // size and lastFundingIndex are int256, others are uint256

  if (!data || !addressToUse || !Array.isArray(data)) {
    return {
      position: null,
      isLoading,
      error,
      refetch,
    };
  }

  // Parse the position data from struct
  // Wagmi returns struct as array: [size, margin, entryPriceX18, lastFundingIndex, realizedPnL]
  const size = data[0] || 0n;
  const margin = data[1] || 0n;
  const entryPriceX18 = data[2] || 0n;
  const lastFundingIndex = data[3] || 0n;
  const realizedPnL = data[4] || 0n;

  const position = {
    size: size ? formatUnits(size, 18) : '0',
    sizeRaw: size,
    margin: margin ? formatUnits(margin, 18) : '0',
    marginRaw: margin,
    entryPriceX18: entryPriceX18 ? formatUnits(entryPriceX18, 18) : '0',
    lastFundingIndex: lastFundingIndex ? formatUnits(lastFundingIndex, 18) : '0',
    realizedPnL: realizedPnL ? formatUnits(realizedPnL, 18) : '0',
    // Helper flags
    hasPosition: size && size !== 0n,
    isLong: size && size > 0n,
    isShort: size && size < 0n,
  };

  return {
    position,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Get all positions for the connected user across all markets
 */
export function useAllPositions() {
  const { address } = useAccount();

  // Fetch positions for both markets
  const ethPerpV2 = usePosition(MARKET_IDS['ETH-PERP-V2'], address);
  const ethPerp = usePosition(MARKET_IDS['ETH-PERP'], address);

  const positions = [];

  if (ethPerpV2.position && ethPerpV2.position.hasPosition) {
    positions.push({
      marketName: 'ETH-PERP-V2',
      marketId: MARKET_IDS['ETH-PERP-V2'],
      ...ethPerpV2.position,
    });
  }

  if (ethPerp.position && ethPerp.position.hasPosition) {
    positions.push({
      marketName: 'ETH-PERP',
      marketId: MARKET_IDS['ETH-PERP'],
      ...ethPerp.position,
    });
  }

  return {
    positions,
    isLoading: ethPerpV2.isLoading || ethPerp.isLoading,
    error: ethPerpV2.error || ethPerp.error,
  };
}

/**
 * Get user's account balance and margin info
 * @param {string} userAddress - User's wallet address
 */
export function useAccountValue(userAddress = null) {
  const { address: connectedAddress } = useAccount();
  const addressToUse = userAddress || connectedAddress;

  const { data, isLoading } = useReadContract({
    address: SEPOLIA_CONTRACTS.clearingHouse,
    abi: ClearingHouseABI.abi,
    functionName: 'getAccountValue',
    args: [addressToUse],
    chainId: SEPOLIA_CHAIN_ID,
    query: {
      enabled: !!addressToUse,
      refetchInterval: 5000,
    },
  });

  return {
    accountValue: data ? formatUnits(data, 18) : '0',
    accountValueRaw: data,
    isLoading,
  };
}

/**
 * Open a position (long or short)
 * @param {string} marketId - Market ID
 */
export function useOpenPosition(marketId) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const openPosition = (isLong, size, priceLimit = 0) => {
    const sizeWei = parseUnits(size.toString(), 18);
    const priceLimitWei = parseUnits(priceLimit.toString(), 18);

    writeContract({
      address: SEPOLIA_CONTRACTS.clearingHouse,
      abi: ClearingHouseABI.abi,
      functionName: 'openPosition',
      args: [marketId, isLong, sizeWei, priceLimitWei],
      chainId: SEPOLIA_CHAIN_ID,
    });
  };

  return {
    openPosition,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * Close a position
 * @param {string} marketId - Market ID
 */
export function useClosePosition(marketId) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const closePosition = (size, priceLimit = 0) => {
    const sizeWei = parseUnits(size.toString(), 18);
    const priceLimitWei = parseUnits(priceLimit.toString(), 18);

    writeContract({
      address: SEPOLIA_CONTRACTS.clearingHouse,
      abi: ClearingHouseABI.abi,
      functionName: 'closePosition',
      args: [marketId, sizeWei, priceLimitWei],
      chainId: SEPOLIA_CHAIN_ID,
    });
  };

  return {
    closePosition,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * Deposit collateral
 * @param {string} tokenAddress - Collateral token address (e.g., USDC)
 */
export function useDeposit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const deposit = (tokenAddress, amount) => {
    // Amount should be in token's decimals (6 for USDC, 18 for WETH)
    const decimals = tokenAddress === SEPOLIA_CONTRACTS.mockUSDC ? 6 : 18;
    const amountWei = parseUnits(amount.toString(), decimals);

    writeContract({
      address: SEPOLIA_CONTRACTS.clearingHouse,
      abi: ClearingHouseABI.abi,
      functionName: 'deposit',
      args: [tokenAddress, amountWei],
      chainId: SEPOLIA_CHAIN_ID,
    });
  };

  return {
    deposit,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * Withdraw collateral
 * @param {string} tokenAddress - Collateral token address
 */
export function useWithdraw() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdraw = (tokenAddress, amount) => {
    const decimals = tokenAddress === SEPOLIA_CONTRACTS.mockUSDC ? 6 : 18;
    const amountWei = parseUnits(amount.toString(), decimals);

    writeContract({
      address: SEPOLIA_CONTRACTS.clearingHouse,
      abi: ClearingHouseABI.abi,
      functionName: 'withdraw',
      args: [tokenAddress, amountWei],
      chainId: SEPOLIA_CHAIN_ID,
    });
  };

  return {
    withdraw,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}
