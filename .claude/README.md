# Staking Payouts - Enhanced Fork

## Project Overview

This is an enhanced fork of [@zekemostov/staking-payouts](https://github.com/canontech/staking-payouts) with critical bug fixes and advanced features for Kusama/Polkadot validator payout automation.

**Repository**: https://github.com/infrachris/staking-payouts
**Original**: https://github.com/canontech/staking-payouts
**Upstream PR**: #107 (critical bug fix)

## Fork Rationale

This fork was created to:
1. **Fix critical bugs** preventing payouts on current Kusama/Polkadot chains
2. **Add compliance features** for programs like Kusama Decentralized Nodes (72-hour payout requirement)
3. **Optimize for AssetHub** migration with configurable batch sizes
4. **Improve reliability** with retry logic and better error handling

## Project Structure

```
payout-dev/
├── src/
│   ├── index.ts          # CLI entry point, parameter definitions
│   ├── handlers.ts       # Command handlers (collect, ls, etc.)
│   ├── services.ts       # Core payout logic, era processing, transaction batching
│   ├── logger.ts         # Winston logging configuration
│   └── isValidSeed.ts    # Key validation
├── test/                 # Test files, keys, stash lists (gitignored)
│   ├── kusama-stashes.json
│   ├── polkadot-stashes.json
│   ├── *.key            # Private keys (NEVER commit)
│   └── TEST_RESULTS.md  # Test documentation
├── BATCH_SIZE_TESTING.md # Testing protocol
└── build/               # Compiled JavaScript (gitignored)
```

## Key Enhancements

### 1. Era Management (`--stop` parameter)

**Problem**: Original tool tried to claim current era (always fails with `InvalidEraToReward`)

**Solution**:
- Added `--stop` parameter to skip N newest eras
- Default: `--stop 1` (skip current era only)
- Enables compliance buffers (e.g., `--stop 5` for 72-hour safety margin)

**Code Location**: `src/services.ts:122-130`

### 2. Batch Size Control (`--max-calls` parameter)

**Problem**: AssetHub migration reduced max transaction size, causing failures

**Solution**:
- Added `--max-calls` parameter to control batch size
- Default: 3 (conservative for AssetHub)
- Allows testing and optimization per RPC provider

**Code Location**: `src/services.ts:447-457`

### 3. Nonce Collision Fix (v1.7.1)

**Problem**: Multiple transactions sent sequentially used same nonce value, causing 80%+ failure rate

**Solution**:
- Manual nonce management: query once, increment for each transaction
- Each transaction gets unique, sequential nonce
- 100% success rate in production testing

**Code Location**: `src/services.ts:473-530`

```typescript
// Query nonce once at start
let currentNonce = (await api.rpc.system.accountNextIndex(signingKeys.address)).toNumber();

for (const [i, tx] of txs.entries()) {
  // Use explicit nonce for each transaction
  await tx.signAndSend(signingKeys, { nonce: currentNonce });
  currentNonce++; // Increment for next tx
}
```

### 4. Retry Logic

**Problem**: Transient failures would stop entire payout process

**Solution**:
- Auto-retry failed transactions once
- Continue to next transaction on failure
- Transaction summary: X succeeded, Y failed

**Code Location**: `src/services.ts:500-526`

### 5. Era Ordering Fix

**Problem**: Payouts processed in random order

**Solution**:
- Process from oldest to newest era
- Ensures compliance with time-based requirements

**Code Location**: `src/services.ts:165-176`

## Production-Tested Batch Size Optimization

### Testing Results (Kusama AssetHub, 10 unclaimed payouts)

| max-calls | Transactions | Success Rate | Status |
|-----------|--------------|--------------|--------|
| 10 | Would be 1 | 0% | ❌ Block limit exhausted |
| 6 | Would be 2 | ~50% | ⚠️ First tx fails |
| 5 | Would be 2 | 0% | ❌ All fail |
| 4 | 3 | ~66% | ⚠️ Unreliable |
| **3** | **4** | **100%** | ✅ **OPTIMAL** |
| 2 | 5 | 100% | ✅ Good |
| 1 | 10 | 100% | ✅ Expensive |

### Key Findings

**Optimal Configuration**:
- **max-calls=3**: Proven 100% reliable
- **era-depth=84**: Full expiration window (never miss payouts)
- **stop=1**: Minimum required (skip current era only)

**Block Weight Limits**:
- Kusama AssetHub has strict block weight limits
- 5+ calls consistently fail with "Transaction would exhaust the block limits"
- 4 calls unreliable (~66% success rate)
- 3 calls is the sweet spot

**Fee Efficiency**:
- max-calls=3 reduces transaction count by ~70% vs max-calls=1
- Example: 10 payouts = 4 transactions instead of 10
- Significant savings on base transaction fees

## Development Workflow

### Building

```bash
cd ~/payout-dev
yarn build
```

### Testing (Read-Only)

```bash
export PAYOUTS_DEBUG=1
node build/index.js ls -e 25 --stop 1 \
  -w wss://sys.ibp.network:443/asset-hub-kusama \
  --stashesFile ./test/kusama-stashes.json
```

### Collecting Payouts (Maximum Efficiency)

```bash
node build/index.js collect \
  -e 84 \
  --stop 1 \
  --max-calls 3 \
  -w wss://sys.ibp.network:443/asset-hub-kusama \
  --stashesFile ./test/kusama-stashes.json \
  --suriFile ./test/KSM-KEY.key
```

## Critical Bug Fixes

### Bug #1: Current Era Claiming

**Original Code** (`src/services.ts:142`):
```typescript
for (let e = currEra - eraDepth; e <= currEra; e++) {
```

**Problem**: Tried to claim current era, always failed

**Fix**:
```typescript
const endEra = currEra - eraStop;
const startEra = endEra - eraDepth;
for (let e = startEra; e < endEra; e++) {
```

**Status**: ✅ Fixed in this fork, PR #107 submitted to upstream

### Bug #2: Default eraDepth=0

**Problem**: With `eraDepth=0` and the fix, loop never executes
```typescript
for (let e = currEra - 1; e < currEra - 1; e++)  // Never runs!
```

**Impact**: Tool appears to work but finds no payouts

**Solution**: Updated docs to recommend minimum `-e 10`

## RPC Endpoints

### Kusama (AssetHub Required)

**Preferred**:
```bash
wss://sys.ibp.network:443/asset-hub-kusama
```

**Fallback**:
```bash
wss://kusama-asset-hub-rpc.polkadot.io/public
```

**Note**: Relay chain endpoints (`wss://kusama.api.onfinality.io`) no longer support staking operations post-AssetHub migration.

### Polkadot

**Preferred**:
```bash
wss://rpc.ibp.network:443/polkadot
```

**Fallback**:
```bash
wss://rpc.polkadot.io
```

## Chain-Specific Settings

### Kusama (AssetHub)

- **Era Duration**: ~6 hours
- **Payout Window**: 84 eras (~21 days)
- **Optimal Depth**: 84 eras (full window)
- **Optimal Stop**: 1 era (minimum required)
- **Optimal Max Calls**: 3 (production-tested, 100% reliable)

### Polkadot

- **Era Duration**: ~24 hours
- **Payout Window**: 84 eras (~84 days)
- **Optimal Depth**: 84 eras (full window)
- **Optimal Stop**: 1 era (minimum required)
- **Optimal Max Calls**: 3 (proven reliable)

## 72-Hour Compliance (Kusama Decentralized Nodes)

**Requirement**: Pay rewards within 72 hours of era ending

**Note**: Maximum efficiency configuration already satisfies this requirement!

**Recommended Command** (Maximum Efficiency):
```bash
node build/index.js collect \
  -e 84 \
  --stop 1 \
  --max-calls 3 \
  -w wss://sys.ibp.network:443/asset-hub-kusama \
  --stashesFile ./test/kusama-stashes.json \
  --suriFile ./test/KSM-KEY.key
```

**Rationale**:
- `-e 84`: Full 84-era window ensures no payouts are ever missed
- `--stop 1`: Skip current era (can't be claimed yet)
- `--max-calls 3`: Optimal batch size (100% reliable, maximum fee efficiency)
- Run every 6-12 hours for safety

## Automation

### Cron Example (Every 6 Hours - Maximum Efficiency)

```bash
0 */6 * * * cd ~/payout-dev && node build/index.js collect -e 84 --stop 1 --max-calls 3 -w wss://sys.ibp.network:443/asset-hub-kusama --stashesFile ./test/kusama-stashes.json --suriFile ./test/KSM-KEY.key >> ~/payout.log 2>&1
```

### Systemd Timer

Create `/etc/systemd/system/kusama-payouts.service`:
```ini
[Unit]
Description=Kusama Staking Payouts (Maximum Efficiency)
After=network.target

[Service]
Type=oneshot
User=your-user
WorkingDirectory=/home/your-user/payout-dev
Environment="PAYOUTS_DEBUG=1"
ExecStart=/usr/bin/node build/index.js collect -e 84 --stop 1 --max-calls 3 -w wss://sys.ibp.network:443/asset-hub-kusama --stashesFile ./test/kusama-stashes.json --suriFile ./test/KSM-KEY.key
```

Create `/etc/systemd/system/kusama-payouts.timer`:
```ini
[Unit]
Description=Run Kusama payouts every 12 hours

[Timer]
OnCalendar=*-*-* 00,12:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable:
```bash
systemctl daemon-reload
systemctl enable --now kusama-payouts.timer
```

## Testing

See `BATCH_SIZE_TESTING.md` for complete testing protocol.

**Quick Test (Safe)**:
```bash
export PAYOUTS_DEBUG=1
node build/index.js ls -e 10 --stop 1 \
  -w wss://sys.ibp.network:443/asset-hub-kusama \
  --stashesFile ./test/kusama-stashes.json
```

## Debug Mode

Enable detailed logging:
```bash
export PAYOUTS_DEBUG=1
```

**Debug Output Includes**:
- Current era number
- Era range being processed (start→end)
- Validator vs nominator detection
- Stash address parsing
- Transaction batch sizing
- Retry attempts

## Contributing Back to Upstream

This fork may contribute features back to the original project, but is maintained independently for specific operational needs.

**Upstream PR**: #107 (critical bug fix)

## Security Notes

**NEVER commit**:
- `*.key` files (private keys)
- `/test/` directory contents
- Any file containing sensitive data

The `.gitignore` is configured to exclude these automatically.

## Support

For issues specific to this enhanced fork:
- GitHub Issues: https://github.com/infrachris/staking-payouts/issues

For general staking-payouts questions:
- Original repo: https://github.com/canontech/staking-payouts
