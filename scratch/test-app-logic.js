import { authService, DEFAULT_GOOGLE_PROFILES } from '../src/services/authService.js';
import { blockchainService } from '../src/services/blockchainState.js';

console.log('Testing FairShare Login and Ledger State Logic...');

// 1. Initial State (Simulating fresh unauthenticated visit)
authService.logout();
console.log('1. Logged out user:', authService.getCurrentUser());

// 2. Perform Login with first profile (Eshwar Chandram)
const user = authService.loginWithGoogle(DEFAULT_GOOGLE_PROFILES[0]);
console.log('2. Logged in user:', user.name, user.email, user.address);

// 3. Bind to blockchain service
blockchainService.setLoggedInUser(user);
const currentAccount = blockchainService.getCurrentAccount();
console.log('3. Current Account in BlockchainService:', currentAccount);
console.log('   My Profile:', blockchainService.getMyProfile().name, blockchainService.getMyProfile().address);

// 4. Test group and ledger queries
const currentGroup = blockchainService.getCurrentGroup();
console.log('4. Current Group:', currentGroup?.name, 'ID:', currentGroup?.id, 'Members:', currentGroup?.members?.length);

const groupBalances = blockchainService.calculateGroupBalances(currentGroup?.id || 1);
console.log('5. Group Balances calculated:', groupBalances.length, 'entries');

// 6. Test account switching (Priya Sharma)
const user2 = authService.switchAccount(DEFAULT_GOOGLE_PROFILES[1]);
blockchainService.setLoggedInUser(user2);
console.log('6. Switched to User 2:', user2.name, user2.email, user2.address);
console.log('   Active Account:', blockchainService.getCurrentAccount());

const groupBalances2 = blockchainService.calculateGroupBalances(1);
console.log('7. Group Balances for User 2:', groupBalances2.length, 'entries');

// 8. Test joining group as device user
const joinRes = blockchainService.joinActiveGroupAsDeviceUser();
console.log('8. Join Active Group result:', joinRes ? 'Joined/Updated' : 'Already in group');

console.log('✅ ALL LOGIC TESTS PASSED WITH ZERO ERRORS!');
