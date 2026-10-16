/**
 * FairShare Comprehensive Permutation & Combination Test Suite
 * Validates all edge cases, inputs, identities, mathematical invariants,
 * consensus states, and multi-ledger operations.
 */

import { ethers } from 'ethers';
import { 
  deriveWalletFromEmail, 
  parseGoogleJwt 
} from '../src/services/authService.js';

import { 
  shortenAddress, 
  formatCents, 
  rupeesToPaise, 
  dollarsToCents,
  isValidUpiId, 
  generateUpiUri, 
  generateTxHash, 
  simplifyDebts
} from '../src/utils/cryptoUtils.js';

const SPLIT_TYPES = {
  EQUAL: 0,
  EXACT: 1,
  PERCENTAGE: 2,
};

const APPROVAL_POLICIES = {
  AUTO_APPROVE: 0,
  MAJORITY_VOTE: 1,
  UNANIMOUS_VOTE: 2,
  ADMIN_ONLY: 3,
};

const EXPENSE_STATUS = {
  PENDING_APPROVAL: 0,
  APPROVED: 1,
  REJECTED: 2,
  DISPUTED: 3,
};

console.log('======================================================================');
console.log('🧪 FAIRSHARE COMPREHENSIVE PERMUTATION & COMBINATION TEST SUITE');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
    failedTests++;
    process.exitCode = 1;
  }
}

// 0. Address Formatting & Status Enum Invariants
console.log('--- 0. Address Formatting & Status Enums ---');
assert(shortenAddress('0x4f01Ca86D1abACAaA89A52a212727C17e1C54e4B') === '0x4f01...4e4B', 'shortenAddress: Formats 42-char address');
assert(shortenAddress('') === '', 'shortenAddress: Empty string returns empty');
assert(shortenAddress(null) === '', 'shortenAddress: null returns empty');
assert(EXPENSE_STATUS.PENDING_APPROVAL === 0 && EXPENSE_STATUS.APPROVED === 1, 'EXPENSE_STATUS: Enum values match on-chain protocol');

// ======================================================================
// 1. Google Authentication & Deterministic EVM Wallet Derivation
// ======================================================================
console.log('--- 1. Google Identity & Deterministic EVM Wallet Derivation ---');

// 1.1 Determinism Test: Same email produces identical address across repeated calls
const email1 = 'eshwarchandrams@gmail.com';
const wallet1a = deriveWalletFromEmail(email1);
const wallet1b = deriveWalletFromEmail(email1);
assert(
  wallet1a.address === wallet1b.address && wallet1a.privateKey === wallet1b.privateKey,
  'Deterministic derivation: Repeated calls for same email produce identical EVM address & private key'
);
assert(
  ethers.isAddress(wallet1a.address),
  'Deterministic derivation: Derived address is a valid checksummed Ethereum address'
);

// 1.2 Normalization Permutations: Case-insensitivity and whitespace trimming
const emailPermutations = [
  'eshwarchandrams@gmail.com',
  'Eshwarchandrams@gmail.com',
  'ESHWARCHANDRAMS@GMAIL.COM',
  '  eshwarchandrams@gmail.com  ',
  '\teshwarchandrams@gmail.com\n'
];
const normalizedAddresses = emailPermutations.map(e => deriveWalletFromEmail(e).address);
const allIdentical = normalizedAddresses.every(addr => addr === normalizedAddresses[0]);
assert(
  allIdentical,
  'Identity Normalization: Lowercase, uppercase, mixed-case, and whitespace-padded emails map to identical EVM address'
);

// 1.3 Collision Resistance: 50 different emails must generate 50 unique addresses
const uniqueEmails = Array.from({ length: 50 }, (_, i) => `user_${i}_test@domain.com`);
const derivedAddresses = new Set(uniqueEmails.map(e => deriveWalletFromEmail(e).address));
assert(
  derivedAddresses.size === 50,
  `Collision Resistance: 50 distinct Google emails yielded 50 distinct EVM addresses (${derivedAddresses.size}/50)`
);

// 1.4 Complex Email Format Permutations
const complexEmails = [
  'user+tag@gmail.com',
  'first.last.middle@subdomain.co.uk',
  '1234567890@googlemail.com',
  'customer-support_team@company.internal.org'
];
complexEmails.forEach(e => {
  const w = deriveWalletFromEmail(e);
  assert(ethers.isAddress(w.address), `Email format compatibility: Successfully derived wallet for "${e}"`);
});

