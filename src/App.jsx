import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardOverview from './components/DashboardOverview';
import ExpenseList from './components/ExpenseList';
import AddExpenseModal from './components/AddExpenseModal';
import ExpenseDisputeModal from './components/ExpenseDisputeModal';
import ExpenseCorrectModal from './components/ExpenseCorrectModal';
import SettlementHub from './components/SettlementHub';
import AuditTrail from './components/AuditTrail';
import ReceiptVerifier from './components/ReceiptVerifier';
import GroupManagement from './components/GroupManagement';
import ConsensusHub from './components/ConsensusHub';
import SignVoteModal from './components/SignVoteModal';
import ProfileModal from './components/ProfileModal';
import ConnectDevicesModal from './components/ConnectDevicesModal';
import NetworkModal from './components/NetworkModal';
import IpfsModal from './components/IpfsModal';
import ArchitectureModal from './components/ArchitectureModal';
import PrivateGroupGate from './components/PrivateGroupGate';
import EnterLedgerModal from './components/EnterLedgerModal';
import CreateGroupModal from './components/CreateGroupModal';
import DeviceUserBanner from './components/DeviceUserBanner';
import LoginPage from './components/LoginPage';
import Toast from './components/Toast';
import confetti from 'canvas-confetti';
import { 
  LayoutDashboard, 
  Receipt, 
  ArrowRightLeft, 
  FileCheck2, 
  History, 
  Users, 
  X, 
  Fingerprint,
  BellRing,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { blockchainService } from './services/blockchainState';
import { authService } from './services/authService';
import { ipfsService } from './services/ipfsService';
import { liveSync } from './services/liveSyncService';
import { formatCents, shortenAddress } from './utils/cryptoUtils';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [currentAccount, setCurrentAccount] = useState(blockchainService.getCurrentAccount());
  const [activeTab, setActiveTab] = useState('overview'); // overview, expenses, consensus, settlements, audit, verifier, group
  const [toasts, setToasts] = useState([]);
  const [liveVerificationNotice, setLiveVerificationNotice] = useState(null);
  const [syncStatus, setSyncStatus] = useState(liveSync.getStatus());

  const addToast = (title, message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Modals state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isConnectDevicesModalOpen, setIsConnectDevicesModalOpen] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [isIpfsModalOpen, setIsIpfsModalOpen] = useState(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [disputeModalData, setDisputeModalData] = useState(null); // { expense, isResolving }
  const [correctionModalExpense, setCorrectionModalExpense] = useState(null);
  const [inspectReceiptData, setInspectReceiptData] = useState(null);
  const [signVoteModalData, setSignVoteModalData] = useState(null); // { expense, voter, initialAgreed }
  const [isEnterLedgerModalOpen, setIsEnterLedgerModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isPrivacyMaskActive, setIsPrivacyMaskActive] = useState(() => {
    try {
      return localStorage.getItem('fairshare_stealth_mask') === 'true';
    } catch {
      return false;
    }
  });

  const handleTogglePrivacyMask = () => {
    setIsPrivacyMaskActive(prev => {
      const next = !prev;
      try {
        localStorage.setItem('fairshare_stealth_mask', String(next));
      } catch {}
      addToast(
        next ? 'Stealth Privacy Mask Active' : 'Privacy Mask Disabled',
        next ? 'Masked financial figures with ₹•••••• across private views.' : 'Restored visible rupee amounts.',
        'info'
      );
      return next;
    });
  };

  // Lock theme permanently to light mode and clear any legacy dark mode preference
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    try {
      localStorage.removeItem('fairshare_theme_palette');
    } catch {}
  }, []);

  // Reactive state from service
  const [, setTick] = useState(0);

  useEffect(() => {
    // Check URL parameters for group invite (e.g. ?joinGroup=1&key=FS-4020)
    try {
      const params = new URLSearchParams(window.location.search);
      const joinGroupId = params.get('joinGroup') || params.get('join') || params.get('groupId');
      const inviteLedgerId = params.get('ledgerId') || params.get('id') || params.get('pvtLedger');
      const inviteKey = params.get('key') || params.get('code') || params.get('pvt') || params.get('passkey') || params.get('pass') || params.get('password');
      const memberDisplayName = params.get('name') || params.get('user') || params.get('member');
      if (joinGroupId || (inviteLedgerId && inviteKey)) {
        const res = blockchainService.joinGroup(joinGroupId, inviteKey, inviteLedgerId, memberDisplayName);
        if (res && res.success) {
          queueMicrotask(() => {
            addToast(
              res.isPublic ? 'Public Ledger Connected' : 'Private Ledger Unlocked',
              `Joined "${res.group.name}" successfully!`,
              'success'
            );
          });
        } else if (res && res.pending) {
          queueMicrotask(() => {
            addToast('Synchronizing Ledger', res.message || 'Connecting to host to sync private ledger...', 'info');
          });
        } else if (res && !res.success) {
          queueMicrotask(() => {
            addToast('Ledger Locked', res.error || 'Authentication required to access this ledger.', 'error');
          });
        }

        // Clean URL params after processing so refresh doesn't re-trigger join
        try {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        } catch {}
      }
    } catch (err) {
      console.warn('URL join error:', err);
    }

    // Subscribe to blockchain service state updates
    const unsubscribe = blockchainService.subscribe(() => {
      setTick(t => t + 1);
      setCurrentAccount(blockchainService.getCurrentAccount());
    });

    // Subscribe to live multi-device peer sync events
    const unsubSync = liveSync.subscribe((data) => {
      if (data.type === 'SYNC_STATUS_CHANGE') {
        setSyncStatus(data.status);
      } else if (data.type === 'EXPENSE_SUBMITTED_NOTIFICATION') {
        const exp = data.expense;
        const myAddr = blockchainService.getCurrentAccount().toLowerCase();
        const isPayer = (exp.payer || '').toLowerCase() === myAddr;
        const myShare = exp.shares && exp.shares.find(s => (s.participant || '').toLowerCase() === myAddr);

        if (myShare && !isPayer) {
          setLiveVerificationNotice({
            expense: exp,
            myShare: myShare.amount,
            actorName: data.actorName,
          });
          addToast(
            'Live Expense Verification',
            `${data.actorName} added "${exp.title}". Please verify if they made this payment!`,
            'info'
          );
        }
      } else if (data.type === 'CONSENSUS_VOTE_NOTIFICATION') {
        if (data.quorumReached) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#10b981', '#06b6d4', '#f59e0b']
          });
          addToast(
            'Consensus Block Sealed!',
            `Quorum agreed on Expense #${data.expenseId}. Ledger updated across all devices!`,
            'success'
          );
        } else if (data.blockRejected) {
          addToast(
            'Consensus Objection Recorded',
            `${data.voterName} rejected Expense #${data.expenseId}. Ledger kept frozen.`,
            'error'
          );
        }
      } else if (data.type === 'SETTLEMENT_RECORDED_NOTIFICATION') {
        const st = data.settlement;
        const myAddr = blockchainService.getCurrentAccount().toLowerCase();
        if ((st.to || '').toLowerCase() === myAddr) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#16a34a', '#10b981', '#06b6d4', '#f59e0b']
          });
          addToast(
            'Payment Received!',
            `${st.fromName} settled ${formatCents(st.amount)} to you via ${st.settlementType === 'UPI_DIRECT' ? 'Direct UPI' : 'FSINR Crypto'}!`,
            'success'
          );
        } else if ((st.from || '').toLowerCase() !== myAddr) {
          addToast(
            'Group Debt Settled',
            `${st.fromName} paid ${st.toName} ${formatCents(st.amount)}. Group ledger balanced!`,
            'info'
          );
        }
      }
    });

    const handleJoinSuccess = (e) => {
      if (e?.detail?.group) {
        addToast(
          e.detail.isPublic ? 'Public Ledger Connected' : 'Private Ledger Unlocked',
          `Joined "${e.detail.group.name}" successfully!`,
          'success'
        );
      }
    };
    window.addEventListener('fairshare_pending_join_success', handleJoinSuccess);

    return () => {
      unsubscribe();
      unsubSync();
      window.removeEventListener('fairshare_pending_join_success', handleJoinSuccess);
    };
  }, []);

  // State queries
  const groups = blockchainService.getGroups();
  const currentGroup = blockchainService.getCurrentGroup();
  const expenses = blockchainService.expenses;
  const auditLogs = blockchainService.getAuditLogs(currentGroup.id);
  const settlements = blockchainService.settlements;
  const activePersona = blockchainService.getActivePersona();
  const groupBalances = blockchainService.calculateGroupBalances(currentGroup.id);
  const myProfile = blockchainService.getMyProfile();
  const isDeviceJoined = currentGroup?.members?.some(
    m => m.address.toLowerCase() === myProfile.address.toLowerCase()
  );

  // Handlers
  const handleLoginSuccess = (user) => {
    blockchainService.setLoggedInUser(user);
    setCurrentUser(user);
    setCurrentAccount(user.address);
    addToast('Welcome to FairShare!', `Signed in as ${user.name} (${user.email || 'Google User'})`, 'success');
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.85 } });
  };

  const handleLogout = () => {
    blockchainService.logout();
    authService.logout();
    setCurrentUser(null);
    addToast('Signed Out', 'You have been signed out. Please sign in with Google to continue.', 'info');
  };

  const handleUpdateDeviceName = (newName) => {
    blockchainService.updateProfile({ name: newName });
    addToast('User Name Updated', `Changed device name to "${newName}"`, 'success');
  };

  const handleJoinAndContinue = () => {
    const joined = blockchainService.joinActiveGroupAsDeviceUser();
    if (joined) {
      addToast('Joined Public Ledger', `Added "${myProfile.name}" as verified user to the public ledger!`, 'success');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.85 } });
    }
  };

  const handleSaveProfile = (newProfileData) => {
    const updated = blockchainService.updateProfile(newProfileData);
    addToast('Profile Updated', `Device identity set to ${updated.name} (${updated.avatar})`, 'success');
  };

  const handleConnectMetaMask = async () => {
    const res = await blockchainService.connectMetaMask();
    if (res.success) {
      addToast('MetaMask Connected', `Bound wallet ${shortenAddress(res.address)} to active group`, 'success');
    } else {
      addToast('Connection Notice', res.error, 'error');
    }
  };

  const handleClaimFaucet = () => {
    blockchainService.claimFaucet();
    addToast('Faucet Tokens Received', 'Credited ₹500 FSINR testnet tokens to your wallet balance!', 'success');
  };

  const handleSelectGroup = (id) => {
    blockchainService.setCurrentGroupId(id);
    addToast('Group Switched', `Active workspace updated to Group #${id}`, 'info');
  };

  const isGroupUnlocked = blockchainService.isGroupUnlocked(currentGroup.id);

  const handleCreateGroup = (name, description, policy, creatorName, isPrivate, customLedgerId, customPassword) => {
    const newGrp = blockchainService.createGroup(name, description, policy, creatorName, isPrivate, customLedgerId, customPassword);
    addToast(
      'Smart Contract Deployed',
      newGrp.isPrivate
        ? `Created Private Ledger "${newGrp.name}" (ID: ${newGrp.ledgerId}, Pass: ${newGrp.password})`
        : `Created Public Transparency Ledger "${newGrp.name}"`,
      'success'
    );
  };

  const handleUnlockGroup = (groupId, passkey, ledgerId, memberDisplayName) => {
    const res = blockchainService.joinGroup(groupId, passkey, ledgerId, memberDisplayName);
    if (res.success) {
      addToast('Ledger Access Granted', `Device connected to "${res.group.name}"!`, 'success');
    }
    return res;
  };

  const handleEnterPrivateLedger = (ledgerId, password, memberDisplayName) => {
    const res = blockchainService.enterLedgerByCredentials(ledgerId, password, memberDisplayName);
    if (res && res.success) {
      addToast(
        'Private Ledger Unlocked',
        `Device entered "${res.group.name}" (ID: ${res.group.ledgerId})!`,
        'success'
      );
      setIsEnterLedgerModalOpen(false);
    }
    return res;
  };

  const handleLockGroup = (groupId) => {
    blockchainService.lockGroup(groupId);
    addToast('Private Ledger Locked', 'Secured ledger with passkey gate. Outsiders blocked.', 'info');
  };

  const handleAddMember = (groupId, addr, name, role) => {
    blockchainService.addMemberToGroup(groupId, addr, name, role);
    addToast('Member Registered', `Added ${name} to group roster on-chain`, 'success');
  };

  const handleSubmitExpense = (expenseData) => {
    const exp = blockchainService.submitExpense(expenseData);
    addToast('Expense Anchored', `Expense #${exp.id} "${exp.title}" recorded with receipt hash on-chain`, 'success');
  };


  const handleConfirmDispute = (expId, reason) => {
    blockchainService.disputeExpense(currentGroup.id, expId, reason);
    addToast('Dispute Raised', `Expense #${expId} flagged for arbitration. Ledger effect frozen.`, 'info');
  };

  const handleConfirmResolve = (expId, accept, notes) => {
    blockchainService.resolveDispute(currentGroup.id, expId, accept, notes);
    addToast('Dispute Arbitrated', `Administrator resolved Expense #${expId}: ${accept ? 'APPROVED' : 'REJECTED'}`, 'success');
  };

  const handleConfirmCorrection = (groupId, oldExpId, newExpenseData, reason) => {
    const newExp = blockchainService.correctExpense(groupId, oldExpId, newExpenseData, reason);
    addToast('Immutable Correction Linked', `Created Expense #${newExp.id} linking to previous #${oldExpId}`, 'success');
  };

  const handleSettleCrypto = (to, toName, amount) => {
    blockchainService.settleDebtCrypto(currentGroup.id, to, toName, amount);
    addToast('Instant Crypto Settlement', `Transferred ${formatCents(amount)} FSINR directly on-chain to ${toName}`, 'success');
  };

  const handleRecordUpiSettlement = (to, toName, amount, utrNumber, upiId) => {
    blockchainService.recordUpiSettlement(currentGroup.id, to, toName, amount, utrNumber, upiId);
    addToast('UPI Settlement Anchored On-Chain', `Verified UPI payment of ${formatCents(amount)} to ${toName} (UTR: ${utrNumber}). Proof committed to ledger!`, 'success');
  };

  const handleRecordOffChain = (to, toName, amount, ref) => {
    blockchainService.recordOffChainSettlement(currentGroup.id, to, toName, amount, ref);
    addToast('Off-Chain Settlement Proposed', `Recorded payment of ${formatCents(amount)} to ${toName}. Awaiting confirmation.`, 'info');
  };

  const handleConfirmOffChain = (settlementId) => {
    blockchainService.confirmOffChainSettlement(currentGroup.id, settlementId);
    addToast('Payment Confirmed', 'Settlement finalized on-chain and debt balance zeroed.', 'success');
  };

  const handleDisputeOffChain = (settlementId, reason) => {
    blockchainService.disputeOffChainSettlement(currentGroup.id, settlementId, reason);
    addToast('Payment Disputed', 'Recipient marked external payment as unreceived.', 'error');
  };

  const handleConfirmConsensusVote = ({ groupId, expenseId, voterAddress, pin, agreed, reason }) => {
    const exp = blockchainService.castConsensusVote({ groupId, expenseId, voterAddress, pin, agreed, reason });
    addToast(
      agreed ? 'Vote Signed & Anchored' : 'Payment Rejected',
      agreed 
        ? `Cryptographically signed agreement on Expense #${expenseId}. Consensus: ${exp.status === 1 ? 'SEALED & APPROVED' : 'PENDING QUORUM'}`
        : `Signed objection for Expense #${expenseId}. Payment rejected.`,
      agreed ? 'success' : 'error'
    );
  };

  const pendingBlocksCount = expenses.filter(e => e.groupId === currentGroup.id && e.status === 0).length;

  if (!currentUser) {
    return (
      <div className="app-container">
        <LoginPage onLoginSuccess={handleLoginSuccess} />
        <Toast toasts={toasts} onDismiss={removeToast} />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <Navbar
        currentAccount={currentAccount}
        activePersona={activePersona}
        currentUser={currentUser}
        onLogout={handleLogout}
        onClaimFaucet={handleClaimFaucet}
        onConnectMetaMask={handleConnectMetaMask}
        isMetaMaskConnected={blockchainService.isMetaMaskConnected}
        syncStatus={syncStatus}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenConnectDevicesModal={() => setIsConnectDevicesModalOpen(true)}
        onOpenNetworkModal={() => setIsNetworkModalOpen(true)}
        onOpenIpfsModal={() => setIsIpfsModalOpen(true)}
        onOpenArchitectureModal={() => setIsArchitectureModalOpen(true)}
        onOpenEnterLedgerModal={() => setIsEnterLedgerModalOpen(true)}
        currentGroup={currentGroup}
        groups={groups}
        onSelectGroup={handleSelectGroup}
        onOpenCreateGroup={() => setIsCreateGroupModalOpen(true)}
        isGroupUnlocked={isGroupUnlocked}
        onLockGroup={handleLockGroup}
        isPrivacyMaskActive={isPrivacyMaskActive}
        onTogglePrivacyMask={handleTogglePrivacyMask}
        onResetShowcase={() => {
          blockchainService.resetToDefaults();
          addToast('Public Ledger Reset', 'Initialized clean Public Ledger with this device as initial user. Ready for multi-device sync!', 'success');
        }}
      />

      <main className="main-content">
        {/* Real-time Multi-Device Verification Alert */}
        {liveVerificationNotice && (
          <div className="live-verification-alert">
            <div className="alert-content">
              <div className="alert-icon-ring">
                <BellRing size={20} />
              </div>
              <div>
                <div className="alert-title">
                  <span>Action Required: Did {liveVerificationNotice.actorName} make this payment?</span>
                  <span className="live-pill">LIVE SYNC</span>
                </div>
                <p className="alert-description">
                  Logged <strong>{liveVerificationNotice.expense.title}</strong> for total{' '}
                  <strong>{formatCents(liveVerificationNotice.expense.totalAmount)}</strong>. Your assigned share is{' '}
                  <strong style={{ color: 'var(--color-amber)', fontWeight: 800 }}>{formatCents(liveVerificationNotice.myShare)}</strong>.
                </p>
              </div>
            </div>
            <div className="alert-actions">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const voter = liveVerificationNotice.expense.votes?.find(
                    v => v.participant.toLowerCase() === currentAccount.toLowerCase()
                  ) || {
                    participant: currentAccount,
                    name: activePersona.name,
                    amount: liveVerificationNotice.myShare,
                  };
                  setSignVoteModalData({
                    expense: liveVerificationNotice.expense,
                    voter,
                    initialAgreed: true,
                  });
                  setLiveVerificationNotice(null);
                }}
              >
                <CheckCircle2 size={15} />
                <span>Agree & Sign PIN</span>
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const voter = liveVerificationNotice.expense.votes?.find(
                    v => v.participant.toLowerCase() === currentAccount.toLowerCase()
                  ) || {
                    participant: currentAccount,
                    name: activePersona.name,
                    amount: liveVerificationNotice.myShare,
                  };
                  setSignVoteModalData({
                    expense: liveVerificationNotice.expense,
                    voter,
                    initialAgreed: false,
                  });
                  setLiveVerificationNotice(null);
                }}
              >
                <XCircle size={15} />
                <span>Reject & Object</span>
              </button>
              <button
                className="btn btn-secondary btn-sm"
                style={{ opacity: 0.7 }}
                onClick={() => setLiveVerificationNotice(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Device User Identity & Google Account Banner */}
        <DeviceUserBanner
          profile={myProfile}
          currentUser={currentUser}
          isJoined={isDeviceJoined}
          onJoinAndContinue={handleJoinAndContinue}
          onUpdateName={handleUpdateDeviceName}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onSwitchAccount={handleLogout}
          memberCount={currentGroup?.members?.length || 0}
        />

        {/* Navigation Tabs Bar */}
        <div className="tabs-bar">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={16} />
            <span>Overview</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('expenses')}
          >
            <Receipt size={16} />
            <span>Expenses</span>
            <span className="tab-badge">
              {expenses.filter(e => e.groupId === currentGroup.id).length}
            </span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'consensus' ? 'active' : ''}`}
            onClick={() => setActiveTab('consensus')}
            title="Multi-party agreement blocks with anti-cheat PIN signatures"
          >
            <Fingerprint size={16} />
            <span>Consensus Blocks</span>
            <span 
              className="tab-badge" 
              style={{ 
                background: pendingBlocksCount > 0 ? 'rgba(180, 83, 9, 0.18)' : 'var(--bg-canvas)', 
                color: pendingBlocksCount > 0 ? 'var(--color-amber)' : 'inherit',
                border: pendingBlocksCount > 0 ? '1px solid rgba(180, 83, 9, 0.35)' : '1px solid var(--border-subtle)'
              }}
            >
              {pendingBlocksCount}
            </span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'settlements' ? 'active' : ''}`}
            onClick={() => setActiveTab('settlements')}
          >
            <ArrowRightLeft size={16} />
            <span>Settlement Engine</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <History size={16} />
            <span>Audit Trail</span>
            <span className="tab-badge">{auditLogs.length}</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'verifier' ? 'active' : ''}`}
            onClick={() => setActiveTab('verifier')}
          >
            <FileCheck2 size={16} />
            <span>Receipt Verifier</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'group' ? 'active' : ''}`}
            onClick={() => setActiveTab('group')}
          >
            <Users size={16} />
            <span>Group Management</span>
          </button>
        </div>

        {/* If group is locked to outsiders, display PrivateGroupGate across all views */}
        {!isGroupUnlocked ? (
          <PrivateGroupGate
            key={currentGroup?.id}
            currentGroup={currentGroup}
            groups={groups}
            onUnlock={handleUnlockGroup}
            onCreateGroup={handleCreateGroup}
            onSelectGroup={handleSelectGroup}
          />
        ) : (
          <>
            {/* Tab Content Views */}
            {activeTab === 'overview' && (
              <DashboardOverview
                currentGroup={currentGroup}
                groupBalances={groupBalances}
                expenses={expenses}
                currentAccount={currentAccount}
                onOpenAddExpense={() => setIsAddExpenseOpen(true)}
                onOpenConnectDevices={() => setIsConnectDevicesModalOpen(true)}
                onSwitchTab={setActiveTab}
                isPrivacyMaskActive={isPrivacyMaskActive}
                onLockGroup={handleLockGroup}
              />
            )}

        {activeTab === 'expenses' && (
          <ExpenseList
            expenses={expenses}
            currentGroup={currentGroup}
            currentAccount={currentAccount}
            onOpenDispute={(exp) => setDisputeModalData({ expense: exp, isResolving: false })}
            onOpenResolveDispute={(exp) => setDisputeModalData({ expense: exp, isResolving: true })}
            onOpenCorrection={(exp) => setCorrectionModalExpense(exp)}
            onInspectReceipt={(exp) => setInspectReceiptData(exp)}
            onOpenSignModal={(data) => setSignVoteModalData(data)}
          />
        )}

        {activeTab === 'consensus' && (
          <ConsensusHub
            expenses={expenses}
            currentGroup={currentGroup}
            currentAccount={currentAccount}
            onOpenSignModal={(data) => setSignVoteModalData(data)}
          />
        )}

        {activeTab === 'settlements' && (
          <SettlementHub
            currentGroup={currentGroup}
            groupBalances={groupBalances}
            settlements={settlements}
            expenses={expenses}
            currentAccount={currentAccount}
            onSettleCrypto={handleSettleCrypto}
            onRecordUpiSettlement={handleRecordUpiSettlement}
            onRecordOffChain={handleRecordOffChain}
            onConfirmOffChain={handleConfirmOffChain}
            onDisputeOffChain={handleDisputeOffChain}
            onUpdateMemberUpi={(memberAddress, upiId) => blockchainService.updateMemberUpi(currentGroup.id, memberAddress, upiId)}
          />
        )}

        {activeTab === 'audit' && (
          <AuditTrail
            auditLogs={auditLogs}
            currentGroup={currentGroup}
          />
        )}

        {activeTab === 'verifier' && (
          <ReceiptVerifier
            expenses={expenses}
            currentGroup={currentGroup}
          />
        )}

            {activeTab === 'group' && (
              <GroupManagement
                groups={groups}
                currentGroup={currentGroup}
                onSelectGroup={handleSelectGroup}
                onCreateGroup={handleCreateGroup}
                onAddMember={handleAddMember}
                onLockGroup={handleLockGroup}
                currentAccount={currentAccount}
                groupBalances={groupBalances}
                onOpenEnterLedgerModal={() => setIsEnterLedgerModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        currentGroup={currentGroup}
        currentAccount={currentAccount}
        onSubmitExpense={handleSubmitExpense}
      />

      {/* Dispute Modal (Raise or Resolve) */}
      {disputeModalData && (
        <ExpenseDisputeModal
          isOpen={Boolean(disputeModalData)}
          onClose={() => setDisputeModalData(null)}
          expense={disputeModalData.expense}
          isResolving={disputeModalData.isResolving}
          onConfirmDispute={handleConfirmDispute}
          onConfirmResolve={handleConfirmResolve}
        />
      )}

      {/* Correction Modal */}
      {correctionModalExpense && (
        <ExpenseCorrectModal
          isOpen={Boolean(correctionModalExpense)}
          onClose={() => setCorrectionModalExpense(null)}
          expense={correctionModalExpense}
          currentGroup={currentGroup}
          onConfirmCorrection={handleConfirmCorrection}
        />
      )}

      {/* Inspect Receipt Modal Dialog */}
      {inspectReceiptData && (
        <div className="modal-backdrop" onClick={() => setInspectReceiptData(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck2 size={20} style={{ color: 'var(--color-cyan)' }} />
                <span>On-Chain Receipt Cryptographic Proof</span>
              </h3>
              <button className="close-btn" onClick={() => setInspectReceiptData(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)', marginBottom: '4px' }}>
                {inspectReceiptData.title}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Total: <strong>{formatCents(inspectReceiptData.totalAmount)}</strong> • Attached by {inspectReceiptData.payerName}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>File Name:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{inspectReceiptData.receiptFileName || 'receipt.pdf'}</span>
              </div>

              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>SHA-256 Digest (Anchored to Contract):</span>
                <span className="mono" style={{ color: 'var(--color-cyan)', wordBreak: 'break-all', background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: '4px', display: 'block' }}>
                  {inspectReceiptData.receiptHash}
                </span>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>InterPlanetary File System (IPFS) CID:</span>
                  {inspectReceiptData.ipfsCid && (
                    <a
                      href={inspectReceiptData.ipfsGatewayUrl || ipfsService.getGatewayUrl(inspectReceiptData.ipfsCid)}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: '#0052FF',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        textDecoration: 'none'
                      }}
                    >
                      <span>Open on IPFS Gateway</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
                <span className="mono" style={{ color: 'var(--text-main)', wordBreak: 'break-all', background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: '4px', display: 'block' }}>
                  {inspectReceiptData.ipfsCid}
                </span>
                {inspectReceiptData.isPinnedLive && (
                  <div style={{ marginTop: '4px', fontSize: '11px', color: '#166534', fontWeight: 600 }}>
                    ⚡ Pinned live on Pinata Cloud IPFS Cluster
                  </div>
                )}
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid rgba(21, 128, 61, 0.3)', borderRadius: 'var(--radius-md)', padding: '12px', color: 'var(--color-emerald-light)', fontSize: '12px', fontWeight: 600 }}>
                ✓ <strong>Integrity Verified:</strong> This hash proves that the receipt document existed in its exact current state at transaction timestamp and has not been altered or doctored.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setInspectReceiptData(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cryptographic Consensus Signing Modal (Anti-Cheat PIN Check) */}
      {signVoteModalData && (
        <SignVoteModal
          isOpen={Boolean(signVoteModalData)}
          onClose={() => setSignVoteModalData(null)}
          expense={signVoteModalData.expense}
          voter={signVoteModalData.voter}
          initialAgreed={signVoteModalData.initialAgreed}
          onConfirmVote={handleConfirmConsensusVote}
        />
      )}

      {/* User Device Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentProfile={activePersona}
        currentUser={currentUser}
        onSaveProfile={handleSaveProfile}
        onConnectMetaMask={handleConnectMetaMask}
        isMetaMaskConnected={blockchainService.isMetaMaskConnected}
        onLogout={handleLogout}
      />

      {/* Multi-Device Connection Modal */}
      <ConnectDevicesModal
        isOpen={isConnectDevicesModalOpen}
        onClose={() => setIsConnectDevicesModalOpen(false)}
        groupId={currentGroup.id}
        groupName={currentGroup.name}
        inviteCode={currentGroup.password || currentGroup.inviteCode}
        currentGroup={currentGroup}
        activePersona={activePersona}
      />

      {/* Live Testnet Toggle & Base Sepolia Manager Modal */}
      <NetworkModal
        isOpen={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
        onNetworkSwitched={(mode) => {
          addToast(
            mode === 'base-sepolia' ? 'Base Sepolia Testnet Active' : 'Sandbox Mode Active',
            mode === 'base-sepolia' ? 'Connected to live Base Sepolia (Chain 84532)' : 'Operating in local EVM in-memory sandbox',
            'info'
          );
        }}
      />

      {/* Real IPFS Pinning & Gateways Modal */}
      <IpfsModal
        isOpen={isIpfsModalOpen}
        onClose={() => setIsIpfsModalOpen(false)}
        onConfigSaved={() => {
          addToast('IPFS Config Saved', 'Pinata API JWT and Gateway preferences updated', 'success');
        }}
      />

      {/* 4-Tier Architecture & System Specs Modal */}
      <ArchitectureModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
      />

      {/* Enter Private Ledger Modal */}
      <EnterLedgerModal
        isOpen={isEnterLedgerModalOpen}
        onClose={() => setIsEnterLedgerModalOpen(false)}
        onEnterLedger={handleEnterPrivateLedger}
        groups={groups}
      />

      {/* Deploy New Ledger / Vault Modal with Presets */}
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onCreateGroup={handleCreateGroup}
      />

      {/* Toast Notifications Container */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
