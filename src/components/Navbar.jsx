import React, { useState, useRef, useEffect } from 'react';
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
  Lock,
  ChevronDown,
  Check,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';
import { shortenAddress, formatMaskedCents } from '../utils/cryptoUtils';
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
  groups = [],
  onSelectGroup,
  isGroupUnlocked = true,
  onLockGroup,
  onResetShowcase,
  onOpenEnterLedgerModal,
  onOpenCreateGroup,
  isPrivacyMaskActive = false,
  onTogglePrivacyMask,
}) {
  const [isLedgerMenuOpen, setIsLedgerMenuOpen] = useState(false);
  const ledgerDropdownRef = useRef(null);

  const networkMode = blockchainService.getNetworkMode();
  const isBaseSepolia = networkMode === 'base-sepolia';
  const hasPinataJwt = Boolean(ipfsService.getPinataJwt());
  const isPrivate = currentGroup?.isPrivate !== false;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ledgerDropdownRef.current && !ledgerDropdownRef.current.contains(e.target)) {
        setIsLedgerMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Left Section: Brand & Quick-Switch Ledger Hub */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
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

          {/* Quick-Switch Ledger Hub */}
          <div style={{ position: 'relative' }} ref={ledgerDropdownRef}>
            <button
              type="button"
              onClick={() => setIsLedgerMenuOpen(!isLedgerMenuOpen)}
              className="btn btn-secondary btn-sm"
              title="Switch Active Ledger Workspace"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                background: isPrivate ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                border: isPrivate ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(16, 185, 129, 0.35)',
                color: isPrivate ? '#92400E' : '#065F46',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {isPrivate ? (
                <Lock size={13} style={{ color: '#D97706' }} />
              ) : (
                <Globe size={13} style={{ color: '#10B981' }} />
              )}
              <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentGroup?.name || 'Public Ledger'}
              </span>
              <span 
                className="mono" 
                style={{ 
                  fontSize: '10px', 
                  padding: '1px 6px', 
                  borderRadius: '4px',
                  background: isPrivate ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  fontWeight: 800
                }}
              >
                {currentGroup?.ledgerId || (isPrivate ? 'PVT' : 'PUB')}
              </span>
              <ChevronDown 
                size={13} 
                style={{ 
                  opacity: 0.7, 
                  transform: isLedgerMenuOpen ? 'rotate(180deg)' : 'none', 
                  transition: 'transform 0.2s ease' 
                }} 
              />
            </button>

            {/* Dropdown Menu */}
            {isLedgerMenuOpen && (
              <div 
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  width: '320px',
                  zIndex: 200,
                  padding: '8px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-medium)',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
                  background: 'var(--bg-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ padding: '6px 10px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-dim)', borderBottom: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
                  Available Ledger Workspaces
                </div>

                <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {groups.map(grp => {
                    const isGrpActive = Number(grp.id) === Number(currentGroup?.id);
                    const isGrpPrivate = grp.isPrivate !== false;
                    return (
                      <button
                        key={grp.id}
                        type="button"
                        onClick={() => {
                          if (onSelectGroup) onSelectGroup(grp.id);
                          setIsLedgerMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-md)',
                          border: isGrpActive ? '1px solid var(--color-primary)' : '1px solid transparent',
                          background: isGrpActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={e => { if (!isGrpActive) e.currentTarget.style.background = 'var(--bg-surface-elevated)'; }}
                        onMouseLeave={e => { if (!isGrpActive) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          {isGrpPrivate ? (
                            <Lock size={14} style={{ color: 'var(--color-amber)', flexShrink: 0 }} />
                          ) : (
                            <Globe size={14} style={{ color: 'var(--color-emerald-light)', flexShrink: 0 }} />
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: isGrpActive ? 800 : 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {grp.name}
                            </div>
                            <div className="mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                              {grp.ledgerId || `GRP-${grp.id}`} • {(grp.members || []).length} users
                            </div>
                          </div>
                        </div>

                        {isGrpActive && (
                          <Check size={14} style={{ color: 'var(--color-primary-light)', flexShrink: 0 }} />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '4px', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {onOpenEnterLedgerModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenEnterLedgerModal();
                        setIsLedgerMenuOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-amber)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <KeyRound size={13} />
                      <span>Enter Private Ledger (ID &amp; Passkey)</span>
                    </button>
                  )}

                  {onOpenCreateGroup && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenCreateGroup();
                        setIsLedgerMenuOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-primary-light)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Plus size={13} />
                      <span>Deploy New Ledger / Vault</span>
                    </button>
                  )}
                </div>
              </div>
            )}
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

          {/* Enter Private Ledger with ID & Password */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={onOpenEnterLedgerModal}
            title="Enter any private ledger using its Ledger ID and Security Password"
            id="enter-private-ledger-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              background: 'rgba(245, 158, 11, 0.08)',
              color: 'var(--text-main)',
              fontWeight: 700,
            }}
          >
            <KeyRound size={14} style={{ color: 'var(--color-amber)' }} />
            <span>Enter Private Ledger</span>
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

          {/* Stealth / Privacy Mask Mode Toggle */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onTogglePrivacyMask}
            title={isPrivacyMaskActive ? "Stealth Mask is ON: Balances are hidden. Click to reveal." : "Enable Stealth Mask: Hide sensitive rupee amounts when screen-sharing or in public."}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: isPrivacyMaskActive ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid var(--border-medium)',
              background: isPrivacyMaskActive ? 'rgba(99, 102, 241, 0.12)' : 'rgba(214, 204, 194, 0.45)',
              color: isPrivacyMaskActive ? 'var(--color-primary-light)' : 'var(--text-main)',
              fontWeight: 700,
            }}
          >
            {isPrivacyMaskActive ? <EyeOff size={14} style={{ color: 'var(--color-primary-light)' }} /> : <Eye size={14} />}
            <span>{isPrivacyMaskActive ? 'Stealth: ON' : 'Privacy Mask'}</span>
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

          {/* Public vs Private Ledger Status & Lock Control */}
          {currentGroup?.isPrivate !== false ? (
            isGroupUnlocked ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onLockGroup && onLockGroup(currentGroup?.id)}
                title="Lock this private ledger session with 2FA passkey protection"
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Lock size={13} style={{ color: 'var(--color-amber)' }} />
                <span>Lock Private Ledger</span>
              </button>
            ) : (
              <span className="badge badge-pending" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Lock size={12} />
                <span>Private Locked</span>
              </span>
            )
          ) : (
            <span 
              className="badge badge-approved" 
              style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="This is an open public ledger. Anyone can view and audit on-chain transactions without authentication."
            >
              <Globe size={12} />
              <span>Public Ledger</span>
            </span>
          )}

          {/* Reset Public Ledger button */}
          <button 
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onResetShowcase}
            title="Reset to 1 clean Public Ledger with 0 initial users"
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <RotateCcw size={13} style={{ color: 'var(--color-primary-light)' }} />
            <span>Reset Public Ledger</span>
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
            <span 
              className="badge badge-approved" 
              style={{ fontSize: '9px', padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              This Device
            </span>
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
              {formatMaskedCents(activePersona?.tokenBalance || 0, isPrivacyMaskActive)} FSINR
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
