import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  FileCheck2, 
  AlertCircle,
  ExternalLink,
  Eye
} from 'lucide-react';
import { ethers } from 'ethers';
import { dollarsToCents, generateIpfsCid, formatCents, generateDigitalReceiptPdf } from '../utils/cryptoUtils';
import { SPLIT_TYPES } from '../services/blockchainState';
import { ipfsService, computeIpfsCidV1 } from '../services/ipfsService';

const CATEGORIES = [
  'Groceries',
  'Rent & Housing',
  'Utilities',
  'Dining & Drinks',
  'Travel & Transit',
  'Household Supplies',
  'Electronics & Hardware',
  'Entertainment',
  'General',
];

export default function AddExpenseModal(props) {
  if (!props.isOpen) return null;
  return <AddExpenseModalContent {...props} />;
}

function AddExpenseModalContent({
  onClose,
  currentGroup,
  currentAccount,
  onSubmitExpense,
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [amountStr, setAmountStr] = useState('');
  const [splitType, setSplitType] = useState(SPLIT_TYPES.EQUAL);
  const verifiedMembers = (currentGroup?.members || []).filter(m => m && m.address && m.email && m.email.includes('@'));
  const [selectedParticipants, setSelectedParticipants] = useState(() => 
    verifiedMembers.map(m => m.address)
  );
  const [customAmounts, setCustomAmounts] = useState({}); // address => dollar string
  const [customPercentages, setCustomPercentages] = useState(() => {
    const count = verifiedMembers.length;
    const pcts = {};
    if (count > 0) {
      const equalPct = (100 / count).toFixed(1);
      verifiedMembers.forEach(m => {
        pcts[m.address] = equalPct;
      });
    }
    return pcts;
  }); // address => percent string
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptDataUrl, setReceiptDataUrl] = useState('');
  const [receiptHash, setReceiptHash] = useState('');
  const [ipfsCid, setIpfsCid] = useState('');
  const [ipfsGatewayUrl, setIpfsGatewayUrl] = useState('');
  const [isPinnedLive, setIsPinnedLive] = useState(false);
  const [ipfsProvider, setIpfsProvider] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isHashing, setIsHashing] = useState(false);

  const toggleParticipant = (addr) => {
    if (!addr) return;
    const exists = selectedParticipants.some(a => a.toLowerCase() === addr.toLowerCase());
    if (exists) {
      if (selectedParticipants.length <= 1) return; // Keep at least one
      setSelectedParticipants(selectedParticipants.filter(a => a.toLowerCase() !== addr.toLowerCase()));
    } else {
      setSelectedParticipants([...selectedParticipants, addr]);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsHashing(true);
    setError('');
    try {
      const pinResult = await ipfsService.pinFile(file, {
        keyvalues: {
          title: title || 'Expense Receipt',
          category,
          groupId: String(currentGroup.id),
        },
      });

      setReceiptFile(file);
      setReceiptDataUrl(pinResult.dataUrl || pinResult.localPreviewUrl || '');
      setReceiptHash(pinResult.hashHex);
      setIpfsCid(pinResult.cid);
      setIpfsGatewayUrl(pinResult.gatewayUrl);
      setIsPinnedLive(pinResult.isPinnedLive);
      setIpfsProvider(pinResult.provider);
    } catch (err) {
      console.error(err);
      setError('Failed to compute cryptographic hash & pin file to IPFS.');
    } finally {
      setIsHashing(false);
    }
  };

  const calculateShares = () => {
    const totalCents = dollarsToCents(amountStr);
    const count = selectedParticipants.length;
    if (count === 0 || totalCents <= 0) return [];

    if (splitType === SPLIT_TYPES.EQUAL) {
      const baseShare = Math.floor(totalCents / count);
      let remainder = totalCents % count;

      return selectedParticipants.map((addr) => {
        const m = (currentGroup?.members || []).find(x => x?.address && addr && x.address.toLowerCase() === addr.toLowerCase());
        const extra = remainder > 0 ? 1 : 0;
        if (remainder > 0) remainder--;

        return {
          participant: addr,
          name: m ? m.name : 'Member',
          amount: baseShare + extra,
        };
      });
    }

    if (splitType === SPLIT_TYPES.EXACT) {
      return selectedParticipants.map((addr) => {
        const m = (currentGroup?.members || []).find(x => x?.address && addr && x.address.toLowerCase() === addr.toLowerCase());
        const valCents = dollarsToCents(customAmounts[addr] || '0');
        return {
          participant: addr,
          name: m ? m.name : 'Member',
          amount: valCents,
        };
      });
    }

    if (splitType === SPLIT_TYPES.PERCENTAGE) {
      const sumPct = selectedParticipants.reduce((sum, a) => sum + (parseFloat(customPercentages[a]) || 0), 0);
      let allocatedCents = 0;

      return selectedParticipants.map((addr, idx) => {
        const m = (currentGroup?.members || []).find(x => x?.address && addr && x.address.toLowerCase() === addr.toLowerCase());
        const pct = parseFloat(customPercentages[addr] || '0') / 100;
        let shareAmt = Math.round(totalCents * pct);

        // If total percentages equal ~100%, eliminate any 1-paise rounding discrepancies on the last participant
        if (idx === selectedParticipants.length - 1 && Math.abs(sumPct - 100) < 0.15) {
          shareAmt = Math.max(0, totalCents - allocatedCents);
        } else {
          allocatedCents += shareAmt;
        }

        return {
          participant: addr,
          name: m ? m.name : 'Member',
          amount: shareAmt,
        };
      });
    }

    return [];
  };

  const handleSwitchSplitType = (newType) => {
    setSplitType(newType);
    const totalCents = dollarsToCents(amountStr);
    const count = selectedParticipants.length;
    if (count === 0 || totalCents <= 0) return;

    if (newType === SPLIT_TYPES.EXACT) {
      const baseRupees = (parseFloat(amountStr || '0') / count).toFixed(2);
      const newAmounts = {};
      selectedParticipants.forEach(addr => {
        newAmounts[addr] = baseRupees;
      });
      setCustomAmounts(newAmounts);
    } else if (newType === SPLIT_TYPES.PERCENTAGE) {
      const basePct = (100 / count).toFixed(1);
      const newPcts = {};
      selectedParticipants.forEach(addr => {
        newPcts[addr] = basePct;
      });
      setCustomPercentages(newPcts);
    }
  };

  const handleAutoBalanceRemainder = () => {
    const totalCents = dollarsToCents(amountStr);
    if (totalCents <= 0) return;

    const shares = calculateShares();
    const currentSum = shares.reduce((sum, s) => sum + s.amount, 0);
    const diffCents = totalCents - currentSum;
    const targetAddr = selectedParticipants.includes(currentAccount) ? currentAccount : selectedParticipants[0];

    if (!targetAddr) return;

    if (splitType === SPLIT_TYPES.EXACT) {
      const currentValCents = dollarsToCents(customAmounts[targetAddr] || '0');
      const newValCents = Math.max(0, currentValCents + diffCents);
      setCustomAmounts({
        ...customAmounts,
        [targetAddr]: (newValCents / 100).toFixed(2),
      });
    } else if (splitType === SPLIT_TYPES.PERCENTAGE) {
      const currentSumPct = selectedParticipants.reduce((sum, a) => sum + (parseFloat(customPercentages[a]) || 0), 0);
      const diffPct = 100 - currentSumPct;
      const currentPct = parseFloat(customPercentages[targetAddr] || '0');
      setCustomPercentages({
        ...customPercentages,
        [targetAddr]: Math.max(0, currentPct + diffPct).toFixed(1),
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const totalCents = dollarsToCents(amountStr);
    if (!title.trim()) {
      setError('Please provide an expense title.');
      return;
    }
    if (totalCents <= 0) {
      setError('Please enter a valid expense amount greater than ₹0.');
      return;
    }
    if (selectedParticipants.length === 0) {
      setError('Please select at least one participant.');
      return;
    }

    const shares = calculateShares();
    const sumShares = shares.reduce((sum, s) => sum + s.amount, 0);

    // Exact check
    if (splitType === SPLIT_TYPES.EXACT && sumShares !== totalCents) {
      setError(`Sum of exact shares (${formatCents(sumShares)}) does not match total amount (${formatCents(totalCents)}). Difference: ${formatCents(Math.abs(sumShares - totalCents))}`);
      return;
    }

    // Percentage check (with tolerance for floating point rounding discrepancies)
    if (splitType === SPLIT_TYPES.PERCENTAGE) {
      const sumPct = selectedParticipants.reduce((sum, a) => sum + (parseFloat(customPercentages[a]) || 0), 0);
      if (Math.abs(sumPct - 100) > 0.15) {
        setError(`Sum of percentages (${sumPct.toFixed(1)}%) must equal exactly 100%. Difference: ${Math.abs(sumPct - 100).toFixed(1)}%`);
        return;
      }
    }

    let finalReceiptHash = receiptHash;
    let finalIpfsCid = ipfsCid;
    let finalGatewayUrl = ipfsGatewayUrl;
    let finalDataUrl = receiptDataUrl;
    let finalFileName = receiptFile ? receiptFile.name : `invoice-${Date.now().toString(36)}.pdf`;

    if (!finalDataUrl) {
      // Auto-generate authentic cryptographic digital invoice voucher
      const payerObj = (currentGroup?.members || []).find(m => m && m.address && currentAccount && m.address.toLowerCase() === currentAccount.toLowerCase());
      finalDataUrl = generateDigitalReceiptPdf({
        title: title.trim(),
        category,
        totalAmount: totalCents,
        payerName: payerObj?.name || 'Member',
        expenseId: Date.now().toString().slice(-4),
        dateStr: new Date().toISOString().slice(0, 10),
      });

      // Compute authentic SHA-256 and IPFS CIDv1 from the generated PDF
      try {
        const pdfBase64 = finalDataUrl.replace(/^data:application\/pdf;base64,/, '');
        const binaryStr = atob(pdfBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        finalReceiptHash = ethers.sha256(bytes);
        finalIpfsCid = computeIpfsCidV1(ethers.getBytes(finalReceiptHash));
        finalGatewayUrl = `/ipfs/${finalIpfsCid}`;

        // Save into client cache and persist to server
        ipfsService.saveReceiptData(finalIpfsCid, finalDataUrl);
        ipfsService.uploadReceiptToServer(finalIpfsCid, finalFileName, finalDataUrl).catch(() => {});
      } catch (err) {
        console.warn('Digital invoice voucher generation notice:', err);
        finalReceiptHash = finalReceiptHash || '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
        finalIpfsCid = finalIpfsCid || generateIpfsCid(finalReceiptHash);
        finalGatewayUrl = finalGatewayUrl || `/ipfs/${finalIpfsCid}`;
      }
    }

    try {
      onSubmitExpense({
        groupId: currentGroup.id,
        title: title.trim(),
        category,
        totalAmount: totalCents,
        splitType,
        shares,
        receiptHash: finalReceiptHash,
        receiptFileName: finalFileName,
        receiptDataUrl: finalDataUrl,
        ipfsCid: finalIpfsCid,
        ipfsGatewayUrl: finalGatewayUrl,
        isPinnedLive,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit expense to smart contract.');
    }
  };

  const calculatedShares = calculateShares();
  const currentSharesSum = calculatedShares.reduce((s, x) => s + x.amount, 0);
  const totalCents = dollarsToCents(amountStr);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Record Blockchain Expense</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-rose)', fontSize: '13px', fontWeight: 600 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Expense Title / Description</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Costco Grocery Restock, High-Speed WiFi"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Amount & Category */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Total Amount (₹ INR)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="0.00"
                value={amountStr}
                onChange={e => setAmountStr(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Split Type Selector */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Splitting Algorithm</label>
              {splitType !== SPLIT_TYPES.EQUAL && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '2px 8px', height: '26px' }}
                    onClick={() => handleSwitchSplitType(splitType)}
                  >
                    Reset Evenly
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '2px 8px', height: '26px', color: 'var(--color-primary-light)' }}
                    onClick={handleAutoBalanceRemainder}
                  >
                    Auto-Balance Remainder
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className={`btn btn-sm ${splitType === SPLIT_TYPES.EQUAL ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleSwitchSplitType(SPLIT_TYPES.EQUAL)}
              >
                Equal Split (₹)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${splitType === SPLIT_TYPES.EXACT ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleSwitchSplitType(SPLIT_TYPES.EXACT)}
              >
                Exact Amounts (₹)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${splitType === SPLIT_TYPES.PERCENTAGE ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleSwitchSplitType(SPLIT_TYPES.PERCENTAGE)}
              >
                Percentage (%)
              </button>
            </div>
          </div>

          {/* Participants Selection & Shares */}
          <div className="form-group">
            <label className="form-label">Participants & Share Calculation</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
              {verifiedMembers.map(m => {
                const isSelected = selectedParticipants.includes(m.address);
                const shareObj = calculatedShares.find(s => s?.participant && s.participant.toLowerCase() === m.address.toLowerCase());

                return (
                  <div 
                    key={m.address}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-surface)',
                      border: isSelected ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleParticipant(m.address)}
                      />
                      <span>{m.avatar}</span>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>{m.name}</span>
                    </label>

                    {isSelected && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {splitType === SPLIT_TYPES.EXACT && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>₹</span>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              style={{ width: '85px', padding: '4px 8px', fontSize: '12px', background: 'var(--bg-canvas)', border: '1px solid var(--border-medium)', color: 'var(--text-main)', borderRadius: '4px' }}
                              value={customAmounts[m.address] || ''}
                              onChange={e => setCustomAmounts({ ...customAmounts, [m.address]: e.target.value })}
                            />
                          </div>
                        )}

                        {splitType === SPLIT_TYPES.PERCENTAGE && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              step="0.1"
                              placeholder="%"
                              style={{ width: '60px', padding: '4px 8px', fontSize: '12px', background: 'var(--bg-canvas)', border: '1px solid var(--border-medium)', color: 'var(--text-main)', borderRadius: '4px', textAlign: 'right' }}
                              value={customPercentages[m.address] || ''}
                              onChange={e => setCustomPercentages({ ...customPercentages, [m.address]: e.target.value })}
                            />
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>%</span>
                          </div>
                        )}

                        <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-emerald-light)', minWidth: '75px', textAlign: 'right' }}>
                          {shareObj ? formatCents(shareObj.amount) : '₹0.00'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sum check bar */}
            {totalCents > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '12px', background: 'var(--bg-surface-elevated)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <span>Allocated: <strong>{formatCents(currentSharesSum)}</strong> / {formatCents(totalCents)}</span>
                {currentSharesSum === totalCents ? (
                  <span style={{ color: 'var(--color-emerald)', fontWeight: 700 }}>✓ Balanced perfectly</span>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--color-amber)', fontWeight: 600 }}>
                      Δ {formatCents(Math.abs(currentSharesSum - totalCents))}
                    </span>
                    <button
                      type="button"
                      onClick={handleAutoBalanceRemainder}
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', textDecoration: 'underline', cursor: 'pointer', fontSize: '11px', fontWeight: 600, padding: 0 }}
                    >
                      Auto-balance
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Receipt Upload with Live Cryptographic SHA-256 Hashing & IPFS Pinning */}
          <div className="form-group">
            <label className="form-label">
              Supporting Receipt (Off-Chain Document Anchored to IPFS & On-Chain Proof)
            </label>
            <div 
              style={{
                border: '1px dashed var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                textAlign: 'center',
                background: 'rgba(214, 204, 194, 0.25)'
              }}
            >
              <input
                type="file"
                id="receipt-file-input"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <label 
                htmlFor="receipt-file-input" 
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
              >
                <UploadCloud size={24} style={{ color: 'var(--color-primary-light)' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 600 }}>
                  {receiptFile ? receiptFile.name : 'Click to attach receipt or invoice (PDF, JPG, PNG)'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  Generates immutable SHA-256 fingerprint & authentic IPFS CIDv1
                </span>
              </label>

              {isHashing && (
                <div style={{ fontSize: '12px', color: '#0E7490', marginTop: '8px', fontWeight: 600 }}>
                  Computing SHA-256 cryptographic hash & pinning to IPFS...
                </div>
              )}

              {receiptHash && !isHashing && (
                <div style={{ marginTop: '10px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)', padding: '10px 12px', borderRadius: '6px', fontSize: '11px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ color: '#0E7490', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FileCheck2 size={13} />
                      <span>SHA-256: {receiptHash.substring(0, 24)}...</span>
                    </div>
                    <span 
                      className={`badge ${isPinnedLive ? 'badge-approved' : 'badge-neutral'}`}
                      style={{ fontSize: '10px', padding: '2px 8px' }}
                    >
                      {isPinnedLive ? '⚡ Pinata Cloud Pinned' : 'CIDv1 Content-Addressed'}
                    </span>
                  </div>

                  <div className="mono" style={{ color: 'var(--text-main)', wordBreak: 'break-all', marginBottom: '4px' }}>
                    <strong>IPFS CID:</strong> {ipfsCid}
                  </div>

                  {receiptDataUrl && (receiptDataUrl.startsWith('data:image/') || (receiptFile && receiptFile.type?.startsWith('image/'))) && (
                    <div style={{ marginTop: '8px', textAlign: 'center', background: 'var(--bg-canvas)', borderRadius: '6px', padding: '6px', border: '1px solid var(--border-subtle)' }}>
                      <img
                        src={receiptDataUrl}
                        alt="Receipt Preview"
                        style={{ maxHeight: '120px', maxWidth: '100%', borderRadius: '4px', objectFit: 'contain' }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>
                      Provider: {ipfsProvider || 'IPFS (CIDv1)'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {(receiptDataUrl || receiptFile) && (
                        <a
                          href={receiptDataUrl || ipfsService.getLocalPreviewUrl(ipfsCid) || (receiptFile ? URL.createObjectURL(receiptFile) : '#')}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: 'var(--color-emerald-light)',
                            fontWeight: 700,
                            fontSize: '11px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            textDecoration: 'none'
                          }}
                        >
                          <Eye size={11} />
                          <span>View File</span>
                        </a>
                      )}
                      {ipfsGatewayUrl && (
                        <a
                          href={ipfsGatewayUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: '#0052FF',
                            fontWeight: 700,
                            fontSize: '11px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            textDecoration: 'none'
                          }}
                        >
                          <span>Gateway</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Additional Notes / Memo</label>
            <textarea
              className="form-textarea"
              placeholder="e.g. Split with Bob and Charlie for dinner celebration"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows="2"
            />
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Anchor to Blockchain
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
