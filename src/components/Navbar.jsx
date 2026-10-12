import { 
  Coins, 
  Wallet, 
  Sparkles, 
  ArrowRightLeft, 
  KeyRound, 
  User,
  Smartphone,
  HardDrive,
  Globe,
  RotateCcw,
  Cpu,
  Lock
} from 'lucide-react';
import { shortenAddress, formatCents } from '../utils/cryptoUtils';
import { blockchainService } from '../services/blockchainState';
import { ipfsService } from '../services/ipfsService';

export default function Navbar({ 
  currentAccount, 
  activePersona, 
  onClaimFaucet, 
  onConnectMetaMask,
  isMetaMaskConnected,
  syncStatus = 'LOCAL_ONLY',
  onOpenProfileModal,
  onOpenConnectDevicesModal,
  onOpenNetworkModal,
  onOpenIpfsModal,
  onOpenArchitectureModal,
  currentGroup,
  isGroupUnlocked = true,
  onLockGroup,
  onSwitchAccount,
  onResetShowcase,
}) {
  const networkMode = blockchainService.getNetworkMode();
  const isBaseSepolia = networkMode === 'base-sepolia';
  const hasPinataJwt = Boolean(ipfsService.getPinataJwt());

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="nav-brand">
          <div className="brand-icon-box">
            <ArrowRightLeft size={22} />
          </div>
          <div className="brand-text">
            <h1>
              FairShare
              <span className="brand-tag">DECENTRALIZED</span>
            </h1>
          </div>
        </div>

        {/* Right Section */}
        <div className="nav-right">
          {/* Live Sync Status */}
          <div 
            className="sync-badge-live" 
            title={
              syncStatus === 'CONNECTED'
                ? 'Multi-Device Live Sync active via WebSocket relay. Open on your phone on the same Wi-Fi to vote live!'
                : 'Multi-Tab Sync active via BroadcastChannel. Open another browser tab/window to test real-time voting.'
            }
          >
            <div 
              className="sync-dot-pulse" 
              style={{ background: syncStatus === 'CONNECTED' ? '#10b981' : '#06b6d4', boxShadow: `0 0 8px ${syncStatus === 'CONNECTED' ? '#10b981' : '#06b6d4'}` }}
            ></div>
            <span>{syncStatus === 'CONNECTED' ? 'Live Relay Sync' : 'Live Sync Active'}</span>
          </div>

          {/* Interactive Network Switcher (Sandbox vs Base Sepolia Live) */}
          <button 
            type="button"
            className="network-switcher-btn"
            onClick={onOpenNetworkModal}
            title="Switch between Local Sandbox and Live Base Sepolia Testnet"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              padding: '6px 12px',
              background: isBaseSepolia ? 'rgba(0, 82, 255, 0.12)' : 'rgba(21, 128, 61, 0.12)',
              border: isBaseSepolia ? '1px solid rgba(0, 82, 255, 0.4)' : '1px solid rgba(21, 128, 61, 0.35)',
              color: isBaseSepolia ? '#0045D8' : '#166534',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div 
              className="network-dot" 
              style={{ 
                background: isBaseSepolia ? '#0052FF' : '#10b981',
                boxShadow: isBaseSepolia ? '0 0 8px #0052FF' : '0 0 8px #10b981'
              }}
            ></div>
            <span>{isBaseSepolia ? 'Base Sepolia Live' : 'EVM Sandbox (Base)'}</span>
            <Globe size={13} style={{ opacity: 0.75, marginLeft: '2px' }} />
          </button>

          {/* IPFS Pinning Manager Button */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenIpfsModal}
            title="Configure Real IPFS File Pinning (Pinata Cloud & CIDv1)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--border-medium)',
              background: hasPinataJwt ? 'rgba(16, 185, 129, 0.12)' : 'rgba(214, 204, 194, 0.45)',
              color: hasPinataJwt ? '#065F46' : 'var(--text-main)',
              fontWeight: 700,
            }}
          >
            <HardDrive size={14} style={{ color: hasPinataJwt ? '#10B981' : '#0E7490' }} />
            <span>{hasPinataJwt ? 'IPFS: Pinata Live' : 'IPFS Pinning'}</span>
          </button>

          {/* Multi-Device Connect Button */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={onOpenConnectDevicesModal}
            title="Connect mobile phones, tablets, or other laptops via Wi-Fi to join this ledger"
            id="connect-devices-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--border-medium)',
              background: 'rgba(214, 204, 194, 0.45)',
              color: 'var(--text-main)',
              fontWeight: 700,
            }}
          >
            <Smartphone size={14} style={{ color: '#0E7490' }} />
            <span>Connect Devices</span>
          </button>

          {/* Architecture & Specs Button */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenArchitectureModal}
            title="View 4-Tier Web3 Architecture, Invariants, and Gas Benchmarks"
            id="architecture-specs-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--border-medium)',
              background: 'rgba(99, 102, 241, 0.1)',
              color: 'var(--text-main)',
              fontWeight: 700,
            }}
          >
            <Cpu size={14} style={{ color: 'var(--color-primary-light)' }} />
            <span>Architecture & Specs</span>
          </button>

          {/* Testnet Token Faucet */}
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onClaimFaucet}
            title="Mint ₹500 FSINR testnet tokens for testing instant crypto settlements"
          >
            <Coins size={14} style={{ color: 'var(--color-amber)' }} />
            <span>Faucet (+₹500 FSINR)</span>
          </button>

          {/* Quick Persona Switcher for Testing Multi-Party Perspectives */}
          {currentGroup?.members && currentGroup.members.length > 1 && (
            <div 
              className="persona-switcher" 
              title="Click any member to switch your active perspective & test their voting, PIN, and balance"
            >
              {currentGroup.members.map(m => {
                const isActive = m.address.toLowerCase() === currentAccount.toLowerCase();
                return (
                  <button
                    key={m.address}
                    type="button"
                    className={`persona-btn ${isActive ? 'active' : ''}`}
                    onClick={() => onSwitchAccount && onSwitchAccount(m.address)}
                    title={`Switch perspective to ${m.name} (${m.role}) • PIN: ${m.pin || '1234'}`}
                  >
                    <span>{m.avatar}</span>
                    <span>{m.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Lock / Unlock Toggle Button */}
          {isGroupUnlocked ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onLockGroup && onLockGroup(currentGroup?.id)}
              title="Lock this private ledger session with passkey protection"
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Lock size={13} style={{ color: 'var(--color-amber)' }} />
              <span>Lock Ledger</span>
            </button>
          ) : (
            <span className="badge badge-pending" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={12} />
              <span>Ledger Locked</span>
            </span>
          )}

          {/* Reset Demo Showcase button */}
          <button 
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onResetShowcase}
            title="Reset to fresh showcase dataset with all 5 expense combinations, settlements & consensus states"
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <RotateCcw size={13} style={{ color: 'var(--color-primary-light)' }} />
            <span>Reset Demo</span>
          </button>

          {/* Active User Device Profile Card */}
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onOpenProfileModal}
            title="Click to edit your display name, avatar, or security PIN for this device"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-surface-elevated)',
              color: 'var(--text-main)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '16px' }}>{activePersona?.avatar || '👤'}</span>
            <span style={{ fontWeight: 700 }}>{activePersona?.name || 'My Device'}</span>
            <User size={13} style={{ opacity: 0.8 }} />
          </button>

          {/* Wallet / MetaMask Connection */}
          <div className="wallet-badge">
            <Wallet size={15} style={{ color: 'var(--color-primary-light)' }} />
            <span className="mono" style={{ fontWeight: 600 }}>
              {shortenAddress(currentAccount)}
            </span>
            <span 
              className="badge" 
              style={{ 
                background: 'rgba(56, 44, 38, 0.12)', 
                color: 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
                fontSize: '11px',
                padding: '2px 8px',
                fontWeight: 700
              }}
            >
              {formatCents(activePersona?.tokenBalance || 0)} FSINR
            </span>
          </div>

          {/* Anti-Cheat Security PIN badge */}
          <div 
            className="badge badge-neutral mono" 
            style={{ 
              fontSize: '12px', 
              background: 'rgba(180, 83, 9, 0.12)', 
              border: '1px solid rgba(180, 83, 9, 0.35)', 
              color: '#92400E', 
              padding: '6px 10px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontWeight: 700
            }}
            title="Your secret cryptographic signature PIN for agreeing or rejecting expenses on shared screens"
          >
            <KeyRound size={13} />
            <span>PIN: {activePersona?.pin || '1234'}</span>
          </div>

          {!isMetaMaskConnected && (
            <button 
              className="btn btn-primary btn-sm"
              onClick={onConnectMetaMask}
              title="Connect external MetaMask extension"
            >
              <Sparkles size={14} />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
