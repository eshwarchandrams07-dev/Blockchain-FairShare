/**
 * Comprehensive Automated Test Suite for FairShare IPFS Subsystem
 */
import { computeIpfsCidV1, ipfsService } from '../src/services/ipfsService.js';
import { generateIpfsCid } from '../src/utils/cryptoUtils.js';
import crypto from 'crypto';

console.log('====================================================');
console.log('🌐 FAIRSHARE IPFS INTEGRITY & COMPLIANCE TEST SUITE');
console.log('====================================================\n');

let total = 0;
let passed = 0;

function assert(condition, testName) {
  total++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

// ----------------------------------------------------
// 1. Multicodec / CIDv1 Raw Multihash Structure
// ----------------------------------------------------
console.log('--- 1. IPFS CIDv1 Multicodec Specification ---');

const testPayload = Buffer.from('FairShare Immutable Receipt Test 2026');
const testSha256 = crypto.createHash('sha256').update(testPayload).digest();
const testSha256Hex = '0x' + testSha256.toString('hex');

const cidFromBuffer = computeIpfsCidV1(testSha256);
const cidFromArrayBuffer = computeIpfsCidV1(testSha256.buffer);
const cidFromHex = computeIpfsCidV1(testSha256Hex);

assert(cidFromBuffer.startsWith('bafkrei'), 'CID starts with base32 raw codec prefix "bafkrei"');
assert(cidFromBuffer.length === 59, `CID has exact 59 characters (actual: ${cidFromBuffer.length})`);
assert(cidFromBuffer === cidFromArrayBuffer, 'computeIpfsCidV1 handles ArrayBuffer identically to Buffer');
assert(cidFromBuffer === cidFromHex, 'computeIpfsCidV1 handles 64-char hex digest identically to binary buffer');

// Decode the Base32 CIDv1 to verify internal multicodec structure
const alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
const charMap = {};
for (let i = 0; i < alphabet.length; i++) charMap[alphabet[i]] = i;

function base32ToBytes(str) {
  let bits = 0;
  let value = 0;
  const output = [];
  for (let i = 0; i < str.length; i++) {
    const val = charMap[str[i]];
    if (val === undefined) continue;
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

const decodedBytes = base32ToBytes(cidFromBuffer.slice(1));
assert(decodedBytes.length === 36, 'CID payload contains exactly 36 bytes (4 header + 32 digest)');
assert(decodedBytes[0] === 0x01, 'Byte 0 is CIDv1 version (0x01)');
assert(decodedBytes[1] === 0x55, 'Byte 1 is raw binary multicodec (0x55)');
assert(decodedBytes[2] === 0x12, 'Byte 2 is sha2-256 multihash algorithm (0x12)');
assert(decodedBytes[3] === 0x20, 'Byte 3 is 32-byte digest length (0x20)');
assert(decodedBytes.subarray(4).toString('hex') === testSha256.toString('hex'), 'Multihash payload matches original SHA-256 digest');

// ----------------------------------------------------
// 2. cryptoUtils IPFS Integration
// ----------------------------------------------------
console.log('\n--- 2. Crypto Utilities IPFS Integration ---');

const generatedUri = generateIpfsCid(testSha256Hex);
assert(generatedUri === `ipfs://${cidFromBuffer}`, 'generateIpfsCid returns canonical ipfs:// URI matching CIDv1');

const fallbackUri = generateIpfsCid('');
assert(fallbackUri.startsWith('ipfs://bafkrei'), 'generateIpfsCid handles empty input gracefully');

// ----------------------------------------------------
// 3. Public IPFS Gateway URL Resolution
// ----------------------------------------------------
console.log('\n--- 3. Public Gateway Resolution ---');

const defaultGatewayUrl = ipfsService.getGatewayUrl(cidFromBuffer);
assert(defaultGatewayUrl === `/ipfs/${cidFromBuffer}`, 'Resolves default /ipfs/ gateway URL');

const uriGatewayUrl = ipfsService.getGatewayUrl(`ipfs://${cidFromBuffer}`);
assert(uriGatewayUrl === `/ipfs/${cidFromBuffer}`, 'Strips ipfs:// protocol prefix cleanly');

ipfsService.setGateway('https://cloudflare-ipfs.com/ipfs');
assert(ipfsService.getGateway() === 'https://cloudflare-ipfs.com/ipfs/', 'Appends trailing slash to custom gateway');
assert(ipfsService.getGatewayUrl(cidFromBuffer) === `https://cloudflare-ipfs.com/ipfs/${cidFromBuffer}`, 'Resolves custom cloudflare-ipfs.com URL');

// Reset to default gateway
ipfsService.setGateway('https://ipfs.io/ipfs/');

// ----------------------------------------------------
// 4. In-Memory Local Blob Preview Caching
// ----------------------------------------------------
console.log('\n--- 4. Local Blob Preview Caching ---');

ipfsService.blobCache.set(cidFromBuffer, 'blob:http://localhost:5173/mock-receipt-preview');
assert(ipfsService.getLocalPreviewUrl(cidFromBuffer) === 'blob:http://localhost:5173/mock-receipt-preview', 'Retrieves local preview by raw CID');
assert(ipfsService.getLocalPreviewUrl(`ipfs://${cidFromBuffer}`) === 'blob:http://localhost:5173/mock-receipt-preview', 'Retrieves local preview with ipfs:// prefix');
assert(ipfsService.getLocalPreviewUrl('non-existent-cid') === null, 'Returns null for uncached CIDs');

// ----------------------------------------------------
// 5. Pinata Authentication Handling
// ----------------------------------------------------
console.log('\n--- 5. Pinata Cloud IPFS API Handling ---');

const authEmpty = await ipfsService.testPinataAuth('');
assert(authEmpty.authenticated === false, 'testPinataAuth cleanly rejects empty JWT without throwing');

const authInvalid = await ipfsService.testPinataAuth('invalid-jwt-token-xyz');
assert(authInvalid.authenticated === false, 'testPinataAuth gracefully handles rejected auth');

// ----------------------------------------------------
// 6. Expense & Verifier Match Permutations
// ----------------------------------------------------
console.log('\n--- 6. Receipt Verification Matching ---');

const mockExpense = {
  id: 1,
  title: 'Catering Lunch',
  receiptHash: testSha256Hex,
  ipfsCid: `ipfs://${cidFromBuffer}`,
};

const expenses = [mockExpense];

// Simulate verifier matcher
function matchVerifier(input) {
  const clean = String(input).trim().toLowerCase();
  const cleanNormalizedCid = clean.replace('ipfs://', '');
  return expenses.find(e => {
    const expReceiptHash = String(e.receiptHash || '').toLowerCase();
    const expIpfsCid = String(e.ipfsCid || '').toLowerCase().replace('ipfs://', '');
    return (
      expReceiptHash === clean ||
      expIpfsCid === cleanNormalizedCid ||
      expIpfsCid === clean
    );
  });
}

assert(matchVerifier(testSha256Hex)?.id === 1, 'ReceiptVerifier matches by SHA-256 hex');
assert(matchVerifier(cidFromBuffer)?.id === 1, 'ReceiptVerifier matches by raw CIDv1');
assert(matchVerifier(`ipfs://${cidFromBuffer}`)?.id === 1, 'ReceiptVerifier matches by canonical ipfs:// URI');
assert(!matchVerifier('0xdeadbeef'), 'ReceiptVerifier rejects non-matching hash');

// ----------------------------------------------------
// Summary
// ----------------------------------------------------
console.log('\n====================================================');
console.log(`🎉 IPFS TEST SUMMARY: ${passed} / ${total} tests passed!`);
console.log('====================================================\n');
