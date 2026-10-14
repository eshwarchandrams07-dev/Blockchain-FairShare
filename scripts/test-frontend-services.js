/**
 * Comprehensive System Test for FairShare Frontend Services
 */
import { 
  shortenAddress, 
  formatCents, 
  rupeesToPaise, 
  isValidUpiId, 
  generateUpiUri, 
  generateTxHash, 
  generateIpfsCid, 
  simplifyDebts 
} from '../src/utils/cryptoUtils.js';

import { getEffectiveHost } from '../src/utils/networkUtils.js';

console.log('====================================================');
console.log('🧪 FAIRSHARE COMPREHENSIVE SYSTEM INTEGRITY TEST');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

// ----------------------------------------------------
// 1. Crypto & Currency Utilities Test
// ----------------------------------------------------
console.log('--- 1. Crypto & Currency Utilities ---');

assert(shortenAddress('0x90F79bf6EB2c4f870365E785982E1f101E93b906') === '0x90F7...b906', 'shortenAddress formats 42-char address');
assert(shortenAddress('') === '', 'shortenAddress handles empty string');

assert(formatCents(150000) === '₹1,500.00', 'formatCents formats ₹1,500.00');
assert(formatCents(1050) === '₹10.50', 'formatCents formats ₹10.50');
assert(formatCents(0) === '₹0.00', 'formatCents formats ₹0.00');
assert(formatCents(-50000) === '-₹500.00', 'formatCents formats negative balance');

assert(rupeesToPaise('1500.00') === 150000, 'rupeesToPaise parses 1500.00 to 150000 paise');
assert(rupeesToPaise('10.50') === 1050, 'rupeesToPaise parses 10.50 to 1050 paise');

assert(isValidUpiId('eshwar@okhdfcbank') === true, 'isValidUpiId accepts eshwar@okhdfcbank');
assert(isValidUpiId('priya.sharma@paytm') === true, 'isValidUpiId accepts priya.sharma@paytm');
assert(isValidUpiId('invalid-upi') === false, 'isValidUpiId rejects address without @');
assert(isValidUpiId('') === false, 'isValidUpiId rejects empty string');

const upiUri = generateUpiUri({
  upiId: 'eshwar@okhdfcbank',
  payeeName: 'Eshwar',
  amountInRupees: '1200.50',
  note: 'Apt 402 Broadband',
});
assert(upiUri.includes('pa=eshwar@okhdfcbank'), 'generateUpiUri contains payee VPA');
assert(upiUri.includes('am=1200.50'), 'generateUpiUri contains formatted amount');
assert(upiUri.includes('cu=INR'), 'generateUpiUri specifies INR currency');

const txHash = generateTxHash();
assert(txHash.startsWith('0x') && txHash.length === 66, 'generateTxHash generates 32-byte hex string');

const cid = generateIpfsCid(txHash);
assert(cid.startsWith('ipfs://bafkrei'), 'generateIpfsCid generates CIDv1 URL');

// ----------------------------------------------------
// 2. Debt Simplification Algorithm Test
// ----------------------------------------------------
console.log('\n--- 2. Debt Simplification (Min-Cash-Flow) ---');

// Test 3-way circular debt:
// Alice paid ₹300 for Bob & Charlie (Alice +₹200, Bob -₹100, Charlie -₹100)
// Bob paid ₹150 for Charlie (Bob +₹150 - ₹100 = +₹50, Charlie -₹100 - ₹150 = -₹250)
const sampleMembers = [
  { address: '0x1', name: 'Alice', netBalance: 20000 },   // +₹200.00
  { address: '0x2', name: 'Bob', netBalance: 5000 },      // +₹50.00
  { address: '0x3', name: 'Charlie', netBalance: -25000 }, // -₹250.00
];

const simplified = simplifyDebts(sampleMembers);
assert(simplified.length === 2, 'simplifyDebts reduces 3-way circular debt to 2 minimal transactions');
const totalSettled = simplified.reduce((sum, tx) => sum + tx.amount, 0);
assert(totalSettled === 25000, 'Sum of simplified debts matches net creditor total (₹250.00)');
assert(simplified[0].from === '0x3' && simplified[0].to === '0x1' && simplified[0].amount === 20000, 'Charlie pays Alice ₹200.00');
assert(simplified[1].from === '0x3' && simplified[1].to === '0x2' && simplified[1].amount === 5000, 'Charlie pays Bob ₹50.00');

// ----------------------------------------------------
// 3. Network Utils Test
// ----------------------------------------------------
console.log('\n--- 3. Network Host Resolution ---');

const defaultHost = getEffectiveHost();
assert(typeof defaultHost === 'string' && defaultHost.length > 0, 'getEffectiveHost returns valid string');
const customHost = getEffectiveHost('192.168.1.42');
assert(customHost.includes('192.168.1.42'), 'getEffectiveHost respects custom LAN IP');

// ----------------------------------------------------
// Summary
// ----------------------------------------------------
console.log('\n====================================================');
console.log(`🎉 TEST SUMMARY: ${passedTests} / ${totalTests} assertions passed!`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
