// ByteStrike Contract Addresses on Sepolia Testnet
// Chain ID: 11155111
// Deployed: 2025-01-05

export const SEPOLIA_CONTRACTS = {
  // Core Protocol Contracts
  clearingHouse: '0x445Fa8890562Ec6220A60b3911C692DffaD49AcB', // Proxy
  marketRegistry: '0x937F40013B088832919992E0Bd0D0F48520dC964',
  collateralVault: '0x7109D4E5368476a2FeCaACCfDbd9E77284C5987C',

  // vAMMs
  vammProxy: '0x3f9b634b9f09e7F8e84348122c86d3C2324841b5', // New vAMM with $3.75 price (Deployed: Nov 7, 2025)
  vammProxyOld: '0xF8908F7B4a1AaaD69bF0667FA83f85D3d0052739', // Old vAMM (deprecated)

  // Supporting Contracts
  insuranceFund: '0x3C1085dF918a38A95F84945E6705CC857b664074',
  feeRouter: '0xa75839A6D2Bb2f47FE98dc81EC47eaD01D4A2c1F',
  oracle: '0x3cA2Da03e4b6dB8fe5a24c22Cf5EB2A34B59cbad', // Oracle (Updated: Nov 7, 2025)

  // Mock Tokens (for testing)
  mockUSDC: '0x8C68933688f94BF115ad2F9C8c8e251AE5d4ade7',
  usdc: '0x8C68933688f94BF115ad2F9C8c8e251AE5d4ade7', // Alias for compatibility
  mockWETH: '0xc696f32d4F8219CbA41bcD5C949b2551df13A7d6',
};

// Market IDs (keccak256 of market symbol)
export const MARKET_IDS = {
  'ETH-PERP': '0x352291f10e3a0d4a9f7beb3b623eac0b06f735c95170f956bc68b2f8b504a35d', // Old market ($2000)
  'ETH-PERP-V2': '0x385badc5603eb47056a6bdcd6ac81a50df49d7a4e8a7451405e580bd12087a28', // New market ($3.75) ⭐
};

// Default market to use in the frontend
export const DEFAULT_MARKET_ID = MARKET_IDS['ETH-PERP-V2']; // Use the new $3.75 market

// Implementation Contracts (for reference)
const IMPLEMENTATIONS = {
  clearingHouseImpl: '0x260082DddF1c367008E889Db10836019de4910fD',
  vammImpl: '0x2E3f3D9aC763C3c7D8F5A9D6A94dD745D76D9e8f',
};

// Supported collateral tokens
export const COLLATERAL_TOKENS = [
  {
    address: '0x8C68933688f94BF115ad2F9C8c8e251AE5d4ade7',
    symbol: 'mUSDC',
    name: 'Mock USDC',
    decimals: 6,
    icon: '💵',
  },
  {
    address: '0xc696f32d4F8219CbA41bcD5C949b2551df13A7d6',
    symbol: 'mWETH',
    name: 'Mock Wrapped Ether',
    decimals: 18,
    icon: '⟠',
  },
];

// Chain configuration
export const CHAIN_CONFIG = {
  chainId: 11155111,
  name: 'Sepolia',
  rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY', // Replace with your RPC
  blockExplorer: 'https://sepolia.etherscan.io',
};

// Helper function to get contract address by name
export function getContractAddress(contractName) {
  return SEPOLIA_CONTRACTS[contractName];
}

// Helper to check if we're on the correct network
export function isCorrectNetwork(chainId) {
  return chainId === CHAIN_CONFIG.chainId;
}

// Helper to get Etherscan link
export function getEtherscanLink(address, type = 'address') {
  return `${CHAIN_CONFIG.blockExplorer}/${type}/${address}`;
}

// Helper to get transaction link
export function getTxLink(hash) {
  return getEtherscanLink(hash, 'tx');
}
