# v1.7.1 - Critical Bug Fix

## 🐛 Bug Fixes

**Fixed critical nonce collision causing ~83% transaction failure rate**

### Problem
When sending multiple transactions sequentially, all transactions were using the same nonce value due to auto-nonce (`nonce: -1`) querying the account state before any transactions were confirmed on-chain.

### Impact
In production testing with Kusama AssetHub:
- Run 1: 1 succeeded, 5 failed (17% success rate)
- Run 2: 1 succeeded, 4 failed (20% success rate)
- Run 3: 1 succeeded, 3 failed (25% success rate)

Errors encountered:
- `1014: Priority is too low (6 vs 6)` - Same nonce, same priority
- `1010: Invalid Transaction: Bad signature` - Stale nonce causing signature verification failure

### Solution
Implemented manual nonce management in `src/services.ts:473-530`:
1. Query account nonce once at the start
2. Use explicit nonce for each transaction
3. Increment nonce after each transaction (success or failure)

### Result
After fix with `max-calls=2`:
- **2 succeeded, 0 failed (100% success rate)** ✅
- Each transaction gets unique, sequential nonce
- No more nonce collisions or priority errors

## 📊 Testing Results

| Test Run | Before Fix | After Fix |
|----------|------------|-----------|
| Kusama (max-calls=1) | 1/6 = 17% | - |
| Kusama (max-calls=2) | - | 2/2 = 100% ✅ |
| Polkadot (max-calls=3) | 100% (batched) | 100% ✅ |

## 🔧 Technical Details

**Root Cause:**
```typescript
// OLD CODE (BROKEN)
for (const tx of txs) {
  await tx.signAndSend(signingKeys, { nonce: -1 });
  // All txs get same nonce!
}
```

**Fix:**
```typescript
// NEW CODE (FIXED)
let currentNonce = (await api.rpc.system.accountNextIndex(signingKeys.address)).toNumber();

for (const tx of txs) {
  await tx.signAndSend(signingKeys, { nonce: currentNonce });
  currentNonce++; // Unique nonce for each tx
}
```

## 📦 Upgrade Notes

No configuration changes required. This is a drop-in bug fix that improves transaction reliability, especially when using `max-calls=1` or `max-calls=2`.

## 🙏 Acknowledgments

Bug discovered through production testing on Kusama AssetHub with real validator payouts.

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
