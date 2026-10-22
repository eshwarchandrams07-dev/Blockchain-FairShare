import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'fairshare_ledger_db.json');
const RECEIPTS_DIR = path.join(DATA_DIR, 'receipts');

const CLEAN_STATE = {
  groups: [
    {
      id: 1,
      name: "Public Ledger",
      isPrivate: false,
      ledgerId: "PUB-101",
      password: "",
      inviteCode: "PUBLIC",
      currency: "₹",
      description: "Decentralized public expense ledger. Open for community expense sharing and multi-device settlement.",
      creator: "0x0000000000000000000000000000000000000000",
      createdAt: Date.now(),
      members: [],
      approvalPolicy: 1
    }
  ],
  expenses: [],
  settlements: [],
  auditLogs: []
};

// 1. Reset Database JSON
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
fs.writeFileSync(DB_FILE, JSON.stringify(CLEAN_STATE, null, 2), 'utf8');
console.log('✅ Reset data/fairshare_ledger_db.json to clean Public Ledger.');

// 2. Wipe Receipts
if (fs.existsSync(RECEIPTS_DIR)) {
  const files = fs.readdirSync(RECEIPTS_DIR);
  for (const f of files) {
    fs.unlinkSync(path.join(RECEIPTS_DIR, f));
  }
  console.log(`✅ Cleared ${files.length} receipts from data/receipts/.`);
}

console.log('\n🎉 All test data has been completely wiped!');
console.log('If your dev server is currently running, restart it (Ctrl+C, then npm run dev) to load the clean database.');
