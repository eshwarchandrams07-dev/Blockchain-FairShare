import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  Check, 
  RefreshCw, 
  AlertCircle, 
  Copy, 
  CheckCircle2, 
  Terminal, 
  Droplets, 
  Layers 
} from 'lucide-react';
import { blockchainService } from '../services/blockchainState';

export default function NetworkModal({
  isOpen,
  onClose,
  onNetworkSwitched,
}) {
  if (!isOpen) return null;

  return (
    <NetworkModalContent
      onClose={onClose}
      onNetworkSwitched={onNetworkSwitched}
    />
  );
}

function NetworkModalContent({ onClose, onNetworkSwitched }) {
  const currentMode = blockchainService.getNetworkMode();
  const config = blockchainService.getBaseSepoliaConfig();
  const liveState = blockchainService.getLiveBaseSepoliaState();

  const [activeMode, setActiveMode] = useState(currentMode);
  const [customAddress, setCustomAddress] = useState(config.contractAddress || '');
  const [isSwitching, setIsSwitching] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [copiedContract, setCopiedContract] = useState(false);

  useEffect(() => {
    blockchainService.syncLiveBaseSepoliaInfo();
  }, []);

  const handleToggleMode = async (targetMode) => {
    setIsSwitching(true);
    setStatusMsg('');

    if (targetMode === 'base-sepolia') {
      const res = await blockchainService.connectBaseSepolia();
      if (res.success) {
        setActiveMode('base-sepolia');
        setStatusMsg('Successfully connected to Base Sepolia Testnet!');
        if (onNetworkSwitched) onNetworkSwitched('base-sepolia');
      } else {
        setStatusMsg(res.error || 'Failed to connect to Base Sepolia in MetaMask.');
      }
    } else {
      blockchainService.setNetworkMode('sandbox');
      setActiveMode('sandbox');
      setStatusMsg('Switched to Local Sandbox Mode.');
      if (onNetworkSwitched) onNetworkSwitched('sandbox');
    }

    setIsSwitching(false);
  };

  const handleSaveContract = (e) => {
    e.preventDefault();
    if (customAddress.trim()) {
      blockchainService.setCustomContractAddress(customAddress.trim());
      setStatusMsg('Custom contract address updated successfully.');
    }
  };

  const handleCopyContract = () => {
    if (config.contractAddress) {
      navigator.clipboard.writeText(config.contractAddress);
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
    }
  };

  const isContractConfigured = config.contractAddress && config.contractAddress !== '0x0000000000000000000000000000000000000000';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Layers size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Blockchain Network Manager</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: 0 }}>
                Toggle between Local Sandbox and Live Base Sepolia Testnet
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Network Selector Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', opacity: isSwitching ? 0.6 : 1, pointerEvents: isSwitching ? 'none' : 'auto' }}>
          {/* Option 1: Sandbox */}
          <div 
            onClick={() => handleToggleMode('sandbox')}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: activeMode === 'sandbox' ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
              background: activeMode === 'sandbox' ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
              cursor: isSwitching ? 'wait' : 'pointer',
              transition: 'all var(--transition-fast)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>Local Sandbox</span>
              {activeMode === 'sandbox' && (
                <span className="badge badge-approved" style={{ fontSize: '10px', padding: '2px 8px' }}>Active</span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
              Zero gas fees, instant local EVM state, and peer-to-peer multi-device WebSocket relay sync.
            </p>
          </div>

          {/* Option 2: Base Sepolia */}
          <div 
            onClick={() => handleToggleMode('base-sepolia')}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: activeMode === 'base-sepolia' ? '2px solid #0052FF' : '1px solid var(--border-subtle)',
              background: activeMode === 'base-sepolia' ? 'rgba(0, 82, 255, 0.06)' : 'var(--bg-surface)',
              cursor: isSwitching ? 'wait' : 'pointer',
              transition: 'all var(--transition-fast)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0052FF' }}></span>
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>Base Sepolia</span>
              </div>
              {activeMode === 'base-sepolia' && (
                <span className="badge badge-approved" style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(0, 82, 255, 0.15)', color: '#0052FF', borderColor: 'rgba(0, 82, 255, 0.3)' }}>Live</span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
              Live Ethereum Layer-2 testnet with real block production and BaseScan verification.
            </p>
          </div>
        </div>

        {statusMsg && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-medium)', fontSize: '13px', color: 'var(--text-main)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {statusMsg.toLowerCase().includes('fail') || statusMsg.toLowerCase().includes('error') ? (
              <AlertCircle size={16} style={{ color: 'var(--color-rose)' }} />
            ) : (
              <CheckCircle2 size={16} style={{ color: 'var(--color-emerald)' }} />
            )}
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Live Network Details (Base Sepolia) */}
        <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>Base Sepolia Live Specifications</h4>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => blockchainService.syncLiveBaseSepoliaInfo()}
              style={{ fontSize: '11px', padding: '3px 8px' }}
            >
              <RefreshCw size={12} />
              <span>Refresh Block</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '12px' }}>
            <div style={{ padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-dim)', display: 'block' }}>Chain ID</span>
              <strong className="mono" style={{ color: 'var(--text-main)' }}>84532 (0x14a34)</strong>
            </div>

            <div style={{ padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-dim)', display: 'block' }}>RPC Endpoint</span>
              <strong className="mono" style={{ color: 'var(--text-main)' }}>https://sepolia.base.org</strong>
            </div>

            <div style={{ padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-dim)', display: 'block' }}>Live Block Height</span>
              <strong className="mono" style={{ color: 'var(--color-emerald-light)' }}>
                {liveState.blockNumber ? `#${liveState.blockNumber.toLocaleString()}` : 'Connecting...'}
              </strong>
            </div>

            <div style={{ padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-dim)', display: 'block' }}>Gas Price</span>
              <strong className="mono" style={{ color: 'var(--color-amber)' }}>
                {liveState.gasPrice || '0.001 Gwei'}
              </strong>
            </div>
          </div>

          {liveState.balance && (
            <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(0, 82, 255, 0.06)', borderRadius: '6px', border: '1px solid rgba(0, 82, 255, 0.2)', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Wallet Balance on Base Sepolia:</span>
              <strong style={{ color: '#0052FF' }}>{liveState.balance}</strong>
            </div>
          )}
        </div>

        {/* Contract Address Status */}
        <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>Deployed Smart Contract</h4>
            {isContractConfigured ? (
              <span className="badge badge-approved" style={{ fontSize: '11px' }}>Contract Bound</span>
            ) : (
              <span className="badge badge-pending" style={{ fontSize: '11px' }}>Ready for Deployment</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span className="mono" style={{ fontSize: '12px', color: isContractConfigured ? 'var(--text-main)' : 'var(--text-dim)', background: 'var(--bg-surface)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {config.contractAddress || '0x0000000000000000000000000000000000000000'}
            </span>
            {isContractConfigured && (
              <>
                <button className="close-btn" onClick={handleCopyContract} title="Copy contract address">
                  {copiedContract ? <Check size={14} style={{ color: 'var(--color-emerald)' }} /> : <Copy size={14} />}
                </button>
                <a 
                  href={config.contractAddress ? `https://sepolia.basescan.org/address/${config.contractAddress}` : '#'} 
                  target="_blank" 
                  rel="noreferrer"
                  className="close-btn"
                  title="View Contract on Basescan"
                >
                  <ExternalLink size={14} />
                </a>
              </>
            )}
          </div>

          {/* Custom Address Input */}
          <form onSubmit={handleSaveContract} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Paste custom deployed FairShare contract address (0x...)"
              value={customAddress}
              onChange={e => setCustomAddress(e.target.value)}
              style={{ fontSize: '12px', padding: '8px 12px' }}
            />
            <button type="submit" className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
              Update
            </button>
          </form>
        </div>

        {/* Deployment Helper & Free Faucets */}
        <div style={{ padding: '14px 18px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontWeight: 700, color: 'var(--text-main)' }}>
            <Terminal size={15} style={{ color: 'var(--color-primary-light)' }} />
            <span>Deploy to Base Sepolia via CLI:</span>
          </div>
          <code className="mono" style={{ display: 'block', padding: '8px 12px', background: '#ffffff', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '12px', color: 'var(--color-primary)', marginBottom: '12px' }}>
            export PRIVATE_KEY=0x...your_key... &amp;&amp; npm run deploy:base-sepolia
          </code>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Droplets size={14} style={{ color: '#0052FF' }} />
              Need free Base Sepolia test ETH?
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a 
                href="https://coinbase.com/faucets/base-ethereum-sepolia-faucet" 
                target="_blank" 
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                <span>Coinbase Faucet</span>
                <ExternalLink size={11} />
              </a>
              <a 
                href="https://faucet.quicknode.com/base/sepolia" 
                target="_blank" 
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                <span>QuickNode Faucet</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
