import React, { useState, useRef, useEffect } from 'react';
import { 
  KeyRound, 
  Globe, 
  Lock, 
  ChevronDown, 
  Check, 
  Plus, 
  LogOut, 
  Settings, 
  Copy, 
  Coins, 
  Eye, 
  EyeOff, 
  Smartphone, 
  Cpu, 
  HardDrive, 
  RotateCcw, 
  Sparkles,
  ArrowRightLeft,
  Database
} from 'lucide-react';
import { shortenAddress, formatMaskedCents } from '../utils/cryptoUtils';
import { blockchainService } from '../services/blockchainState';

export default function Navbar({ 
  currentAccount, 
  activePersona, 
  currentUser,
  onLogout,
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
  onLockGroup,
  onResetShowcase,
  onOpenEnterLedgerModal,
  onOpenCreateGroup,
  isPrivacyMaskActive = false,
  onTogglePrivacyMask,
}) {
  const [isLedgerMenuOpen, setIsLedgerMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const ledgerDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  const toolsDropdownRef = useRef(null);

  const isPrivate = currentGroup?.isPrivate !== false;
  const isBaseSepolia = blockchainService.getNetworkMode() === 'base-sepolia';

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ledgerDropdownRef.current && !ledgerDropdownRef.current.contains(e.target)) {
        setIsLedgerMenuOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(e.target)) {
        setIsToolsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyAddress = (e) => {
    e.stopPropagation();
    if (currentAccount) {
      navigator.clipboard.writeText(currentAccount);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  return (
    <header className="navbar" style={{ padding: '10px 24px', background: 'rgba(255, 255, 255, 0.95)', borderBottom: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '1400px', margin: '0 auto', gap: '16px' }}>
        
        {/* LEFT: Clean Brand & Workspace Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', cursor: 'default' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)'
            }}>
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
                FairShare
              </span>
            </div>
          </div>

          {/* Group / Ledger Selector Dropdown */}
          <div style={{ position: 'relative' }} ref={ledgerDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsLedgerMenuOpen(!isLedgerMenuOpen);
                setIsUserMenuOpen(false);
                setIsToolsMenuOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '100px',
                background: isPrivate ? '#fef3c7' : '#ecfdf5',
                border: isPrivate ? '1px solid #fde68a' : '1px solid #a7f3d0',
                color: isPrivate ? '#92400e' : '#065f46',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {isPrivate ? <Lock size={13} style={{ color: '#d97706' }} /> : <Globe size={13} style={{ color: '#10b981' }} />}
              <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentGroup?.name || 'Public Ledger'}
              </span>
              <span style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '4px',
                background: isPrivate ? 'rgba(217, 119, 6, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                fontWeight: 800
              }}>
                {currentGroup?.ledgerId || (isPrivate ? 'PVT' : 'PUB-101')}
              </span>
              <ChevronDown 
                size={13} 
                style={{ 
                  transform: isLedgerMenuOpen ? 'rotate(180deg)' : 'none', 
                  transition: 'transform 0.2s ease',
                  opacity: 0.7
                }} 
              />
            </button>

            {/* Dropdown Menu */}
            {isLedgerMenuOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                width: '300px',
                zIndex: 300,
                padding: '8px',
                borderRadius: '16px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>
                  Switch Ledger
                </div>

                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
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
                          borderRadius: '8px',
                          border: 'none',
                          background: isGrpActive ? '#f1f5f9' : 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={e => { if (!isGrpActive) e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={e => { if (!isGrpActive) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isGrpPrivate ? <Lock size={12} style={{ color: '#d97706' }} /> : <Globe size={12} style={{ color: '#10b981' }} />}
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{grp.name}</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{grp.ledgerId || `ID: ${grp.id}`}</div>
                          </div>
                        </div>
                        {isGrpActive && <Check size={14} style={{ color: '#4f46e5' }} />}
                      </button>
                    );
                  })}
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '4px', paddingTop: '6px' }}>
                  {onOpenCreateGroup && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenCreateGroup();
                        setIsLedgerMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: '#4f46e5',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Plus size={14} />
                      <span>Create New Ledger</span>
                    </button>
                  )}
                  {isPrivate && onLockGroup && (
                    <button
                      type="button"
                      onClick={() => {
                        onLockGroup(currentGroup.id);
                        setIsLedgerMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: '#b45309',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fef3c7'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Lock size={14} />
                      <span>Lock Vault Session</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Clean Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* 1. Enter Private Ledger Button (Key Requirement) */}
          <button
            type="button"
            onClick={onOpenEnterLedgerModal}
            title="Enter private ledger with ID and Password"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '10px',
              border: '1px solid #f59e0b',
              background: '#fffbeb',
              color: '#b45309',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fef3c7'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fffbeb'; }}
          >
            <KeyRound size={14} style={{ color: '#d97706' }} />
            <span>Enter Private Ledger</span>
          </button>

          {/* 2. Tools & Settings Dropdown */}
          <div style={{ position: 'relative' }} ref={toolsDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsToolsMenuOpen(!isToolsMenuOpen);
                setIsUserMenuOpen(false);
                setIsLedgerMenuOpen(false);
              }}
              title="Tools, Network & Settings"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#475569',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
            >
              <Settings size={14} />
              <span>Tools</span>
              <ChevronDown size={12} style={{ opacity: 0.6 }} />
            </button>

            {/* Tools Menu Content */}
            {isToolsMenuOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '260px',
                zIndex: 300,
                padding: '8px',
                borderRadius: '16px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <div style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>
                  Platform Tools &amp; Options
                </div>

                {/* Cloud Sync Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', fontSize: '12px', color: '#334155' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                  <span>Sync: <strong>{syncStatus === 'CONNECTED' ? 'Live Cloud Sync' : 'Live Sync Active'}</strong></span>
                </div>

                {/* Connect Devices (QR) */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenConnectDevicesModal();
                    setIsToolsMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '13px',
                    color: '#1e293b',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Smartphone size={14} style={{ color: '#0ea5e9' }} />
                  <span>Connect Phone / Devices</span>
                </button>

                {/* Privacy Mask */}
                <button
                  type="button"
                  onClick={() => {
                    onTogglePrivacyMask();
                    setIsToolsMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '13px',
                    color: '#1e293b',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {isPrivacyMaskActive ? <EyeOff size={14} style={{ color: '#4f46e5' }} /> : <Eye size={14} />}
                  <span>{isPrivacyMaskActive ? 'Disable Stealth Mask' : 'Enable Privacy Mask'}</span>
                </button>

                {/* Faucet */}
                <button
                  type="button"
                  onClick={() => {
                    onClaimFaucet();
                    setIsToolsMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '13px',
                    color: '#1e293b',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Coins size={14} style={{ color: '#f59e0b' }} />
                  <span>Claim Testnet Tokens (+₹500)</span>
                </button>

                {/* Network Switcher */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenNetworkModal();
                    setIsToolsMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '13px',
                    color: '#1e293b',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Globe size={14} style={{ color: '#10b981' }} />
                  <span>Network: {isBaseSepolia ? 'Base Sepolia Live' : 'EVM Sandbox'}</span>
                </button>

                {/* IPFS Pinning */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenIpfsModal();
                    setIsToolsMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '13px',
                    color: '#1e293b',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <HardDrive size={14} style={{ color: '#0284c7' }} />
                  <span>IPFS Storage Config</span>
                </button>

                {/* Cloud Database & Backups */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenArchitectureModal('persistence');
                    setIsToolsMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '13px',
                    color: '#059669',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#ecfdf5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Database size={14} style={{ color: '#10b981' }} />
                  <span>Cloud Database &amp; Backups</span>
                </button>

                {/* Architecture & Specs */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenArchitectureModal('architecture');
                    setIsToolsMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '13px',
                    color: '#1e293b',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Cpu size={14} style={{ color: '#8b5cf6' }} />
                  <span>Architecture &amp; Specs</span>
                </button>

                {/* Connect MetaMask if not connected */}
                {!isMetaMaskConnected && (
                  <button
                    type="button"
                    onClick={() => {
                      onConnectMetaMask();
                      setIsToolsMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      fontSize: '13px',
                      color: '#4f46e5',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Sparkles size={14} />
                    <span>Connect MetaMask</span>
                  </button>
                )}

                {/* Reset Ledger */}
                <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '4px', paddingTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      onResetShowcase();
                      setIsToolsMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      fontSize: '12px',
                      color: '#64748b',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <RotateCcw size={13} />
                    <span>Reset Public Ledger Data</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. User Google Profile Card & Account Menu */}
          <div style={{ position: 'relative' }} ref={userDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsUserMenuOpen(!isUserMenuOpen);
                setIsLedgerMenuOpen(false);
                setIsToolsMenuOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 12px 5px 6px',
                borderRadius: '100px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#cbd5e1'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              {/* Avatar circle */}
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                {activePersona?.avatar || '👤'}
              </div>

              {/* Name */}
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                {activePersona?.name || 'User'}
              </span>

              {/* Google Pill */}
              <span style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '10px',
                background: 'rgba(66, 133, 244, 0.1)',
                color: '#1a73e8',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                Google
              </span>

              <ChevronDown size={12} style={{ opacity: 0.6 }} />
            </button>

            {/* User Dropdown */}
            {isUserMenuOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '280px',
                zIndex: 300,
                padding: '16px',
                borderRadius: '20px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {/* Header with avatar & email */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: '#e0e7ff',
                    color: '#4338ca',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    {activePersona?.avatar || '👤'}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                      {activePersona?.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {currentUser?.email || `${activePersona?.name?.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`}
                    </div>
                  </div>
                </div>

                {/* Account Details Box */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '12px'
                }}>
                  {/* Address */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Wallet:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="mono" style={{ fontWeight: 600, color: '#0f172a' }}>
                        {shortenAddress(currentAccount)}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyAddress}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: copiedAddress ? '#10b981' : '#94a3b8' }}
                        title="Copy address"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Token Balance */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Balance:</span>
                    <span style={{ fontWeight: 800, color: '#059669' }}>
                      {formatMaskedCents(activePersona?.tokenBalance || 0, isPrivacyMaskActive)} FSINR
                    </span>
                  </div>

                  {/* PIN */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Security PIN:</span>
                    <span className="mono" style={{ fontWeight: 800, color: '#d97706', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px' }}>
                      {activePersona?.pin || '1234'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenProfileModal();
                      setIsUserMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    Edit Profile &amp; Avatar
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onLogout) onLogout();
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #fee2e2',
                      background: '#fff1f2',
                      color: '#e11d48',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
