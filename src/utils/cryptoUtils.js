import { ethers } from 'ethers';
import { computeIpfsCidV1 } from '../services/ipfsService.js';

/**
 * Format address to short readable string: 0x1234...abcd
 */
export function shortenAddress(address) {
  if (!address) return '';
  if (address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Format paise/cents to INR currency string: 1050 -> "₹10.50", 150000 -> "₹1,500.00"
 */
export function formatCents(cents) {
  const num = Number(cents) || 0;
  const absRupees = Math.abs(num) / 100;
  const formatted = absRupees.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  if (num < 0) {
    return `-₹${formatted}`;
  }
  return `₹${formatted}`;
}

/**
 * Format paise/cents with optional privacy masking for Stealth Mode
 */
export function formatMaskedCents(cents, isMasked = false) {
  if (isMasked) return '₹••••••';
  return formatCents(cents);
}

/**
 * Parse INR rupee string/number to integer paise: "10.50" -> 1050
 */
export function rupeesToPaise(rupees) {
  const val = parseFloat(rupees);
  if (isNaN(val)) return 0;
  return Math.round(val * 100);
}

// Alias for backwards compatibility
export const dollarsToCents = rupeesToPaise;

/**
 * Generate standard NPCI UPI Payment Intent URI for GPay, PhonePe, Paytm, BHIM, CRED
 * Ensures literal @ symbol so all UPI scanner camera apps parse the payee VPA cleanly.
 */
export function generateUpiUri({ upiId, payeeName, amountInRupees, note }) {
  const cleanUpi = (upiId || 'roommate@upi').trim().replace(/\s+/g, '');
  const cleanName = encodeURIComponent((payeeName || 'Roommate').trim());
  const cleanAmount = (Number(amountInRupees) || 0).toFixed(2);
  const cleanNote = encodeURIComponent((note || 'FairShare Settlement').trim().slice(0, 50));
  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${cleanAmount}&cu=INR&tn=${cleanNote}`;
}

/**
 * Validate whether a string is a standard NPCI UPI Virtual Payment Address (VPA)
 */
export function isValidUpiId(upiId) {
  if (!upiId || typeof upiId !== 'string') return false;
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(upiId.trim());
}

/**
 * Check if the UPI ID is still the initial mock placeholder (@upi)
 */
export function isPlaceholderUpi(upiId) {
  if (!upiId) return true;
  return upiId.trim().toLowerCase().endsWith('@upi');
}

/**
 * Compute SHA-256 cryptographic hash of a File or ArrayBuffer
 */
export async function computeFileHash(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    }
    // Fallback using ethers pure-JS sha256
    return ethers.sha256(new Uint8Array(arrayBuffer));
  } catch (err) {
    console.error('Error computing file hash:', err);
    try {
      if (file && typeof file.arrayBuffer === 'function') {
        const buf = await file.arrayBuffer();
        return ethers.sha256(new Uint8Array(buf));
      }
    } catch {}
    // Fallback pseudo-hash
    return ethers.keccak256(ethers.toUtf8Bytes(file.name + file.size + (file.lastModified || '0')));
  }
}

/**
 * Generate standard IPFS Content Identifier (CIDv1) from hash
 */
export function generateIpfsCid(hashHex) {
  if (!hashHex) return 'ipfs://bafkreiaaaaaaaafairshare';
  try {
    const cid = computeIpfsCidV1(hashHex);
    return `ipfs://${cid}`;
  } catch {
    const raw = hashHex.replace('0x', '').toLowerCase();
    return `ipfs://bafkrei${raw.substring(0, 32)}fairshare`;
  }
}

/**
 * Generate realistic simulated Ethereum transaction hash
 */
export function generateTxHash() {
  const randomBytes = ethers.randomBytes(32);
  return ethers.hexlify(randomBytes);
}

/**
 * Debt Simplification Algorithm (Min-Cash-Flow)
 * Minimizes total number of transactions required to settle all debts in a group.
 *
 * @param {Array<{ address: string, name: string, netBalance: number }>} members
 * @returns {Array<{ from: string, fromName: string, to: string, toName: string, amount: number }>}
 */
export function simplifyDebts(members) {
  // Deep clone and filter non-zero balances
  // Positive balance = creditor (should receive money)
  // Negative balance = debtor (owes money)
  const creditors = [];
  const debtors = [];

  members.forEach(m => {
    const bal = Math.round(m.netBalance);
    if (bal > 1) { // 1 cent threshold
      creditors.push({ ...m, remaining: bal });
    } else if (bal < -1) {
      debtors.push({ ...m, remaining: -bal }); // positive amount owed
    }
  });

  // Sort descending to optimize matching largest debts first
  creditors.sort((a, b) => b.remaining - a.remaining);
  debtors.sort((a, b) => b.remaining - a.remaining);

  const transactions = [];
  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx];
    const debtor = debtors[dIdx];

    const settleAmount = Math.min(creditor.remaining, debtor.remaining);

    if (settleAmount > 0) {
      transactions.push({
        from: debtor.address,
        fromName: debtor.name,
        to: creditor.address,
        toName: creditor.name,
        amount: settleAmount,
      });

      creditor.remaining -= settleAmount;
      debtor.remaining -= settleAmount;
    }

    if (creditor.remaining <= 1) {
      cIdx++;
    }
    if (debtor.remaining <= 1) {
      dIdx++;
    }
  }

  return transactions;
}

