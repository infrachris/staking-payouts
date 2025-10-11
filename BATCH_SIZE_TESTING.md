# Batch Size Testing Guide

## Overview

This guide helps you find the optimal `--max-calls` value for different RPC endpoints and chains.

## Current Known Limits

### Kusama AssetHub
- **IBP AssetHub**: Testing needed (suspected: 1-3 calls)
- **Polkadot.io AssetHub**: Testing needed (suspected: 1-3 calls)
- **Historical (pre-AssetHub)**: Could handle larger batches (5-10+)

### Test Strategy

Test incrementally with **read-only `ls` commands first**, then proceed to actual collections.

## Safe Testing Protocol

### Phase 1: List Payouts (Read-Only)

Test different batch sizes to see what can be listed without errors:

```bash
# Current working directory
cd ~/payout-dev

# Test with IBP AssetHub (preferred)
IBP_ASSET="wss://sys.ibp.network:443/asset-hub-kusama"

# List with various depths (read-only, safe to test)
node build/index.js ls -e 10 --stop 2 -w $IBP_ASSET --stashesFile ./test/kusama-stashes.json
node build/index.js ls -e 25 --stop 2 -w $IBP_ASSET --stashesFile ./test/kusama-stashes.json
node build/index.js ls -e 50 --stop 2 -w $IBP_ASSET --stashesFile ./test/kusama-stashes.json
```

### Phase 2: Test Batch Sizes (When Payouts Exist)

**IMPORTANT**: Only proceed when you have confirmed unclaimed payouts from Phase 1.

#### Test 1: Single Call Per Batch (Safest)
```bash
node build/index.js collect -e 5 --stop 2 --max-calls 1 \
  -w $IBP_ASSET \
  --stashesFile ./test/kusama-stashes.json \
  --suriFile ./test/KSM-GOVSCRPTPROXY-00.key
```

**Expected**:
- 5 eras × N stashes = N×5 total transactions
- Very slow but guaranteed to work

#### Test 2: Three Calls Per Batch (Default)
```bash
node build/index.js collect -e 5 --stop 2 --max-calls 3 \
  -w $IBP_ASSET \
  --stashesFile ./test/kusama-stashes.json \
  --suriFile ./test/KSM-GOVSCRPTPROXY-00.key
```

**Expected**:
- Should batch 3 calls per transaction
- May fail on AssetHub with multiple stashes

#### Test 3: Five Calls Per Batch (Optimistic)
```bash
node build/index.js collect -e 5 --stop 2 --max-calls 5 \
  -w $IBP_ASSET \
  --stashesFile ./test/kusama-stashes.json \
  --suriFile ./test/KSM-GOVSCRPTPROXY-00.key
```

**Expected**:
- Likely to fail on AssetHub
- Record the error message

### Phase 3: Compare RPC Endpoints

Test the same batch size on different endpoints:

```bash
# IBP AssetHub
node build/index.js collect -e 5 --stop 2 --max-calls 2 \
  -w wss://sys.ibp.network:443/asset-hub-kusama \
  --stashesFile ./test/kusama-stashes.json \
  --suriFile ./test/KSM-GOVSCRPTPROXY-00.key

# Polkadot.io AssetHub
node build/index.js collect -e 5 --stop 2 --max-calls 2 \
  -w wss://kusama-asset-hub-rpc.polkadot.io/public \
  --stashesFile ./test/kusama-stashes.json \
  --suriFile ./test/KSM-GOVSCRPTPROXY-00.key
```

## Recording Results

Create a test log:

```bash
echo "# Batch Size Test Results - $(date)" >> ~/payout-dev/test/batch-test-results.txt
echo "" >> ~/payout-dev/test/batch-test-results.txt
```

For each test, record:
1. RPC endpoint used
2. `--max-calls` value
3. Number of stashes
4. Number of eras tested
5. Result (success/failure)
6. Error message (if failed)
7. Transaction hashes (if successful)

Example:
```
Date: 2025-10-10
RPC: wss://sys.ibp.network:443/asset-hub-kusama
Max Calls: 3
Stashes: 2
Eras: 5
Result: FAILED
Error: Transaction too large / Invalid transaction
Notes: Need to reduce to --max-calls 1

---

Date: 2025-10-10
RPC: wss://sys.ibp.network:443/asset-hub-kusama
Max Calls: 1
Stashes: 2
Eras: 5
Result: SUCCESS
Tx Hashes: 0x..., 0x...
Notes: Slow but reliable
```

## Retry Logic Testing

The tool now automatically retries failed transactions once. To observe this:

1. Test with a batch size you expect to fail
2. Watch the logs for retry attempts:
   ```
   [payouts] warn: Tx failed (attempt 1/2): <error>
   [payouts] info: Retrying transaction (attempt 2/2)...
   ```

## Troubleshooting

### "Transaction too large" or "Invalid transaction"
- **Solution**: Reduce `--max-calls` value
- Start with `--max-calls 1` and work up

### "Priority is too low"
- **Cause**: Network congestion or insufficient transaction fees
- **Solution**: Retry later or adjust fee settings

### RPC connection timeouts
- **Solution**: Switch to different RPC endpoint
- IBP endpoints generally more reliable

## Recommended Settings (To Be Updated)

Once testing is complete, update these recommendations:

### Kusama AssetHub
```bash
# IBP AssetHub (recommended)
--max-calls 1  # Conservative, pending test results
-w wss://sys.ibp.network:443/asset-hub-kusama

# Polkadot.io AssetHub (fallback)
--max-calls 1  # Conservative, pending test results
-w wss://kusama-asset-hub-rpc.polkadot.io/public
```

### Production Settings for 72-Hour Compliance

For Kusama decentralized nodes program (pay within 72 hours):
```bash
# Kusama eras are ~6 hours
# 72 hours = 12 eras safety buffer
# Use --stop 1 to avoid current era
# Use depth of 15-20 for safety

node build/index.js collect \
  -e 20 \
  --stop 1 \
  --max-calls <OPTIMAL_FROM_TESTING> \
  -w wss://sys.ibp.network:443/asset-hub-kusama \
  --stashesFile ./test/kusama-stashes.json \
  --suriFile ./test/KSM-GOVSCRPTPROXY-00.key
```

## Next Steps

After finding optimal batch sizes:
1. Update default `--max-calls` in src/index.ts
2. Add chain-specific presets
3. Document findings in README
