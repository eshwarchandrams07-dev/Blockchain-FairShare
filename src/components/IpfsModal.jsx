import React, { useState } from 'react';
import { 
  X, 
  HardDrive, 
  ExternalLink, 
  Check, 
  ShieldCheck, 
  Key, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck
} from 'lucide-react';
import { ipfsService } from '../services/ipfsService';

export default function IpfsModal({
  isOpen,
  onClose,
  onConfigSaved,
}) {
  if (!isOpen) return null;

  return (
    <IpfsModalContent
      onClose={onClose}
      onConfigSaved={onConfigSaved}
    />
  );
}

function IpfsModalContent({ onClose, onConfigSaved }) {
  const [jwt, setJwt] = useState(() => ipfsService.getPinataJwt());
  const [gateway, setGateway] = useState(() => ipfsService.getGateway());
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleTestAuth = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await ipfsService.testPinataAuth(jwt);
    setTestResult(res);
    setIsTesting(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    ipfsService.setPinataJwt(jwt);
    ipfsService.setGateway(gateway);
    setSaveSuccess(true);
    if (onConfigSaved) onConfigSaved();
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const hasPinataConfigured = !!jwt.trim();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <HardDrive size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Decentralized IPFS Storage</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: 0 }}>
                InterPlanetary File System (IPFS) Pinning &amp; Content Addressing (CIDv1)
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Current IPFS Architecture Status */}
        <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>IPFS Engine Status</span>
            {hasPinataConfigured ? (
              <span className="badge badge-approved" style={{ fontSize: '11px' }}>
                <Check size={12} />
                <span>Pinata Cloud Pinning Active</span>
              </span>
            ) : (
              <span className="badge badge-approved" style={{ fontSize: '11px' }}>
                <ShieldCheck size={12} />
                <span>CIDv1 Content Addressing Active</span>
              </span>
            )}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Every expense document uploaded to FairShare is hashed locally with <strong>SHA-256</strong> to generate an authentic <strong>CIDv1 content identifier (bafkrei...)</strong> that is anchored to the smart contract.
          </p>
        </div>

        {/* Pinata Cloud Pinning Configuration Form */}
        <form onSubmit={handleSave}>
          <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={16} style={{ color: 'var(--color-primary-light)' }} />
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>Pinata Cloud IPFS API (Optional)</h4>
              </div>
              <a 
                href="https://app.pinata.cloud/developers/api-keys" 
                target="_blank" 
                rel="noreferrer"
                style={{ fontSize: '12px', color: '#0052FF', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
              >
                <span>Get Free Pinata JWT</span>
                <ExternalLink size={12} />
              </a>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
              Providing a Pinata JWT enables instant physical pinning of all uploaded receipt images and PDFs across decentralized IPFS nodes globally.
            </p>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontSize: '12px' }}>Pinata API JWT Token</label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Paste your Pinata JWT here)"
                value={jwt}
                onChange={e => setJwt(e.target.value)}
                style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={13} />
                <span>Preferred Public IPFS Gateway</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="https://ipfs.io/ipfs/"
                value={gateway}
                onChange={e => setGateway(e.target.value)}
                style={{ fontSize: '12px' }}
              />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                {[
                  { label: 'FairShare Local Gateway (/ipfs/) [Instant]', url: '/ipfs/' },
                  { label: 'ipfs.io (Public Swarm)', url: 'https://ipfs.io/ipfs/' },
                  { label: 'dweb.link (Protocol Labs)', url: 'https://dweb.link/ipfs/' },
                  { label: 'cloudflare-ipfs.com', url: 'https://cloudflare-ipfs.com/ipfs/' },
                  { label: 'gateway.pinata.cloud', url: 'https://gateway.pinata.cloud/ipfs/' },
                ].map(gw => (
                  <button
                    key={gw.url}
                    type="button"
                    onClick={() => setGateway(gw.url)}
                    className="badge badge-neutral"
                    style={{
                      cursor: 'pointer',
                      border: gateway === gw.url ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                      background: gateway === gw.url ? 'rgba(0, 82, 255, 0.12)' : 'var(--bg-canvas)',
                      color: gateway === gw.url ? 'var(--color-primary-light)' : 'var(--text-dim)',
                      fontSize: '11px',
                      padding: '3px 8px'
                    }}
                  >
                    {gw.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={handleTestAuth}
                disabled={isTesting || !jwt.trim()}
              >
                {isTesting ? 'Testing connection...' : 'Test Connection'}
              </button>

              <button type="submit" className="btn btn-primary btn-sm">
                Save IPFS Settings
              </button>

              {saveSuccess && (
                <span style={{ fontSize: '12px', color: 'var(--color-emerald-light)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <Check size={14} /> Saved!
                </span>
              )}
            </div>

            {testResult && (
              <div style={{ 
                marginTop: '14px', 
                padding: '10px 14px', 
                borderRadius: '6px', 
                background: testResult.authenticated ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                border: testResult.authenticated ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {testResult.authenticated ? (
                  <CheckCircle2 size={15} style={{ color: 'var(--color-emerald)' }} />
                ) : (
                  <AlertCircle size={15} style={{ color: 'var(--color-rose)' }} />
                )}
                <span style={{ color: 'var(--text-main)' }}>{testResult.message}</span>
              </div>
            )}
          </div>
        </form>

        {/* Educational Architecture Callout */}
        <div style={{ padding: '14px 18px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', fontSize: '13px' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileCheck size={16} style={{ color: 'var(--color-primary-light)' }} />
            <span>How Decentralized Storage Guarantees Trust</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0, lineHeight: 1.5 }}>
            Because IPFS uses cryptographic content addressing, an IPFS URI (e.g. <code>ipfs://bafkrei...</code>) is derived directly from the file content itself. If any party attempts to doctor an invoice by even one pixel or character, the CID changes entirely, preventing invoice fraud before on-chain consensus is reached.
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
