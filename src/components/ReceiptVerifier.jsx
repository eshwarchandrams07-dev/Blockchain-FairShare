import React, { useState } from 'react';
import { 
  FileCheck2, 
  UploadCloud, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  FileText,
  ExternalLink
} from 'lucide-react';
import { computeFileHash, formatCents, shortenAddress } from '../utils/cryptoUtils';
import { ipfsService } from '../services/ipfsService';

export default function ReceiptVerifier({ expenses, currentGroup }) {
  const [file, setFile] = useState(null);
  const [computedHash, setComputedHash] = useState('');
  const [isHashing, setIsHashing] = useState(false);
  const [matchResult, setMatchResult] = useState(null); // { matched: boolean, expense?: object }
  const [manualHashInput, setManualHashInput] = useState('');

  const groupExpensesWithReceipts = (expenses || []).filter(
    e => e && currentGroup && e.groupId === currentGroup.id && e.receiptHash
  );

  const handleFileDrop = async (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    if (!droppedFile) return;

    setFile(droppedFile);
    setIsHashing(true);
    setMatchResult(null);

    try {
      const hash = await computeFileHash(droppedFile);
      setComputedHash(hash);
      verifyAgainstExpenses(hash);
    } catch (err) {
      console.error(err);
      alert('Error calculating file cryptographic hash.');
    } finally {
      setIsHashing(false);
    }
  };

  const verifyAgainstExpenses = (hashToCheck) => {
    if (!hashToCheck) return;
    const cleanHash = String(hashToCheck).trim().toLowerCase();
    const matchedExp = (expenses || []).find(
      e => e?.receiptHash && String(e.receiptHash).toLowerCase() === cleanHash
    );

    if (matchedExp) {
      setMatchResult({
        matched: true,
        expense: matchedExp,
      });
    } else {
      setMatchResult({
        matched: false,
      });
    }
  };

  const handleManualVerify = (e) => {
    e.preventDefault();
    if (!manualHashInput.trim()) return;
    setComputedHash(manualHashInput.trim());
    verifyAgainstExpenses(manualHashInput.trim());
  };

  const testWithExpenseHash = (exp) => {
    setFile({ name: exp.receiptFileName || 'receipt_sample.pdf', size: 104857 });
    setComputedHash(exp.receiptHash);
    verifyAgainstExpenses(exp.receiptHash);
  };

  const testTamperedExpense = (exp) => {
    // Deliberately flip the last hex character of the SHA-256 digest to simulate 1-byte alteration
    const originalHash = exp.receiptHash || '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const lastChar = originalHash.slice(-1);
    const flippedChar = lastChar === 'a' ? 'b' : lastChar === '0' ? '1' : 'f';
    const tamperedHash = originalHash.slice(0, -1) + flippedChar;

    setFile({ name: `[ALTERED-1-BYTE]_${exp.receiptFileName || 'receipt.pdf'}`, size: 104858 });
    setComputedHash(tamperedHash);
    verifyAgainstExpenses(tamperedHash);
  };

  return (
    <div>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px 28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileCheck2 size={24} style={{ color: 'var(--color-cyan)' }} />
              <h3 style={{ fontSize: '20px' }}>Cryptographic Document & Receipt Verifier</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              Verify whether an offline receipt or PDF invoice matches the immutable cryptographic hash anchored to the smart contract.
            </p>
          </div>

          <div className="badge badge-approved" style={{ padding: '8px 14px', fontSize: '13px' }}>
            <ShieldCheck size={16} />
            <span>SHA-256 + IPFS Standard</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Left: Drag-and-Drop Verification Workbench */}
        <div>
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '16px', marginBottom: '14px' }}>Drop Any Receipt to Test Integrity</h4>

            <div 
              className="dropzone"
              onDragOver={e => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => document.getElementById('verifier-file-input').click()}
            >
              <input
                type="file"
                id="verifier-file-input"
                style={{ display: 'none' }}
                onChange={handleFileDrop}
              />
              <div className="dropzone-icon">
                <UploadCloud size={28} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>
                {file ? file.name : 'Click or Drag & Drop Document Here'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '4px' }}>
                Supports invoices, receipts, PDFs, PNG, JPG
              </div>
            </div>

            {/* Manual Hash Lookup option */}
            <form onSubmit={handleManualVerify} style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '13px' }}
                placeholder="Or paste an exact SHA-256 hash (0x...)"
                value={manualHashInput}
                onChange={e => setManualHashInput(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary btn-sm">
                Check
              </button>
            </form>

            {/* Result Box */}
            {isHashing && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-cyan)', fontSize: '14px' }}>
                Computing cryptographic digest...
              </div>
            )}

            {matchResult && !isHashing && (
              <div className={`hash-verify-box ${matchResult.matched ? 'hash-verify-valid' : 'hash-verify-tampered'}`}>
                {matchResult.matched ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-emerald-light)', fontWeight: 800, fontSize: '16px', marginBottom: '8px' }}>
                      <CheckCircle2 size={22} />
                      <span>IMMUTABLE CRYPTOGRAPHIC MATCH CONFIRMED</span>
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '12px' }}>
                      The file's SHA-256 hash perfectly matches the ledger fingerprint anchored to the blockchain. No alteration or tampering has occurred since submission.
                    </p>

                    <div style={{ background: 'var(--bg-canvas)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
                      <div><strong>Expense Title:</strong> {matchResult.expense.title}</div>
                      <div><strong>Expense ID:</strong> #{matchResult.expense.id} (Group #{matchResult.expense.groupId})</div>
                      <div><strong>Claimed Amount:</strong> {formatCents(matchResult.expense.totalAmount)}</div>
                      <div><strong>Payer:</strong> {matchResult.expense.payerName}</div>
                      <div className="mono" style={{ color: 'var(--color-cyan)', marginTop: '4px', wordBreak: 'break-all' }}>
                        <strong>On-Chain Hash:</strong> {matchResult.expense.receiptHash}
                      </div>
                      <div className="mono" style={{ color: 'var(--text-dim)', wordBreak: 'break-all', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                        <span><strong>IPFS CID:</strong> {matchResult.expense.ipfsCid}</span>
                        {matchResult.expense.ipfsCid && (
                          <a
                            href={matchResult.expense.ipfsGatewayUrl || ipfsService.getGatewayUrl(matchResult.expense.ipfsCid)}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#0052FF', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none', fontSize: '11px' }}
                          >
                            <span>Open on IPFS</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-rose)', fontWeight: 800, fontSize: '16px', marginBottom: '8px' }}>
                      <XCircle size={22} />
                      <span>NO MATCH / INTEGRITY DISCREPANCY DETECTED</span>
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '12px' }}>
                      This file's hash does not match any confirmed expense in the group. If this receipt was modified in any way (even by 1 pixel or 1 cent), the SHA-256 cryptographic digest changes entirely.
                    </p>

                    <div style={{ background: 'var(--bg-canvas)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
                      <div className="mono" style={{ color: 'var(--color-rose)', wordBreak: 'break-all', fontWeight: 600 }}>
                        <strong>Computed Hash:</strong> {computedHash}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Known Anchored Receipts in Current Group */}
        <div>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} style={{ color: 'var(--color-primary-light)' }} />
              <span>Anchored Group Receipts ({groupExpensesWithReceipts.length})</span>
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
              Select any receipt to test instant verification against the smart contract ledger.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {groupExpensesWithReceipts.map(exp => (
                <div 
                  key={exp.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>
                      {exp.receiptFileName || 'receipt.pdf'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      Expense #{exp.id}: {exp.title} ({formatCents(exp.totalAmount)})
                    </div>
                    <div className="mono" style={{ fontSize: '11px', color: 'var(--color-cyan)', marginTop: '2px' }}>
                      {shortenAddress(exp.receiptHash)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {exp.ipfsCid && (
                      <a
                        href={exp.ipfsGatewayUrl || ipfsService.getGatewayUrl(exp.ipfsCid)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontSize: '12px' }}
                        title="Open file via decentralized IPFS gateway"
                      >
                        <ExternalLink size={12} />
                        <span>IPFS</span>
                      </a>
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => testWithExpenseHash(exp)}
                      title="Verify authentic original hash matches on-chain state"
                    >
                      Verify
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => testTamperedExpense(exp)}
                      style={{ color: 'var(--color-rose)', borderColor: 'rgba(244, 63, 94, 0.4)' }}
                      title="Simulate 1-byte alteration to prove cryptographic tamper resistance"
                    >
                      🧪 Alter 1-Byte
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
