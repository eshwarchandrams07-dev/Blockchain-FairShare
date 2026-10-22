import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
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

const RPC_URL = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
const CHAIN_ID = 84532;
const EXPLORER = 'https://sepolia.basescan.org';

async function runDemo() {
  console.log('\n===============================================================');
  console.log('🌐 BASE SEPOLIA LIVE ON-CHAIN SMART CONTRACT DEMO');
  console.log('===============================================================');

  const deploymentsPath = path.resolve(__dirname, '../src/contracts/deployments.json');
  if (!fs.existsSync(deploymentsPath)) {
    console.error('❌ deployments.json not found. Run "npm run deploy:base-sepolia" first.');
    process.exit(1);
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
  const fairShareAddress = deployments.contracts?.FairShare?.address;
  const mockTokenAddress = deployments.contracts?.MockERC20?.address;

  console.log(`Network          : Base Sepolia (OP Stack Layer 2)`);
  console.log(`Chain ID         : ${CHAIN_ID}`);
  console.log(`RPC Endpoint     : ${RPC_URL}`);
  console.log(`FairShare Address: ${fairShareAddress}`);
  console.log(`MockERC20 Address: ${mockTokenAddress}`);
  console.log(`Contract Explorer: ${EXPLORER}/address/${fairShareAddress}`);
  console.log('---------------------------------------------------------------');

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ No PRIVATE_KEY configured in .env');
    process.exit(1);
  }

  // Load ABI
  const fairShareArtifact = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../src/contracts/FairShare.json'), 'utf8')
  );

  const provider = new ethers.JsonRpcProvider(RPC_URL, { name: 'base-sepolia', chainId: CHAIN_ID }, { staticNetwork: true });
  const wallet = new ethers.Wallet(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`, provider);
  const contract = new ethers.Contract(fairShareAddress, fairShareArtifact.abi, wallet);

  console.log(`Connecting as Deployer Wallet: ${wallet.address}`);
  const balance = await provider.getBalance(wallet.address);
  console.log(`Deployer Gas Balance        : ${ethers.formatEther(balance)} ETH`);

  const currentBlock = await provider.getBlockNumber();
  console.log(`Latest Base Sepolia Block   : #${currentBlock}`);

  const nextGroupId = await contract.nextGroupId();
  console.log(`Next On-Chain Group ID      : ${nextGroupId.toString()}`);
  console.log('---------------------------------------------------------------');

  // Broadcast real on-chain transaction
  console.log('⚡ Sending Transaction to Base Sepolia: createGroup("Hackathon Team", "₹", 1, "FS-2026")...');
  const tx = await contract.createGroup("Hackathon Team", "₹", 1, "FS-2026");
  console.log(`⏳ Transaction Broadcast! Tx Hash: ${tx.hash}`);
  console.log(`🔗 Basescan Link: ${EXPLORER}/tx/${tx.hash}`);

  console.log('Waiting for Layer-2 block confirmation (~2 seconds)...');
  const receipt = await tx.wait(1);
  console.log(`✅ Transaction Confirmed in Block #${receipt.blockNumber}!`);
  console.log(`Gas Used: ${receipt.gasUsed.toString()} units`);
  console.log('===============================================================\n');
}

runDemo().catch(err => {
  console.error('\n❌ Error during Base Sepolia demo:', err.message || err);
  process.exit(1);
});