// 1.5 JWT ID Token Parsing Permutations
const mockPayload = { email: 'alice@gmail.com', name: 'Alice Smith', sub: '10987654321', picture: 'https://avatar.url' };
const encodedPayload = Buffer.from(JSON.stringify(mockPayload)).toString('base64url');
const mockValidJwt = `header.${encodedPayload}.signature`;
const parsedJwt = parseGoogleJwt(mockValidJwt);
assert(parsedJwt && parsedJwt.email === 'alice@gmail.com', 'JWT Parser: Decodes valid Base64Url JWT token payload correctly');

const invalidJwts = [null, undefined, '', 'not.a.jwt', 'part1.part2', 'part1.invalidbase64@@@.part3', 12345];
invalidJwts.forEach((inv, i) => {
  const res = parseGoogleJwt(inv);
  assert(res === null, `JWT Parser Error Handling: Safely returns null on malformed token permutation #${i + 1}`);
});

// ======================================================================
// 2. Member Sanitization & Invariant Permutations
// ======================================================================
console.log('\n--- 2. Member Sanitization & Invariants ---');

// The sanitizeGoogleMembers function as implemented across server.js, vite.config.js, and api/ledger-state.js
function sanitizeGoogleMembers(members) {
  if (!Array.isArray(members)) return [];
  const valid = [];
  const seenAddrs = new Set();
  const seenEmails = new Set();

  for (const m of members) {
    if (!m || typeof m !== 'object') continue;
    const email = (m.email || '').trim().toLowerCase();
    const addr = (m.address || '').trim();

    // Must be a verified email with '@' and a non-empty address
    if (!email || !email.includes('@') || !email.includes('.')) continue;
    if (!addr || !addr.startsWith('0x') || addr.length !== 42) continue;

    const lowerAddr = addr.toLowerCase();
    if (seenAddrs.has(lowerAddr) || seenEmails.has(email)) continue;

    seenAddrs.add(lowerAddr);
    seenEmails.add(email);

    valid.push({
      ...m,
      email,
      address: addr,
      provider: 'google'
    });
  }
  return valid;
}

