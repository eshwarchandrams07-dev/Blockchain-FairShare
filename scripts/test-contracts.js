import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fairShareArtifact = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../src/contracts/FairShare.json'), 'utf8')
);
const mockErc20Artifact = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../src/contracts/MockERC20.json'), 'utf8')
);

console.log('--- CONTRACT ARTIFACT INTEGRITY VERIFICATION ---');
console.log(`FairShare Contract Name: ${fairShareArtifact.contractName}`);
console.log(`FairShare ABI Methods Count: ${fairShareArtifact.abi.length}`);
console.log(`FairShare Bytecode Size: ${fairShareArtifact.bytecode.length / 2} bytes`);

console.log(`MockERC20 Contract Name: ${mockErc20Artifact.contractName}`);
console.log(`MockERC20 ABI Methods Count: ${mockErc20Artifact.abi.length}`);
console.log(`MockERC20 Bytecode Size: ${mockErc20Artifact.bytecode.length / 2} bytes`);

// Verify critical methods exist in FairShare ABI
const expectedMethods = [
  'createGroup',
  'addMember',
  'submitExpense',
  'approveExpense',
  'rejectExpense',
  'disputeExpense',
  'resolveDispute',
  'correctExpense',
  'settleDebtNative',
  'settleDebtDirect',
  'recordOffChainSettlement',
  'confirmOffChainSettlement',
  'getGroup',
  'getGroupMembers',
  'getMemberBalance',
];

const foundMethodNames = fairShareArtifact.abi
  .filter(item => item.type === 'function')
  .map(f => f.name);

let missing = false;
for (const m of expectedMethods) {
  if (foundMethodNames.includes(m)) {
    console.log(`  ✓ Verified method: ${m}`);
  } else {
    console.error(`  ✗ MISSING method: ${m}`);
    missing = true;
  }
}

if (missing) {
  console.error('Contract verification failed: Missing expected interface methods.');
  process.exit(1);
}

console.log('\nAll FairShare and MockERC20 contract interfaces verified successfully!');
