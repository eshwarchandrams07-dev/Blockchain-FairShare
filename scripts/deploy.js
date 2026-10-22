import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatically load .env if present
try {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim().replace(/^['"](.*)['"]$/, '$1');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
} catch {}

// Pre-configured EVM Networks
const NETWORKS = {
  'base-sepolia': {
    name: 'Base Sepolia (Testnet)',
    rpc: process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
    chainId: 84532,
    blockExplorer: 'https://sepolia.basescan.org',
  },
  'polygon-amoy': {
    name: 'Polygon Amoy (Testnet)',
    rpc: process.env.POLYGON_AMOY_RPC || 'https://rpc-amoy.polygon.technology',
    chainId: 80002,
    blockExplorer: 'https://amoy.polygonscan.com',
  },
  'sepolia': {
    name: 'Ethereum Sepolia (Testnet)',
    rpc: process.env.SEPOLIA_RPC || 'https://ethereum-sepolia-rpc.publicnode.com',
    chainId: 11155111,
    blockExplorer: 'https://sepolia.etherscan.io',
  },
  'localhost': {
    name: 'Localhost / Anvil',
    rpc: 'http://127.0.0.1:8545',
    chainId: 31337,
    blockExplorer: 'http://localhost',
  },
};

async function main() {
  const args = process.argv.slice(2);
  let networkKey = 'base-sepolia';

  const netArgIdx = args.indexOf('--network');
  if (netArgIdx !== -1 && args[netArgIdx + 1]) {
    networkKey = args[netArgIdx + 1];
  }

  const selectedNetwork = NETWORKS[networkKey];
  if (!selectedNetwork) {
    console.error(`Unknown network "${networkKey}". Available options: ${Object.keys(NETWORKS).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n========================================`);
  console.log(`🚀 FAIRSHARE SMART CONTRACT DEPLOYMENT`);
  console.log(`========================================`);
  console.log(`Target Network : ${selectedNetwork.name}`);
  console.log(`RPC Endpoint   : ${selectedNetwork.rpc}`);
  console.log(`Chain ID       : ${selectedNetwork.chainId}`);

  // Retrieve private key from environment
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.warn(`\n⚠️  No PRIVATE_KEY environment variable provided.`);
    console.log(`\nTo deploy with your testnet wallet:`);
    console.log(`  export PRIVATE_KEY=0x...your_private_key...`);
    console.log(`  npm run deploy:base-sepolia\n`);
    console.log(`Need free Base Sepolia test ETH?`);
    console.log(`  • Coinbase Faucet: https://coinbase.com/faucets/base-ethereum-sepolia-faucet`);
    console.log(`  • QuickNode Faucet: https://faucet.quicknode.com/base/sepolia\n`);
    
    // Create or check template deployments.json
    ensureDeploymentsFile();
    return;
  }

  const provider = new ethers.JsonRpcProvider(selectedNetwork.rpc);
  const wallet = new ethers.Wallet(privateKey, provider);
  const deployerAddress = await wallet.getAddress();
  const balance = await provider.getBalance(deployerAddress);

  console.log(`Deployer Wallet: ${deployerAddress}`);
  console.log(`Wallet Balance : ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) {
    console.error(`❌ Insufficient funds in ${deployerAddress} to pay deployment gas fees.`);
    console.error(`Claim free testnet ETH at: https://coinbase.com/faucets/base-ethereum-sepolia-faucet`);
    process.exit(1);
  }

  // Load compiled artifacts
  const fairShareArtifact = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../src/contracts/FairShare.json'), 'utf8')
  );
  const mockErc20Artifact = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../src/contracts/MockERC20.json'), 'utf8')
  );

  console.log(`Deploying MockERC20 (FSUSD stablecoin)...`);
  const MockTokenFactory = new ethers.ContractFactory(mockErc20Artifact.abi, mockErc20Artifact.bytecode, wallet);
  const mockToken = await MockTokenFactory.deploy();
  await mockToken.waitForDeployment();
  const tokenAddress = await mockToken.getAddress();
  console.log(`✅ MockERC20 deployed at: ${tokenAddress}`);

  console.log(`\nDeploying FairShare Contract...`);
  const FairShareFactory = new ethers.ContractFactory(fairShareArtifact.abi, fairShareArtifact.bytecode, wallet);
  const fairShare = await FairShareFactory.deploy();
  await fairShare.waitForDeployment();
  const fairShareAddress = await fairShare.getAddress();
  console.log(`✅ FairShare deployed at: ${fairShareAddress}`);

  // Save deployment metadata
  const deploymentsPath = path.resolve(__dirname, '../src/contracts/deployments.json');
  const deployments = {
    network: networkKey,
    networkName: selectedNetwork.name,
    chainId: selectedNetwork.chainId,
    deployedAt: new Date().toISOString(),
    deployer: deployerAddress,
    contracts: {
      FairShare: {
        address: fairShareAddress,
        explorerUrl: `${selectedNetwork.blockExplorer}/address/${fairShareAddress}`,
      },
      MockERC20: {
        address: tokenAddress,
        explorerUrl: `${selectedNetwork.blockExplorer}/address/${tokenAddress}`,
      },
    },
  };

  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  console.log(`\nSaved deployment addresses to: ${deploymentsPath}`);
  console.log(`\n🎉 Deployment Complete! You can view contracts on Basescan:`);
  console.log(`• FairShare: ${deployments.contracts.FairShare.explorerUrl}`);
  console.log(`• MockERC20: ${deployments.contracts.MockERC20.explorerUrl}\n`);
}

function ensureDeploymentsFile() {
  const deploymentsPath = path.resolve(__dirname, '../src/contracts/deployments.json');
  if (!fs.existsSync(deploymentsPath)) {
    const template = {
      network: 'base-sepolia',
      networkName: 'Base Sepolia (Testnet)',
      chainId: 84532,
      deployedAt: null,
      contracts: {
        FairShare: {
          address: '0x0000000000000000000000000000000000000000',
          explorerUrl: 'https://sepolia.basescan.org',
        },
        MockERC20: {
          address: '0x0000000000000000000000000000000000000000',
          explorerUrl: 'https://sepolia.basescan.org',
        },
      },
    };
    fs.writeFileSync(deploymentsPath, JSON.stringify(template, null, 2));
    console.log(`Created default deployments template at: ${deploymentsPath}`);
  }
}

main().catch((err) => {
  console.error('Deployment error:', err);
  process.exit(1);
});