/**
 * Raw Bilateral (Unsimplified) Debts Calculator
 * Computes direct bilateral obligations between every pair of members
 * before applying the Greedy Min-Cash-Flow reduction algorithm.
 *
 * @param {Array} members
 * @param {Array} expenses
 * @param {Array} settlements
 * @param {number} groupId
 * @returns {Array<{ from: string, fromName: string, to: string, toName: string, amount: number }>}
 */
export function calculateRawPairwiseDebts(members = [], expenses = [], settlements = [], groupId = 1) {
  const pairwise = {};
  members.forEach(m => {
    pairwise[m.address.toLowerCase()] = {};
    members.forEach(m2 => {
      pairwise[m.address.toLowerCase()][m2.address.toLowerCase()] = 0;
    });
  });

  const groupExpenses = expenses.filter(e => Number(e.groupId) === Number(groupId) && Number(e.status) === 1);
  for (const exp of groupExpenses) {
    const payer = (exp.payer || '').toLowerCase();
    for (const share of (exp.shares || [])) {
      const participant = (share.participant || '').toLowerCase();
      if (participant && payer && participant !== payer) {
        if (!pairwise[participant]) pairwise[participant] = {};
        pairwise[participant][payer] = (pairwise[participant][payer] || 0) + Number(share.amount);
      }
    }
  }

  const groupSettlements = settlements.filter(s => Number(s.groupId) === Number(groupId) && s.status === 'CONFIRMED');
  for (const st of groupSettlements) {
    const from = (st.from || '').toLowerCase();
    const to = (st.to || '').toLowerCase();
    const amt = Number(st.amount);
    if (from && to && pairwise[from]) {
      pairwise[from][to] = (pairwise[from][to] || 0) - amt;
    }
  }

  const rawTransfers = [];
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const addrA = members[i].address.toLowerCase();
      const addrB = members[j].address.toLowerCase();

      const aOwesB = pairwise[addrA]?.[addrB] || 0;
      const bOwesA = pairwise[addrB]?.[addrA] || 0;
      const netBilateral = aOwesB - bOwesA;

      if (netBilateral > 1) {
        rawTransfers.push({
          from: members[i].address,
          fromName: members[i].name,
          to: members[j].address,
          toName: members[j].name,
          amount: Math.round(netBilateral),
        });
      } else if (netBilateral < -1) {
        rawTransfers.push({
          from: members[j].address,
          fromName: members[j].name,
          to: members[i].address,
          toName: members[i].name,
          amount: Math.round(-netBilateral),
        });
      }
    }
  }

  return rawTransfers;
}