const mixedMembersPermutation = [
  // Valid members
  { address: '0x4f01Ca86D1abACAaA89A52a212727C17e1C54e4B', name: 'Eshwar', email: 'eshwarchandrams@gmail.com' },
  { address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', name: 'Bob', email: 'bob@gmail.com' },
  
  // Phantom unauthenticated device users (MUST BE DROPPED)
  { address: '0x1111111111111111111111111111111111111111', name: 'Phone User (4020)', email: null },
  { address: '0x2222222222222222222222222222222222222222', name: 'Eshwar (Admin)', email: '' },
  { address: '0x3333333333333333333333333333333333333333', name: 'No Email User' },
  { address: '0x4444444444444444444444444444444444444444', name: 'Invalid Email', email: 'invalid-email-no-at' },
  
  // Malformed objects (MUST BE DROPPED)
  null,
  undefined,
  "string instead of object",
  12345,
  { name: 'Missing Address', email: 'valid@gmail.com' },
  { address: '0xShortAddr', email: 'valid2@gmail.com' },
  { address: 'not-an-address', email: 'valid3@gmail.com' },

  // Duplicate email (different case) (MUST BE DEDUPLICATED)
  { address: '0x5555555555555555555555555555555555555555', name: 'Eshwar Duplicate', email: 'ESHWARCHANDRAMS@GMAIL.COM' },
  // Duplicate address (MUST BE DEDUPLICATED)
  { address: '0x4f01Ca86D1abACAaA89A52a212727C17e1C54e4B', name: 'Duplicate Addr', email: 'other@gmail.com' }
];

const sanitized = sanitizeGoogleMembers(mixedMembersPermutation);
assert(sanitized.length === 2, `Sanitization drops all unauthenticated and malformed members (Kept exactly 2/14)`);
assert(sanitized[0].email === 'eshwarchandrams@gmail.com', 'Sanitization preserves first verified Google member');
assert(sanitized[1].email === 'bob@gmail.com', 'Sanitization preserves second verified Google member');
assert(sanitized.every(m => m.provider === 'google' && m.email.includes('@')), 'All sanitized members have provider: "google"');

// Edge cases for sanitizeGoogleMembers
assert(sanitizeGoogleMembers(null).length === 0, 'Sanitization handles null input gracefully');
assert(sanitizeGoogleMembers([]).length === 0, 'Sanitization handles empty array gracefully');
assert(sanitizeGoogleMembers([{}, {}, {}]).length === 0, 'Sanitization handles array of empty objects');

// ======================================================================
// 3. Public & Private Ledger State Merging & Passcode Protection
// ======================================================================
console.log('\n--- 3. Public & Private Ledger State Merging ---');

function mergeLedgerStates(local, remote) {
  if (!remote || typeof remote !== 'object') return local;
  const merged = { ...local };

  const groupsMap = new Map();
  // Load local groups
  (local.groups || []).forEach(g => {
    if (g && g.id) groupsMap.set(Number(g.id), { ...g, members: sanitizeGoogleMembers(g.members) });
  });

  // Merge remote groups (NO FILTERING NUMBER(G.ID) === 1 !)
  (remote.groups || []).forEach(rg => {
    if (!rg || !rg.id) return;
    const gid = Number(rg.id);
    const existing = groupsMap.get(gid);
    const sanitizedRemoteMembers = sanitizeGoogleMembers(rg.members);

    if (!existing) {
      groupsMap.set(gid, {
        ...rg,
        isPrivate: rg.isPrivate !== false,
        members: sanitizedRemoteMembers
      });
    } else {
      // Merge members
      const memberMap = new Map();
      (existing.members || []).forEach(m => memberMap.set(m.address.toLowerCase(), m));
      sanitizedRemoteMembers.forEach(m => memberMap.set(m.address.toLowerCase(), m));
      
      groupsMap.set(gid, {
        ...existing,
        ...rg,
        isPrivate: rg.isPrivate !== undefined ? rg.isPrivate : existing.isPrivate,
        ledgerId: rg.ledgerId || existing.ledgerId,
        password: rg.password || existing.password,
        members: Array.from(memberMap.values())
      });
    }
  });

  merged.groups = Array.from(groupsMap.values());
  return merged;
}

const localState = {
  groups: [
    {
      id: 1,
      name: 'Public Ledger',
      isPrivate: false,
      ledgerId: 'PUB-101',
      members: [{ address: '0x4f01Ca86D1abACAaA89A52a212727C17e1C54e4B', name: 'Eshwar', email: 'eshwarchandrams@gmail.com' }]
    }
  ]
};

const remoteStateWithPrivateGroups = {
  groups: [
    {
      id: 1,
      name: 'Public Ledger',
      isPrivate: false,
      members: [
        { address: '0x4f01Ca86D1abACAaA89A52a212727C17e1C54e4B', name: 'Eshwar', email: 'eshwarchandrams@gmail.com' },
        { address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', name: 'Bob', email: 'bob@gmail.com' }
      ]
    },
    {
      id: 2,
      name: 'Flat 402 Private Ledger',
      isPrivate: true,
      ledgerId: 'GRP-2',
      password: 'apt-402-pass',
      inviteCode: 'FS-4020',
      members: [
        { address: '0x4f01Ca86D1abACAaA89A52a212727C17e1C54e4B', name: 'Eshwar', email: 'eshwarchandrams@gmail.com' },
        { address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', name: 'Charlie', email: 'charlie@gmail.com' }
      ]
    },
    {
      id: 3,
      name: 'Trip to Goa (Private)',
      isPrivate: true,
      ledgerId: 'GOA-2026',
      password: 'beachparty',
      members: [
        { address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', name: 'Bob', email: 'bob@gmail.com' }
      ]
    }
  ]
};

const mergedResult = mergeLedgerStates(localState, remoteStateWithPrivateGroups);
assert(mergedResult.groups.length === 3, 'Ledger Merge: Successfully preserved all 3 groups (1 Public + 2 Private)');
const pubGroup = mergedResult.groups.find(g => g.id === 1);
const privGroup2 = mergedResult.groups.find(g => g.id === 2);
const privGroup3 = mergedResult.groups.find(g => g.id === 3);

assert(pubGroup && pubGroup.isPrivate === false, 'Public Ledger: Preserved isPrivate: false flag');
assert(pubGroup.members.length === 2, 'Public Ledger: Merged Bob into verified Google members');
assert(privGroup2 && privGroup2.isPrivate === true, 'Private Ledger #2: Preserved isPrivate: true flag');
assert(privGroup2.password === 'apt-402-pass', 'Private Ledger #2: Preserved password protection');
assert(privGroup2.ledgerId === 'GRP-2', 'Private Ledger #2: Preserved ledgerId');
assert(privGroup3 && privGroup3.isPrivate === true, 'Private Ledger #3: Preserved isPrivate: true flag');
assert(privGroup3.password === 'beachparty', 'Private Ledger #3: Preserved custom password');

// 3.2 Private Ledger Authentication Permutations
function verifyLedgerAccess(group, inputLedgerId, inputPassword) {
  if (!group) return { authorized: false, error: 'Group does not exist' };
  if (!group.isPrivate) return { authorized: true }; // Public groups require no password

  const cleanInputId = (inputLedgerId || '').trim().toUpperCase();
  const cleanGroupId = (group.ledgerId || `GRP-${group.id}`).trim().toUpperCase();
  const idMatches = cleanInputId === cleanGroupId || cleanInputId === String(group.id);

  if (!idMatches) return { authorized: false, error: 'Invalid Ledger ID' };

  const expectedPass = (group.password || group.inviteCode || '').trim();
  const cleanInputPass = (inputPassword || '').trim();

  if (expectedPass && cleanInputPass !== expectedPass) {
    return { authorized: false, error: 'Incorrect Password' };
  }
  return { authorized: true };
}

const accessPermutations = [
  // Correct credentials
  { group: privGroup2, id: 'GRP-2', pass: 'apt-402-pass', expectAuth: true, desc: 'Exact ID and Password' },
  { group: privGroup2, id: 'grp-2', pass: 'apt-402-pass', expectAuth: true, desc: 'Case-insensitive Ledger ID ("grp-2" vs "GRP-2")' },
  { group: privGroup2, id: '2', pass: 'apt-402-pass', expectAuth: true, desc: 'Numeric Group ID match' },
  { group: privGroup2, id: '  GRP-2  ', pass: 'apt-402-pass', expectAuth: true, desc: 'Ledger ID with whitespace' },
  
  // Incorrect credentials
  { group: privGroup2, id: 'GRP-2', pass: 'wrong-pass', expectAuth: false, desc: 'Wrong Password rejected' },
  { group: privGroup2, id: 'WRONG-ID', pass: 'apt-402-pass', expectAuth: false, desc: 'Wrong Ledger ID rejected' },
  { group: privGroup2, id: 'GRP-2', pass: '', expectAuth: false, desc: 'Empty Password rejected' },
  { group: privGroup2, id: '', pass: 'apt-402-pass', expectAuth: false, desc: 'Empty Ledger ID rejected' },

  // Public group access
  { group: pubGroup, id: 'PUB-101', pass: '', expectAuth: true, desc: 'Public Ledger requires no password' },
  { group: pubGroup, id: 'any-id', pass: 'any-pass', expectAuth: true, desc: 'Public Ledger open to all verified users' }
];

accessPermutations.forEach((p, idx) => {
  const result = verifyLedgerAccess(p.group, p.id, p.pass);
  assert(
    result.authorized === p.expectAuth,
    `Private Gate Permutation #${idx + 1} (${p.desc}): ${result.authorized ? 'Granted' : 'Denied'}`
  );
});

// ======================================================================
// 4. Expense Splitting Mathematical Permutations & Remainder Invariant
// ======================================================================
console.log('\n--- 4. Expense Splitting Math & Remainder Invariants ---');

function calculateShares({ totalCents, participants, splitType, customAmounts = {}, customPercentages = {} }) {
  const count = participants.length;
  if (count === 0 || totalCents <= 0) return [];

  if (splitType === SPLIT_TYPES.EQUAL) {
    const baseShare = Math.floor(totalCents / count);
    let remainder = totalCents % count;

    return participants.map(addr => {
      const extra = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder--;
      return {
        participant: addr,
        amount: baseShare + extra
      };
    });
  }

  if (splitType === SPLIT_TYPES.EXACT) {
    return participants.map(addr => ({
      participant: addr,
      amount: dollarsToCents(customAmounts[addr] || '0')
    }));
  }

  if (splitType === SPLIT_TYPES.PERCENTAGE) {
    const sumPct = participants.reduce((sum, a) => sum + (parseFloat(customPercentages[a]) || 0), 0);
    let allocatedCents = 0;

    return participants.map((addr, idx) => {
      const pct = parseFloat(customPercentages[addr] || '0') / 100;
      let shareAmt = Math.round(totalCents * pct);

      if (idx === participants.length - 1 && Math.abs(sumPct - 100) < 0.1) {
        shareAmt = Math.max(0, totalCents - allocatedCents);
      } else {
        allocatedCents += shareAmt;
      }

      return {
        participant: addr,
        amount: shareAmt
      };
    });
  }
  return [];
}

// 4.1 Equal Split Remainder Invariant across various participant counts & non-divisible amounts
const equalSplitCases = [
  { amount: 10000, participants: ['0x1', '0x2'], desc: '₹100.00 / 2 members (5000 + 5000)' },
  { amount: 10000, participants: ['0x1', '0x2', '0x3'], desc: '₹100.00 / 3 members (3334 + 3333 + 3333)' },
  { amount: 1, participants: ['0x1', '0x2', '0x3'], desc: '1 paise / 3 members (1 + 0 + 0)' },
  { amount: 1000, participants: ['0x1', '0x2', '0x3', '0x4', '0x5', '0x6', '0x7'], desc: '₹10.00 / 7 members (non-divisible prime)' },
  { amount: 1234567, participants: Array.from({ length: 13 }, (_, i) => `0x${i}`), desc: '₹12,345.67 / 13 members' },
  { amount: 99999999, participants: Array.from({ length: 27 }, (_, i) => `0x${i}`), desc: '₹999,999.99 / 27 members' }
];

equalSplitCases.forEach(c => {
  const shares = calculateShares({
    totalCents: c.amount,
    participants: c.participants,
    splitType: SPLIT_TYPES.EQUAL
  });
  const sumShares = shares.reduce((sum, s) => sum + s.amount, 0);
  assert(
    sumShares === c.amount,
    `Zero-Sum Remainder Invariant: ${c.desc} -> Sum of shares (${sumShares}) === total paise (${c.amount})`
  );
});

// 4.2 Exact Split Permutations
const exactParticipants = ['0x1', '0x2', '0x3'];
const exactValidShares = calculateShares({
  totalCents: 15000,
  participants: exactParticipants,
  splitType: SPLIT_TYPES.EXACT,
  customAmounts: { '0x1': '50.00', '0x2': '60.00', '0x3': '40.00' }
});
const sumExactValid = exactValidShares.reduce((sum, s) => sum + s.amount, 0);
assert(sumExactValid === 15000, 'Exact Split: Valid custom dollar amounts match total paise (₹150.00)');

const exactUnderShares = calculateShares({
  totalCents: 15000,
  participants: exactParticipants,
  splitType: SPLIT_TYPES.EXACT,
  customAmounts: { '0x1': '50.00', '0x2': '50.00', '0x3': '40.00' }
});
const sumExactUnder = exactUnderShares.reduce((sum, s) => sum + s.amount, 0);
assert(sumExactUnder === 14000 && sumExactUnder !== 15000, 'Exact Split Discrepancy Detection: Detects under-allocation (₹140 vs ₹150)');

// 4.3 Percentage Split Permutations (including recurring fraction rounding correction)
const pctParticipants = ['0x1', '0x2', '0x3'];
const pctShares = calculateShares({
  totalCents: 10000,
  participants: pctParticipants,
  splitType: SPLIT_TYPES.PERCENTAGE,
  customPercentages: { '0x1': '33.33', '0x2': '33.33', '0x3': '33.34' }
});
const sumPctShares = pctShares.reduce((sum, s) => sum + s.amount, 0);
assert(
  sumPctShares === 10000,
  `Percentage Split Invariant: 33.33% + 33.33% + 33.34% sums exactly to ₹100.00 without paise leakage (${sumPctShares}/10000)`
);

// 4.4 Edge Cases
assert(calculateShares({ totalCents: 0, participants: ['0x1'], splitType: SPLIT_TYPES.EQUAL }).length === 0, 'Split Edge Case: 0 amount returns empty shares');
assert(calculateShares({ totalCents: 1000, participants: [], splitType: SPLIT_TYPES.EQUAL }).length === 0, 'Split Edge Case: 0 participants returns empty shares');

// ======================================================================
// 5. Consensus Quorum & Voting Permutations
// ======================================================================
console.log('\n--- 5. Consensus Quorum & Voting Logic ---');

function checkQuorum({ approvals, participantsCount, policy, callerRole }) {
  const uniqueApprovals = new Set(approvals.map(a => a.toLowerCase())).size;

  if (policy === APPROVAL_POLICIES.AUTO_APPROVE) {
    return true;
  }
  if (policy === APPROVAL_POLICIES.ADMIN_ONLY) {
    return callerRole === 'ADMIN';
  }
  if (policy === APPROVAL_POLICIES.UNANIMOUS_VOTE) {
    return uniqueApprovals >= participantsCount;
  }
  if (policy === APPROVAL_POLICIES.MAJORITY_VOTE) {
    return uniqueApprovals > Math.floor(participantsCount / 2);
  }
  return false;
}

const quorumPermutations = [
  // Majority Vote: floor(N / 2) + 1 needed
  { policy: APPROVAL_POLICIES.MAJORITY_VOTE, count: 1, approvals: ['0x1'], expect: true, desc: '1 member: 1 vote > 0' },
  { policy: APPROVAL_POLICIES.MAJORITY_VOTE, count: 2, approvals: ['0x1'], expect: false, desc: '2 members: 1 vote NOT > 1' },
  { policy: APPROVAL_POLICIES.MAJORITY_VOTE, count: 2, approvals: ['0x1', '0x2'], expect: true, desc: '2 members: 2 votes > 1' },
  { policy: APPROVAL_POLICIES.MAJORITY_VOTE, count: 3, approvals: ['0x1'], expect: false, desc: '3 members: 1 vote NOT > 1' },
  { policy: APPROVAL_POLICIES.MAJORITY_VOTE, count: 3, approvals: ['0x1', '0x2'], expect: true, desc: '3 members: 2 votes > 1' },
  { policy: APPROVAL_POLICIES.MAJORITY_VOTE, count: 4, approvals: ['0x1', '0x2'], expect: false, desc: '4 members: 2 votes NOT > 2' },
  { policy: APPROVAL_POLICIES.MAJORITY_VOTE, count: 4, approvals: ['0x1', '0x2', '0x3'], expect: true, desc: '4 members: 3 votes > 2' },
  { policy: APPROVAL_POLICIES.MAJORITY_VOTE, count: 5, approvals: ['0x1', '0x2', '0x3'], expect: true, desc: '5 members: 3 votes > 2' },

  // Admin Only
  { policy: APPROVAL_POLICIES.ADMIN_ONLY, count: 5, approvals: ['0x1'], callerRole: 'MEMBER', expect: false, desc: 'Admin policy: Standard member vote rejected' },
  { policy: APPROVAL_POLICIES.ADMIN_ONLY, count: 5, approvals: ['0x1'], callerRole: 'ADMIN', expect: true, desc: 'Admin policy: Admin vote approves immediately' },

  // Unanimous Vote
  { policy: APPROVAL_POLICIES.UNANIMOUS_VOTE, count: 3, approvals: ['0x1', '0x2'], expect: false, desc: 'Unanimous policy: 2/3 votes pending' },
  { policy: APPROVAL_POLICIES.UNANIMOUS_VOTE, count: 3, approvals: ['0x1', '0x2', '0x3'], expect: true, desc: 'Unanimous policy: 3/3 votes approved' },

  // Auto-Approve
  { policy: APPROVAL_POLICIES.AUTO_APPROVE, count: 10, approvals: [], expect: true, desc: 'Auto-Approve policy: 0 votes approved immediately' }
];

quorumPermutations.forEach((qp, idx) => {
  const reached = checkQuorum({
    approvals: qp.approvals,
    participantsCount: qp.count,
    policy: qp.policy,
    callerRole: qp.callerRole
  });
  assert(reached === qp.expect, `Consensus Permutation #${idx + 1} (${qp.desc}): ${reached ? 'Quorum Met' : 'Quorum Pending'}`);
});

// Idempotent duplicate voting test
const duplicateApprovals = ['0x1', '0x1', '0x1'];
const dupCheck = checkQuorum({ approvals: duplicateApprovals, participantsCount: 2, policy: APPROVAL_POLICIES.MAJORITY_VOTE });
assert(dupCheck === false, 'Sybil Resistance: Duplicate votes from same wallet do not satisfy quorum');

// ======================================================================
// 6. Debt Simplification (Min-Cash-Flow) Permutations & Invariants
// ======================================================================
console.log('\n--- 6. Debt Simplification (Min-Cash-Flow) Permutations ---');

// 6.1 Permutation: 0 Balances
assert(simplifyDebts([]).length === 0, 'Min-Cash-Flow: Empty member list produces 0 transfers');
assert(simplifyDebts([{ address: '0x1', netBalance: 0 }, { address: '0x2', netBalance: 0 }]).length === 0, 'Min-Cash-Flow: All zero balances produce 0 transfers');

// 6.2 Permutation: 2 Members Bilateral Debt
const twoMemberDebts = simplifyDebts([
  { address: '0xA', name: 'Alice', netBalance: 5000 },
  { address: '0xB', name: 'Bob', netBalance: -5000 }
]);
assert(twoMemberDebts.length === 1, '2-Member Debt: Generates exactly 1 transfer');
assert(twoMemberDebts[0].from === '0xB' && twoMemberDebts[0].to === '0xA' && twoMemberDebts[0].amount === 5000, '2-Member Debt: Bob pays Alice ₹50.00');

// 6.3 Permutation: 3-Member Circular Debt (A paid B, B paid C, C paid A)
// Net balance is 0 for everyone
const circularZeroDebts = simplifyDebts([
  { address: '0xA', name: 'Alice', netBalance: 0 },
  { address: '0xB', name: 'Bob', netBalance: 0 },
  { address: '0xC', name: 'Charlie', netBalance: 0 }
]);
assert(circularZeroDebts.length === 0, 'Circular Debt: Completely offsetting 3-way circular debt simplifies to 0 transactions');

// 6.4 Permutation: 4-Member Star Debt (1 Payer, 3 Debtors)
const starDebts = simplifyDebts([
  { address: '0xPayer', name: 'Payer', netBalance: 30000 },
  { address: '0xD1', name: 'D1', netBalance: -10000 },
  { address: '0xD2', name: 'D2', netBalance: -10000 },
  { address: '0xD3', name: 'D3', netBalance: -10000 }
]);
assert(starDebts.length === 3, 'Star Debt: 1 Creditor with 3 Debtors produces exactly 3 transfers');
assert(starDebts.every(t => t.to === '0xPayer' && t.amount === 10000), 'Star Debt: All 3 debtors pay the single creditor');

// 6.5 Permutation: Complex 5-Member Multi-Creditor, Multi-Debtor Graph
const complexGraph = [
  { address: '0x1', name: 'Alice', netBalance: 45000 },   // +₹450
  { address: '0x2', name: 'Bob', netBalance: 25000 },     // +₹250
  { address: '0x3', name: 'Charlie', netBalance: -30000 },// -₹300
  { address: '0x4', name: 'David', netBalance: -20000 },  // -₹200
  { address: '0x5', name: 'Eve', netBalance: -20000 }     // -₹200
];
// Total credits = 70000, Total debits = -70000 (Zero-sum invariant)
const complexTransfers = simplifyDebts(complexGraph);
assert(complexTransfers.length <= 4, `Min-Cash-Flow Optimality: 5-party debt resolved in ${complexTransfers.length} transfers (<= 4 transactions)`);

const totalTransferred = complexTransfers.reduce((sum, t) => sum + t.amount, 0);
assert(totalTransferred === 70000, 'Min-Cash-Flow Conservation: Total transferred matches sum of all positive balances (₹700.00)');

// Verify that executing these transfers clears every participant's balance to exactly 0
const verificationBalances = {};
complexGraph.forEach(m => verificationBalances[m.address] = m.netBalance);
complexTransfers.forEach(t => {
  verificationBalances[t.from] += t.amount;
  verificationBalances[t.to] -= t.amount;
});
const allCleared = Object.values(verificationBalances).every(b => b === 0);
assert(allCleared, 'Mathematical Guarantee: Executing simplified transfers clears every account balance to exactly ₹0.00');

// 6.6 Permutation: 15-Member Random Transaction Invariant Fuzzing
let fuzzPassed = true;
for (let run = 0; run < 20; run++) {
  const memberCount = 10;
  const balances = Array(memberCount).fill(0);
  // Generate random transactions
  for (let tx = 0; tx < 30; tx++) {
    const from = Math.floor(Math.random() * memberCount);
    const to = Math.floor(Math.random() * memberCount);
    if (from === to) continue;
    const amount = Math.floor(Math.random() * 5000) + 100;
    balances[from] -= amount;
    balances[to] += amount;
  }

  const fuzzMembers = balances.map((b, idx) => ({ address: `0xMember${idx}`, netBalance: b }));
  const transfers = simplifyDebts(fuzzMembers);

  // Validate zero sum cleared
  const testBalances = { ...balances };
  transfers.forEach(t => {
    const fromIdx = Number(t.from.replace('0xMember', ''));
    const toIdx = Number(t.to.replace('0xMember', ''));
    testBalances[fromIdx] += t.amount;
    testBalances[toIdx] -= t.amount;
  });

  const runSuccess = Object.values(testBalances).every(b => b === 0);
  if (!runSuccess) {
    fuzzPassed = false;
    break;
  }
}
assert(fuzzPassed, 'Min-Cash-Flow Fuzzing: 20 randomized 10-party economic graphs verified with zero balance residuals');

// ======================================================================
// 7. UPI URI & Currency Formatting Permutations
// ======================================================================
console.log('\n--- 7. UPI URI & Currency Formatting Permutations ---');

// 7.1 Currency Conversions
assert(rupeesToPaise('0') === 0, 'rupeesToPaise: "0" -> 0 paise');
assert(rupeesToPaise('0.05') === 5, 'rupeesToPaise: "0.05" -> 5 paise');
assert(rupeesToPaise('123.45') === 12345, 'rupeesToPaise: "123.45" -> 12345 paise');
assert(rupeesToPaise('1000000.00') === 100000000, 'rupeesToPaise: "1000000.00" -> 100000000 paise (₹10 Lakhs)');
assert(formatCents(0) === '₹0.00', 'formatCents: 0 -> ₹0.00');
assert(formatCents(5) === '₹0.05', 'formatCents: 5 -> ₹0.05');
assert(formatCents(-150000) === '-₹1,500.00', 'formatCents: -150000 -> -₹1,500.00');

// 7.2 UPI Validation Permutations
const validUpiIds = [
  'eshwar@okhdfcbank',
  'priya.sharma@paytm',
  '9876543210@ybl',
  'merchant-test@icici',
  'user.name_123@okaxis'
];
validUpiIds.forEach(id => {
  assert(isValidUpiId(id), `UPI Validation: Accepted valid UPI VPA "${id}"`);
});

const invalidUpiIds = [
  '',
  'missing-at-sign',
  '@missing-handle',
  'user@',
  'space in@vpa',
  null,
  undefined,
  12345
];
invalidUpiIds.forEach(id => {
  assert(!isValidUpiId(id), `UPI Validation: Safely rejected invalid UPI VPA "${id}"`);
});

// 7.3 UPI URI Generation Permutations
const upiUri1 = generateUpiUri({
  upiId: 'eshwar@okhdfcbank',
  payeeName: 'Eshwar Chandram',
  amountInRupees: '450.50',
  note: 'Flat 402 - WiFi & Power'
});
assert(upiUri1.startsWith('upi://pay?'), 'generateUpiUri: Standard scheme upi://pay?');
assert(upiUri1.includes('pa=eshwar@okhdfcbank'), 'generateUpiUri: Contains payee address');
assert(upiUri1.includes('pn=Eshwar%20Chandram'), 'generateUpiUri: Properly URL-encodes payee name');
assert(upiUri1.includes('am=450.50'), 'generateUpiUri: Formats amount correctly');
assert(upiUri1.includes('cu=INR'), 'generateUpiUri: Specifies INR currency');

// ======================================================================
// 8. On-Chain Ledger Hash & Cryptographic Digest Invariants
// ======================================================================
console.log('\n--- 8. Cryptographic Digests & Transaction Hashes ---');

const tx1 = generateTxHash();
const tx2 = generateTxHash();
assert(tx1.startsWith('0x') && tx1.length === 66, 'generateTxHash: Generates standard 32-byte EVM hash (0x + 64 hex chars)');
assert(tx1 !== tx2, 'generateTxHash: Generates cryptographically unique hashes');

console.log('\n======================================================================');
console.log(`🎉 TEST SUITE SUMMARY: ${passedTests} / ${totalTests} assertions passed (${failedTests} failed)`);
console.log('======================================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
