// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FairShare
 * @dev Blockchain-Based Transparent Expense Splitting System
 *
 * Implements tamper-evident group expense management, configurable approval workflows,
 * audit trails, cryptographic receipt verification, and multi-mode settlements (crypto & off-chain).
 */
contract FairShare {

    // --- ENUMS & STRUCTS ---

    enum ApprovalPolicy {
        AUTO_APPROVE,   // Optimistic: auto-approved, subject to dispute window
        MAJORITY_VOTE,  // > 50% of participants must approve
        UNANIMOUS_VOTE, // 100% of participants (excluding payer) must approve
        ADMIN_ONLY      // Only group admin can approve
    }

    enum ExpenseStatus {
        PENDING_APPROVAL,
        APPROVED,
        REJECTED,
        DISPUTED,
        CORRECTED
    }

    enum SplitType {
        EQUAL,
        EXACT,
        PERCENTAGE
    }

    enum MemberRole {
        MEMBER,
        ADMIN
    }

    enum SettlementStatus {
        PENDING_CONFIRMATION,
        CONFIRMED,
        DISPUTED
    }

    struct Member {
        address wallet;
        string name;
        MemberRole role;
        bool isActive;
        uint256 joinedAt;
    }

    struct Group {
        uint256 id;
        string name;
        string description;
        address creator;
        ApprovalPolicy approvalPolicy;
        uint256 createdAt;
        bool exists;
    }

    struct ExpenseShare {
        address participant;
        uint256 shareAmount; // In smallest currency unit (e.g. cents: $10.50 = 1050)
    }

    struct Expense {
        uint256 id;
        uint256 groupId;
        address payer;
        string title;
        uint256 totalAmount; // In smallest currency unit
        SplitType splitType;
        ExpenseStatus status;
        string receiptHash; // SHA-256 hash or IPFS CID of receipt document
        string notes;
        uint256 createdAt;
        uint256 previousExpenseId; // 0 if original, or links to corrected expense
        uint256 approvalsCount;
        uint256 rejectionsCount;
    }

    struct Settlement {
        uint256 id;
        uint256 groupId;
        address from;
        address to;
        uint256 amount;
        SettlementStatus status;
        string settlementType; // "CRYPTO_DIRECT" or "OFF_CHAIN_RECORD"
        string paymentReference; // Off-chain tx id, UPI ref, or note
        uint256 createdAt;
        uint256 confirmedAt;
    }

    // --- STATE VARIABLES ---

    uint256 public nextGroupId = 1;
    uint256 public nextExpenseId = 1;
    uint256 public nextSettlementId = 1;

    // groupId => Group
    mapping(uint256 => Group) public groups;

    // groupId => list of member addresses
    mapping(uint256 => address[]) private groupMemberAddresses;

    // groupId => member address => Member details
    mapping(uint256 => mapping(address => Member)) public groupMembers;

    // groupId => list of expense IDs
    mapping(uint256 => uint256[]) private groupExpenseIds;

    // expenseId => Expense
    mapping(uint256 => Expense) public expenses;

    // expenseId => array of ExpenseShare
    mapping(uint256 => ExpenseShare[]) private expenseShares;

    // expenseId => voter address => voted (true/false)
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // expenseId => voter address => approval (true = approved, false = rejected)
    mapping(uint256 => mapping(address => bool)) public voterDecision;

    // expenseId => voter address => objection/rejection reason
    mapping(uint256 => mapping(address => string)) public voterReason;

    // expenseId => voter address => timestamp of vote
    mapping(uint256 => mapping(address => uint256)) public voterTimestamp;

    // groupId => member address => net balance (positive = owed money, negative = owes money)
    // Amounts in cents (e.g., +1000 means member should receive $10.00, -500 means member owes $5.00)
    mapping(uint256 => mapping(address => int256)) public memberBalances;

    // groupId => list of settlement IDs
    mapping(uint256 => uint256[]) private groupSettlementIds;

    // settlementId => Settlement
    mapping(uint256 => Settlement) public settlements;

    // Optional ERC-20 token accepted for crypto settlement (address(0) for native ETH or disabled)
    address public settlementToken;

    // --- EVENTS ---

    event GroupCreated(uint256 indexed groupId, string name, address indexed creator, ApprovalPolicy policy, uint256 timestamp);
    event MemberAdded(uint256 indexed groupId, address indexed member, string name, MemberRole role, uint256 timestamp);
    event MemberRoleUpdated(uint256 indexed groupId, address indexed member, MemberRole role);
    event ExpenseSubmitted(uint256 indexed groupId, uint256 indexed expenseId, address indexed payer, string title, uint256 totalAmount, ExpenseStatus status, string receiptHash, uint256 timestamp);
    event ExpenseVoteCast(uint256 indexed groupId, uint256 indexed expenseId, address indexed voter, bool approved, uint256 timestamp);
    event ExpenseApproved(uint256 indexed groupId, uint256 indexed expenseId, uint256 timestamp);
    event ExpenseRejected(uint256 indexed groupId, uint256 indexed expenseId, string reason, uint256 timestamp);
    event ExpenseDisputed(uint256 indexed groupId, uint256 indexed expenseId, address indexed disputer, string reason, uint256 timestamp);
    event DisputeResolved(uint256 indexed groupId, uint256 indexed expenseId, bool accepted, string resolutionNotes, uint256 timestamp);
    event ExpenseCorrected(uint256 indexed groupId, uint256 indexed oldExpenseId, uint256 indexed newExpenseId, string reason, uint256 timestamp);
    event SettlementProposed(uint256 indexed groupId, uint256 indexed settlementId, address indexed from, address to, uint256 amount, string settlementType, string paymentRef, uint256 timestamp);
    event SettlementConfirmed(uint256 indexed groupId, uint256 indexed settlementId, address indexed from, address to, uint256 amount, uint256 timestamp);
    event SettlementDisputed(uint256 indexed groupId, uint256 indexed settlementId, address indexed disputer, string reason, uint256 timestamp);

    // --- MODIFIERS ---

    modifier groupExists(uint256 _groupId) {
        require(groups[_groupId].exists, "FairShare: Group does not exist");
        _;
    }

    modifier onlyGroupMember(uint256 _groupId) {
        require(groupMembers[_groupId][msg.sender].isActive, "FairShare: Caller is not an active group member");
        _;
    }

    modifier onlyGroupAdmin(uint256 _groupId) {
        require(
            groupMembers[_groupId][msg.sender].isActive && 
            groupMembers[_groupId][msg.sender].role == MemberRole.ADMIN,
            "FairShare: Caller is not a group admin"
        );
        _;
    }

    // --- REENTRANCY GUARD ---
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    modifier nonReentrant() {
        require(_status != _ENTERED, "FairShare: ReentrancyGuard reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    constructor() {
        _status = _NOT_ENTERED;
    }

    // --- GROUP MANAGEMENT ---

    /**
     * @notice Create a new expense-sharing group
     */
    function createGroup(
        string calldata _name,
        string calldata _description,
        ApprovalPolicy _approvalPolicy,
        string calldata _creatorName
    ) external returns (uint256) {
        require(bytes(_name).length > 0, "FairShare: Group name required");

        uint256 groupId = nextGroupId++;
        groups[groupId] = Group({
            id: groupId,
            name: _name,
            description: _description,
            creator: msg.sender,
            approvalPolicy: _approvalPolicy,
            createdAt: block.timestamp,
            exists: true
        });

        // Add creator as Admin
        groupMembers[groupId][msg.sender] = Member({
            wallet: msg.sender,
            name: bytes(_creatorName).length > 0 ? _creatorName : "Creator",
            role: MemberRole.ADMIN,
            isActive: true,
            joinedAt: block.timestamp
        });
        groupMemberAddresses[groupId].push(msg.sender);

        emit GroupCreated(groupId, _name, msg.sender, _approvalPolicy, block.timestamp);
        emit MemberAdded(groupId, msg.sender, _creatorName, MemberRole.ADMIN, block.timestamp);

        return groupId;
    }

    /**
     * @notice Add a new member to an existing group
     */
    function addMember(
        uint256 _groupId,
        address _member,
        string calldata _name,
        MemberRole _role
    ) external groupExists(_groupId) onlyGroupAdmin(_groupId) {
        require(_member != address(0), "FairShare: Invalid member address");
        require(!groupMembers[_groupId][_member].isActive, "FairShare: Member already active in group");

        groupMembers[_groupId][_member] = Member({
            wallet: _member,
            name: _name,
            role: _role,
            isActive: true,
            joinedAt: block.timestamp
        });
        groupMemberAddresses[_groupId].push(_member);

        emit MemberAdded(_groupId, _member, _name, _role, block.timestamp);
    }

    /**
     * @notice Update member role (e.g. promote to Admin or demote)
     */
    function setMemberRole(
        uint256 _groupId,
        address _member,
        MemberRole _role
    ) external groupExists(_groupId) onlyGroupAdmin(_groupId) {
        require(groupMembers[_groupId][_member].isActive, "FairShare: Member not active");
        groupMembers[_groupId][_member].role = _role;
        emit MemberRoleUpdated(_groupId, _member, _role);
    }

    // --- EXPENSE MANAGEMENT ---

    /**
     * @notice Submit a new expense to the group
     */
    function submitExpense(
        uint256 _groupId,
        string calldata _title,
        uint256 _totalAmount,
        SplitType _splitType,
        address[] calldata _participants,
        uint256[] calldata _shares,
        string calldata _receiptHash,
        string calldata _notes
    ) external groupExists(_groupId) onlyGroupMember(_groupId) returns (uint256) {
        return _createExpenseInternal(
            _groupId,
            _title,
            _totalAmount,
            _splitType,
            _participants,
            _shares,
            _receiptHash,
            _notes,
            0 // Original expense
        );
    }

    /**
     * @notice Correct an existing expense while preserving audit trail
     */
    function correctExpense(
        uint256 _groupId,
        uint256 _oldExpenseId,
        string calldata _title,
        uint256 _totalAmount,
        SplitType _splitType,
        address[] calldata _participants,
        uint256[] calldata _shares,
        string calldata _receiptHash,
        string calldata _reason
    ) external groupExists(_groupId) onlyGroupMember(_groupId) returns (uint256) {
        Expense storage oldExp = expenses[_oldExpenseId];
        require(oldExp.groupId == _groupId, "FairShare: Expense not in this group");
        require(
            oldExp.payer == msg.sender || groupMembers[_groupId][msg.sender].role == MemberRole.ADMIN,
            "FairShare: Only payer or admin can correct expense"
        );
        require(oldExp.status != ExpenseStatus.CORRECTED, "FairShare: Expense already corrected");

        // Roll back old balances if old expense was approved
        if (oldExp.status == ExpenseStatus.APPROVED) {
            _reverseExpenseBalances(_oldExpenseId);
        }

        oldExp.status = ExpenseStatus.CORRECTED;

        uint256 newExpenseId = _createExpenseInternal(
            _groupId,
            _title,
            _totalAmount,
            _splitType,
            _participants,
            _shares,
            _receiptHash,
            _reason,
            _oldExpenseId
        );

        emit ExpenseCorrected(_groupId, _oldExpenseId, newExpenseId, _reason, block.timestamp);
        return newExpenseId;
    }

    function _createExpenseInternal(
        uint256 _groupId,
        string calldata _title,
        uint256 _totalAmount,
        SplitType _splitType,
        address[] calldata _participants,
        uint256[] calldata _shares,
        string calldata _receiptHash,
        string calldata _notes,
        uint256 _previousExpenseId
    ) internal returns (uint256) {
        require(bytes(_title).length > 0, "FairShare: Title required");
        require(_totalAmount > 0, "FairShare: Amount must be > 0");
        require(_participants.length > 0, "FairShare: At least one participant required");
        require(_participants.length == _shares.length, "FairShare: Participants and shares mismatch");

        // Validate shares sum equals totalAmount
        uint256 sumShares = 0;
        for (uint256 i = 0; i < _shares.length; i++) {
            require(groupMembers[_groupId][_participants[i]].isActive, "FairShare: Participant not in group");
            sumShares += _shares[i];
        }
        require(sumShares == _totalAmount, "FairShare: Sum of shares must equal total amount");

        uint256 expenseId = nextExpenseId++;
        Group storage grp = groups[_groupId];

        ExpenseStatus initialStatus = ExpenseStatus.PENDING_APPROVAL;
        if (grp.approvalPolicy == ApprovalPolicy.AUTO_APPROVE) {
            initialStatus = ExpenseStatus.APPROVED;
        }

        expenses[expenseId] = Expense({
            id: expenseId,
            groupId: _groupId,
            payer: msg.sender,
            title: _title,
            totalAmount: _totalAmount,
            splitType: _splitType,
            status: initialStatus,
            receiptHash: _receiptHash,
            notes: _notes,
            createdAt: block.timestamp,
            previousExpenseId: _previousExpenseId,
            approvalsCount: 1, // Payer implicitly approves
            rejectionsCount: 0
        });

        // Store shares
        for (uint256 i = 0; i < _participants.length; i++) {
            expenseShares[expenseId].push(ExpenseShare({
                participant: _participants[i],
                shareAmount: _shares[i]
            }));
        }

        groupExpenseIds[_groupId].push(expenseId);
        hasVoted[expenseId][msg.sender] = true;
        voterDecision[expenseId][msg.sender] = true;

        emit ExpenseSubmitted(_groupId, expenseId, msg.sender, _title, _totalAmount, initialStatus, _receiptHash, block.timestamp);

        // If auto-approved, immediately apply to balance sheet
        if (initialStatus == ExpenseStatus.APPROVED) {
            _applyExpenseBalances(expenseId);
            emit ExpenseApproved(_groupId, expenseId, block.timestamp);
        }

        return expenseId;
    }

    // --- APPROVAL & DISPUTE WORKFLOW ---

    /**
     * @notice Vote to approve an expense
     */
    function approveExpense(uint256 _groupId, uint256 _expenseId) external groupExists(_groupId) onlyGroupMember(_groupId) {
        Expense storage exp = expenses[_expenseId];
        require(exp.groupId == _groupId, "FairShare: Expense not in this group");
        require(exp.status == ExpenseStatus.PENDING_APPROVAL, "FairShare: Expense not pending approval");
        require(!hasVoted[_expenseId][msg.sender], "FairShare: Caller already voted on this expense");

        hasVoted[_expenseId][msg.sender] = true;
        voterDecision[_expenseId][msg.sender] = true;
        voterTimestamp[_expenseId][msg.sender] = block.timestamp;
        exp.approvalsCount++;

        emit ExpenseVoteCast(_groupId, _expenseId, msg.sender, true, block.timestamp);

        // Check if approval condition met
        if (_checkApprovalMet(_groupId, _expenseId)) {
            exp.status = ExpenseStatus.APPROVED;
            _applyExpenseBalances(_expenseId);
            emit ExpenseApproved(_groupId, _expenseId, block.timestamp);
        }
    }

    /**
     * @notice Vote to reject an expense
     */
    function rejectExpense(
        uint256 _groupId,
        uint256 _expenseId,
        string calldata _reason
    ) external groupExists(_groupId) onlyGroupMember(_groupId) {
        Expense storage exp = expenses[_expenseId];
        require(exp.groupId == _groupId, "FairShare: Expense not in this group");
        require(exp.status == ExpenseStatus.PENDING_APPROVAL, "FairShare: Expense not pending approval");
        require(!hasVoted[_expenseId][msg.sender], "FairShare: Caller already voted on this expense");

        hasVoted[_expenseId][msg.sender] = true;
        voterDecision[_expenseId][msg.sender] = false;
        voterReason[_expenseId][msg.sender] = _reason;
        voterTimestamp[_expenseId][msg.sender] = block.timestamp;
        exp.rejectionsCount++;

        emit ExpenseVoteCast(_groupId, _expenseId, msg.sender, false, block.timestamp);

        // Check rejection condition
        Group storage grp = groups[_groupId];
        if (grp.approvalPolicy == ApprovalPolicy.ADMIN_ONLY && groupMembers[_groupId][msg.sender].role == MemberRole.ADMIN) {
            exp.status = ExpenseStatus.REJECTED;
            emit ExpenseRejected(_groupId, _expenseId, _reason, block.timestamp);
        } else if (grp.approvalPolicy == ApprovalPolicy.UNANIMOUS_VOTE) {
            // Any rejection rejects in unanimous mode
            exp.status = ExpenseStatus.REJECTED;
            emit ExpenseRejected(_groupId, _expenseId, _reason, block.timestamp);
        } else if (grp.approvalPolicy == ApprovalPolicy.MAJORITY_VOTE) {
            uint256 totalNeeded = expenseShares[_expenseId].length;
            if (exp.rejectionsCount > totalNeeded / 2) {
                exp.status = ExpenseStatus.REJECTED;
                emit ExpenseRejected(_groupId, _expenseId, _reason, block.timestamp);
            }
        }
    }

    /**
     * @notice Flag an expense as disputed
     */
    function disputeExpense(
        uint256 _groupId,
        uint256 _expenseId,
        string calldata _reason
    ) external groupExists(_groupId) onlyGroupMember(_groupId) {
        Expense storage exp = expenses[_expenseId];
        require(exp.groupId == _groupId, "FairShare: Expense not in this group");
        require(exp.status == ExpenseStatus.APPROVED || exp.status == ExpenseStatus.PENDING_APPROVAL, "FairShare: Cannot dispute in current status");

        // If previously approved, reverse balances while disputed
        if (exp.status == ExpenseStatus.APPROVED) {
            _reverseExpenseBalances(_expenseId);
        }

        exp.status = ExpenseStatus.DISPUTED;
        emit ExpenseDisputed(_groupId, _expenseId, msg.sender, _reason, block.timestamp);
    }

    /**
     * @notice Admin resolves dispute
     */
    function resolveDispute(
        uint256 _groupId,
        uint256 _expenseId,
        bool _acceptExpense,
        string calldata _resolutionNotes
    ) external groupExists(_groupId) onlyGroupAdmin(_groupId) {
        Expense storage exp = expenses[_expenseId];
        require(exp.groupId == _groupId, "FairShare: Expense not in this group");
        require(exp.status == ExpenseStatus.DISPUTED, "FairShare: Expense is not disputed");

        if (_acceptExpense) {
            exp.status = ExpenseStatus.APPROVED;
            _applyExpenseBalances(_expenseId);
            emit DisputeResolved(_groupId, _expenseId, true, _resolutionNotes, block.timestamp);
            emit ExpenseApproved(_groupId, _expenseId, block.timestamp);
        } else {
            exp.status = ExpenseStatus.REJECTED;
            emit DisputeResolved(_groupId, _expenseId, false, _resolutionNotes, block.timestamp);
            emit ExpenseRejected(_groupId, _expenseId, _resolutionNotes, block.timestamp);
        }
    }

    function _checkApprovalMet(uint256 _groupId, uint256 _expenseId) internal view returns (bool) {
        Group storage grp = groups[_groupId];
        Expense storage exp = expenses[_expenseId];

        if (grp.approvalPolicy == ApprovalPolicy.ADMIN_ONLY) {
            return (groupMembers[_groupId][msg.sender].role == MemberRole.ADMIN);
        }

        uint256 totalParticipants = expenseShares[_expenseId].length;

        if (grp.approvalPolicy == ApprovalPolicy.UNANIMOUS_VOTE) {
            return (exp.approvalsCount >= totalParticipants);
        }

        if (grp.approvalPolicy == ApprovalPolicy.MAJORITY_VOTE) {
            return (exp.approvalsCount > (totalParticipants / 2));
        }

        return true;
    }

    // --- INTERNAL LEDGER BALANCE MATH ---

    function _applyExpenseBalances(uint256 _expenseId) internal {
        Expense storage exp = expenses[_expenseId];
        uint256 groupId = exp.groupId;
        address payer = exp.payer;
        ExpenseShare[] storage shares = expenseShares[_expenseId];

        for (uint256 i = 0; i < shares.length; i++) {
            address participant = shares[i].participant;
            uint256 amount = shares[i].shareAmount;

            if (participant != payer) {
                // Participant owes payer 'amount'
                // Participant balance decreases
                memberBalances[groupId][participant] -= int256(amount);
                // Payer balance increases
                memberBalances[groupId][payer] += int256(amount);
            }
        }
    }

    function _reverseExpenseBalances(uint256 _expenseId) internal {
        Expense storage exp = expenses[_expenseId];
        uint256 groupId = exp.groupId;
        address payer = exp.payer;
        ExpenseShare[] storage shares = expenseShares[_expenseId];

        for (uint256 i = 0; i < shares.length; i++) {
            address participant = shares[i].participant;
            uint256 amount = shares[i].shareAmount;

            if (participant != payer) {
                // Undo: participant gets +amount, payer gets -amount
                memberBalances[groupId][participant] += int256(amount);
                memberBalances[groupId][payer] -= int256(amount);
            }
        }
    }

    // --- SETTLEMENT MANAGEMENT ---

    /**
     * @notice Settle debt directly on-chain using native currency (ETH/Matic)
     */
    function settleDebtNative(
        uint256 _groupId,
        address payable _to
    ) external payable groupExists(_groupId) onlyGroupMember(_groupId) nonReentrant {
        require(msg.value > 0, "FairShare: Settlement amount must be > 0");
        require(_to != address(0) && _to != msg.sender, "FairShare: Invalid recipient");
        require(groupMembers[_groupId][_to].isActive, "FairShare: Recipient not in group");

        uint256 amountInCents = msg.value / 1e14; // e.g. 0.0001 ETH = 1 cent
        if (amountInCents == 0) amountInCents = 1;

        // 1. Effects: update accounting state first (Checks-Effects-Interactions)
        _processSettlementAccounting(_groupId, msg.sender, _to, amountInCents, "CRYPTO_NATIVE", "ETH_TRANSFER");

        // 2. Interaction: forward native funds to recipient after state update
        (bool success, ) = _to.call{value: msg.value}("");
        require(success, "FairShare: Native transfer failed");
    }

    /**
     * @notice Record an on-chain instant settlement (used by frontend with mock token or simulated execution)
     */
    function settleDebtDirect(
        uint256 _groupId,
        address _to,
        uint256 _amountInCents,
        string calldata _txReference
    ) external groupExists(_groupId) onlyGroupMember(_groupId) {
        require(_amountInCents > 0, "FairShare: Amount must be > 0");
        require(_to != address(0) && _to != msg.sender, "FairShare: Invalid recipient");
        require(groupMembers[_groupId][_to].isActive, "FairShare: Recipient not in group");

        _processSettlementAccounting(_groupId, msg.sender, _to, _amountInCents, "CRYPTO_DIRECT", _txReference);
    }

    /**
     * @notice Record an off-chain settlement (Cash, Venmo, UPI, Bank Transfer)
     */
    function recordOffChainSettlement(
        uint256 _groupId,
        address _to,
        uint256 _amountInCents,
        string calldata _paymentRef
    ) external groupExists(_groupId) onlyGroupMember(_groupId) returns (uint256) {
        require(_amountInCents > 0, "FairShare: Amount must be > 0");
        require(_to != address(0) && _to != msg.sender, "FairShare: Invalid recipient");
        require(groupMembers[_groupId][_to].isActive, "FairShare: Recipient not in group");

        uint256 settlementId = nextSettlementId++;
        settlements[settlementId] = Settlement({
            id: settlementId,
            groupId: _groupId,
            from: msg.sender,
            to: _to,
            amount: _amountInCents,
            status: SettlementStatus.PENDING_CONFIRMATION,
            settlementType: "OFF_CHAIN_RECORD",
            paymentReference: _paymentRef,
            createdAt: block.timestamp,
            confirmedAt: 0
        });

        groupSettlementIds[_groupId].push(settlementId);

        emit SettlementProposed(_groupId, settlementId, msg.sender, _to, _amountInCents, "OFF_CHAIN_RECORD", _paymentRef, block.timestamp);
        return settlementId;
    }

    /**
     * @notice Recipient confirms an off-chain settlement was received
     */
    function confirmOffChainSettlement(
        uint256 _groupId,
        uint256 _settlementId
    ) external groupExists(_groupId) onlyGroupMember(_groupId) {
        Settlement storage st = settlements[_settlementId];
        require(st.groupId == _groupId, "FairShare: Settlement not in this group");
        require(st.to == msg.sender, "FairShare: Only designated recipient can confirm");
        require(st.status == SettlementStatus.PENDING_CONFIRMATION, "FairShare: Settlement not pending confirmation");

        st.status = SettlementStatus.CONFIRMED;
        st.confirmedAt = block.timestamp;

        // Apply ledger adjustment
        memberBalances[_groupId][st.from] += int256(st.amount);
        memberBalances[_groupId][st.to] -= int256(st.amount);

        emit SettlementConfirmed(_groupId, _settlementId, st.from, st.to, st.amount, block.timestamp);
    }

    /**
     * @notice Recipient disputes an off-chain settlement claim
     */
    function disputeOffChainSettlement(
        uint256 _groupId,
        uint256 _settlementId,
        string calldata _reason
    ) external groupExists(_groupId) onlyGroupMember(_groupId) {
        Settlement storage st = settlements[_settlementId];
        require(st.groupId == _groupId, "FairShare: Settlement not in this group");
        require(st.to == msg.sender, "FairShare: Only recipient can dispute settlement claim");
        require(st.status == SettlementStatus.PENDING_CONFIRMATION, "FairShare: Not in pending status");

        st.status = SettlementStatus.DISPUTED;
        emit SettlementDisputed(_groupId, _settlementId, msg.sender, _reason, block.timestamp);
    }

    function _processSettlementAccounting(
        uint256 _groupId,
        address _from,
        address _to,
        uint256 _amount,
        string memory _settleType,
        string memory _ref
    ) internal {
        uint256 settlementId = nextSettlementId++;
        settlements[settlementId] = Settlement({
            id: settlementId,
            groupId: _groupId,
            from: _from,
            to: _to,
            amount: _amount,
            status: SettlementStatus.CONFIRMED,
            settlementType: _settleType,
            paymentReference: _ref,
            createdAt: block.timestamp,
            confirmedAt: block.timestamp
        });

        groupSettlementIds[_groupId].push(settlementId);

        // Update balance sheet:
        // Debtor (_from) paid, so balance increases towards 0
        memberBalances[_groupId][_from] += int256(_amount);
        // Creditor (_to) received, so balance decreases towards 0
        memberBalances[_groupId][_to] -= int256(_amount);

        emit SettlementProposed(_groupId, settlementId, _from, _to, _amount, _settleType, _ref, block.timestamp);
        emit SettlementConfirmed(_groupId, settlementId, _from, _to, _amount, block.timestamp);
    }

    // --- GETTERS & VIEW FUNCTIONS ---

    function getGroup(uint256 _groupId) external view returns (
        uint256 id,
        string memory name,
        string memory description,
        address creator,
        ApprovalPolicy approvalPolicy,
        uint256 createdAt,
        uint256 memberCount,
        uint256 expenseCount
    ) {
        Group storage grp = groups[_groupId];
        return (
            grp.id,
            grp.name,
            grp.description,
            grp.creator,
            grp.approvalPolicy,
            grp.createdAt,
            groupMemberAddresses[_groupId].length,
            groupExpenseIds[_groupId].length
        );
    }

    function getGroupMembers(uint256 _groupId) external view returns (Member[] memory) {
        address[] storage addrs = groupMemberAddresses[_groupId];
        Member[] memory mems = new Member[](addrs.length);
        for (uint256 i = 0; i < addrs.length; i++) {
            mems[i] = groupMembers[_groupId][addrs[i]];
        }
        return mems;
    }

    function getGroupMemberAddresses(uint256 _groupId) external view returns (address[] memory) {
        return groupMemberAddresses[_groupId];
    }

    function getGroupExpenses(uint256 _groupId) external view returns (uint256[] memory) {
        return groupExpenseIds[_groupId];
    }

    function getExpenseShares(uint256 _expenseId) external view returns (ExpenseShare[] memory) {
        return expenseShares[_expenseId];
    }

    function getGroupSettlements(uint256 _groupId) external view returns (uint256[] memory) {
        return groupSettlementIds[_groupId];
    }

    function getMemberBalance(uint256 _groupId, address _member) external view returns (int256) {
        return memberBalances[_groupId][_member];
    }

    function getAllMemberBalances(uint256 _groupId) external view returns (address[] memory members, int256[] memory balances) {
        address[] storage addrs = groupMemberAddresses[_groupId];
        int256[] memory bals = new int256[](addrs.length);
        for (uint256 i = 0; i < addrs.length; i++) {
            bals[i] = memberBalances[_groupId][addrs[i]];
        }
        return (addrs, bals);
    }

    function getExpenseVoteDetails(uint256 _expenseId, address _voter) external view returns (bool voted, bool agreed, string memory reason, uint256 timestamp) {
        return (
            hasVoted[_expenseId][_voter],
            voterDecision[_expenseId][_voter],
            voterReason[_expenseId][_voter],
            voterTimestamp[_expenseId][_voter]
        );
    }
}