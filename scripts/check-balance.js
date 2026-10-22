import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env if present
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

const NETWORKS = [
  { name: 'Base Sepolia', chainId: 84532, rpc: process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org', explorer: 'https://sepolia.basescan.org/address' },
  { name: 'Polygon Amoy', chainId: 80002, rpc: process.env.POLYGON_AMOY_RPC || 'https://rpc-amoy.polygon.technology', explorer: 'https://amoy.polygonscan.com/address' },
  { name: 'Ethereum Sepolia', chainId: 11155111, rpc: process.env.SEPOLIA_RPC || 'https://ethereum-sepolia-rpc.publicnode.com', explorer: 'https://sepolia.etherscan.io/address' },
];

function deriveWalletFromEmail(email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const seed = ethers.id(`fairshare_auth_v1:${cleanEmail}`);
  const wallet = new ethers.Wallet(seed);
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

async function checkBalance() {
  const arg = process.argv[2]?.trim();
  let targetAddress = null;
  let source = '';

  if (arg) {
    if (arg.startsWith('0x') && arg.length === 42) {
      targetAddress = arg;
      source = 'Provided EVM address argument';
    } else if (arg.includes('@')) {
      const derived = deriveWalletFromEmail(arg);
      targetAddress = derived.address;
      source = `Derived from email: "${arg}"`;
    } else if (arg.length === 64 || (arg.startsWith('0x') && arg.length === 66)) {
      try {
        const wallet = new ethers.Wallet(arg.startsWith('0x') ? arg : `0x${arg}`);
        targetAddress = wallet.address;
        source = 'Provided Private Key';
      } catch {
        console.error('Invalid private key format.');
        process.exit(1);
      }
    } else {
      console.error(`Invalid argument: "${arg}". Pass an Ethereum address (0x...), email, or private key.`);
      process.exit(1);
    }
  } else if (process.env.PRIVATE_KEY) {
    try {
      const pk = process.env.PRIVATE_KEY.startsWith('0x') ? process.env.PRIVATE_KEY : `0x${process.env.PRIVATE_KEY}`;
      const wallet = new ethers.Wallet(pk);
      targetAddress = wallet.address;
      source = 'Deployer Private Key (.env)';
    } catch {
      console.warn('Could not parse PRIVATE_KEY from .env');
    }
  }

  // Check in-app local database balance if available
  let inAppInfo = null;
  try {
    const dbPath = path.resolve(__dirname, '../data/fairshare_ledger_db.json');
    if (fs.existsSync(dbPath)) {
      const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      const allMembers = (db.groups || []).flatMap(g => g.members || []);
      if (arg && arg.includes('@')) {
        inAppInfo = allMembers.find(m => m.email?.toLowerCase() === arg.toLowerCase());
        if (inAppInfo && inAppInfo.address) {
          targetAddress = inAppInfo.address;
          source = `Verified Google user from local DB: "${arg}"`;
        }
      } else if (targetAddress) {
        inAppInfo = allMembers.find(m => m.address?.toLowerCase() === targetAddress.toLowerCase());
      }
      if (!targetAddress && allMembers.length > 0) {
        inAppInfo = allMembers[0];
        targetAddress = inAppInfo.address;
        source = `First user from local DB (${inAppInfo.name || inAppInfo.email})`;
      }
    }
  } catch {}

  if (!targetAddress) {
    console.log('\nUsage:');
    console.log('  npm run balance                         (Uses PRIVATE_KEY from .env or active user)');
    console.log('  npm run balance -- <0xAddress>          (Checks balance for specific address)');
    console.log('  npm run balance -- <user@gmail.com>     (Derives and checks wallet for Google email)\n');
    process.exit(1);
  }

  console.log('\n======================================================');
  console.log('💰 FAIRSHARE WALLET BALANCE CHECKER');
  console.log('======================================================');
  console.log(`Target Address : ${targetAddress}`);
  console.log(`Source         : ${source}`);

  if (inAppInfo) {
    const tokens = inAppInfo.tokenBalance !== undefined ? inAppInfo.tokenBalance : 75000;
    console.log(`In-App FSINR   : ₹${(tokens / 100).toFixed(2)} (${tokens} units)`);
    if (inAppInfo.name) console.log(`In-App User    : ${inAppInfo.name} (${inAppInfo.email || 'No email'})`);
  }
  console.log('------------------------------------------------------');

  console.log('Checking On-Chain Balances:');
  for (const net of NETWORKS) {
    try {
      const res = await fetch(net.rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBalance',
          params: [targetAddress, 'latest'],
        }),
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.result) {
          const ethBal = ethers.formatEther(BigInt(data.result));
          console.log(`  • ${net.name.padEnd(18)}: ${ethBal} ETH`);
          continue;
        }
      }
      console.log(`  • ${net.name.padEnd(18)}: Could not fetch balance`);
    } catch (err) {
      console.log(`  • ${net.name.padEnd(18)}: Offline / unreachable (${err.message})`);
    }
  }
  console.log('======================================================\n');
}

checkBalance().catch(err => {
  console.error('Error checking balance:', err.message);
  process.exit(1);
});
