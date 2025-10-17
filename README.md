# Staking Payouts - Enhanced Fork

<div align="center">
  <h3>💸 Advanced CLI for Substrate Staking Payout Automation 💸</h3>
  <h4>🔧 AssetHub Compatible | 🛡️ Compliance Ready | 🤖 Automation Friendly 🤖</h4>

  <p>
    <a href="https://github.com/infrachris/staking-payouts">
      <img alt="GitHub" src="https://img.shields.io/badge/fork-enhanced-blue" />
    </a>
    <a href="https://github.com/canontech/staking-payouts">
      <img alt="Upstream" src="https://img.shields.io/badge/upstream-canontech-green" />
    </a>
    <a href="LICENSE">
      <img alt="License" src="https://img.shields.io/badge/license-Apache--2.0-orange" />
    </a>
  </p>
</div>

---

## 🚀 What's New in This Fork

This enhanced fork adds **critical bug fixes** and **advanced features** for production validator operations:

### ✅ Critical Bug Fixes (v1.7.1)
- **Nonce Collision Fix**: Fixed critical bug causing 80%+ transaction failure rate when sending multiple transactions
- **Current Era Bug**: Fixed `InvalidEraToReward` errors ([PR #107](https://github.com/canontech/staking-payouts/pull/107))
- **AssetHub Compatibility**: Works with Kusama/Polkadot AssetHub migration
- **Era Ordering**: Processes payouts oldest→newest for compliance

### 🎯 New Features
- **`--stop` parameter**: Skip N newest eras for compliance requirements
- **`--max-calls` parameter**: Control batch size for different RPC providers (tested optimal: 3)
- **Retry Logic**: Auto-retry failed transactions once
- **Manual Nonce Management**: Ensures 100% transaction reliability
- **Enhanced Logging**: Debug mode with detailed era calculations and nonce tracking
- **Transaction Summaries**: Know exactly what succeeded/failed

### 📊 Production-Tested Optimization
- **max-calls=3**: Proven optimal through extensive testing (100% success rate)
- **Batch Size Limits**: Documented Kusama AssetHub block weight limits
- **Fee Efficiency**: ~70% reduction in transaction count vs unbatched operations

### 📊 Use Cases
- ✅ Maximum fee efficiency with reliable batching
- ✅ Multi-validator operations with proven optimal settings
- ✅ AssetHub transaction size constraints (tested and documented)
- ✅ Automated payout collection with error recovery

---

## 📖 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage](#usage)
  - [Basic Examples](#basic-examples)
  - [Advanced Features](#advanced-features)
  - [72-Hour Compliance](#72-hour-compliance)
- [Parameters](#parameters)
- [Chain-Specific Settings](#chain-specific-settings)
- [RPC Endpoints](#rpc-endpoints)
- [Debugging](#debugging)
- [Automation](#automation)
- [Testing](#testing)
- [Contributing](#contributing)

---

## ⚡ Quick Start

### Installation

```bash
# Clone the enhanced fork
git clone https://github.com/infrachris/staking-payouts.git
cd staking-payouts

# Install dependencies
yarn install

# Build
yarn build
```

### Basic Usage

**List unclaimed payouts** (read-only, safe):
```bash
node build/index.js ls \
  -e 25 \
  --stop 1 \
  -w wss://sys.ibp.network:443/asset-hub-kusama \
  --stashesFile ./stashes.json
```

**Collect payouts** (maximum efficiency):
```bash
node build/index.js collect \
  -e 84 \
  --stop 1 \
  --max-calls 3 \
  -w wss://sys.ibp.network:443/asset-hub-kusama \
  --stashesFile ./stashes.json \
  --suriFile ./key.txt
```

---

## 📥 Installation

### Prerequisites
- Node.js >= 14
- Yarn (v4.5.3 recommended)

### From Source

```bash
git clone https://github.com/infrachris/staking-payouts.git
cd staking-payouts
yarn install
yarn build
```

### Configuration Files

Create your stashes file (`stashes.json`):
```json
[
  "ValidatorStashAddress1...",
  "ValidatorStashAddress2..."
]
```

Create your key file (`key.txt`):
```
your-seed-phrase-or-private-key-here
```

**⚠️ IMPORTANT**: Never commit `key.txt` or any file containing private keys!

---

## 🎮 Usage

### Basic Examples

#### List Unclaimed Payouts

```bash
# Check last 25 eras (skipping current)
node build/index.js ls \
  -e 25 \
  --stop 1 \
  -w wss://sys.ibp.network:443/asset-hub-kusama \
  --stashesFile ./stashes.json
```

#### Collect Payouts

```bash
# Collect with conservative batch size
node build/index.js collect \
  -e 20 \
  --stop 1 \
  --max-calls 1 \
  -w wss://sys.ibp.network:443/asset-hub-kusama \
  --stashesFile ./stashes.json \
  --suriFile ./key.txt
```

### Advanced Features

#### Era Control with `--stop`

Skip N newest eras (useful for compliance buffers):

```bash
# Skip current era only (default)
--stop 1

# Skip 5 newest eras (30-hour buffer on Kusama)
--stop 5

# Skip 2 eras (12-hour buffer on Kusama)
--stop 2
```

**Example**:
```bash
node build/index.js ls -e 25 --stop 5 \
  -w wss://sys.ibp.network:443/asset-hub-kusama \
  --stashesFile ./stashes.json
```

#### Batch Size Optimization with `--max-calls`

Control how many `payoutStakers` calls per transaction. **Production-tested optimal value: 3**

```bash
# Optimal (3 calls per tx) - 100% success rate, maximum efficiency
--max-calls 3

# Conservative (1 call per tx) - safest but more expensive
--max-calls 1

# Moderate (2 calls per tx) - good balance
--max-calls 2
```

**⚠️ Important**: Values above 3 hit Kusama AssetHub block weight limits:
- `max-calls=4`: ⚠️ Unreliable (~66% success rate)
- `max-calls=5+`: ❌ Fails with "Transaction would exhaust the block limits"

**Production Testing Results** (10 unclaimed payouts):
| max-calls | Transactions | Success Rate | Result |
|-----------|--------------|--------------|--------|
| 1 | 10 txs | 100%* | More expensive |
| 2 | 5 txs | 100% | Good |
| **3** | **4 txs** | **100%** | ✅ **Optimal** |
| 4 | 3 txs | ~66% | Unreliable |
| 5+ | 2 txs | 0% | Fails |

*Requires nonce collision fix (v1.7.1+)

**Example**:
```bash
node build/index.js collect \
  -e 84 \
  --stop 1 \
  --max-calls 3 \
  -w wss://sys.ibp.network:443/asset-hub-kusama \
  --stashesFile ./stashes.json \
  --suriFile ./key.txt
```

### 72-Hour Compliance

For programs requiring payouts within 72 hours (e.g., Kusama Decentralized Nodes):

```bash
node build/index.js collect \
  -e 15 \
  --stop 1 \
  --max-calls 1 \
  -w wss://sys.ibp.network:443/asset-hub-kusama \
  --stashesFile ./stashes.json \
  --suriFile ./key.txt
```

**Rationale**:
- `-e 15`: Check 15 eras back = 90 hours on Kusama (6hr/era)
- `--stop 1`: Skip current era (not claimable yet)
- Provides 18-hour safety margin beyond 72-hour requirement

---

## 🔧 Parameters

### Global Options

| Parameter | Alias | Description | Default |
|-----------|-------|-------------|---------|
| `--ws` | `-w` | WebSocket RPC endpoint | Required |
| `--stashesFile` | `-S` | Path to JSON file with stash addresses | Optional* |
| `--stashes` | `-s` | Array of stash addresses | Optional* |
| `--eraDepth` | `-e` | How many eras to check | `0` |
| `--eraStop` | `--stop` | Skip N newest eras | `1` |
| `--maxCalls` | `-m` | Max calls per batch transaction | `3` |

*Either `--stashesFile` or `--stashes` is required

### Command-Specific Options

**For `collect` command**:
| Parameter | Alias | Description | Default |
|-----------|-------|-------------|---------|
| `--suriFile` | `-u` | Path to file with private key | Required |

### Commands

```bash
node build/index.js <command> [options]
```

| Command | Description |
|---------|-------------|
| `collect` | Collect pending payouts (default) |
| `ls` | List pending payouts (read-only) |
| `lsNominators` | List nominators backing given stashes |
| `commission` | List validators by commission % |

---

## ⛓️ Chain-Specific Settings

### Kusama (AssetHub Required)

**Chain Info**:
- Era Duration: ~6 hours
- Payout Window: 84 eras (~21 days)
- **IMPORTANT**: Must use AssetHub endpoint (relay chain no longer supports staking ops)

**Maximum Efficiency Settings** (Production-Tested):
```bash
-e 84             # Full expiration window (never miss payouts)
--stop 1          # Skip only current era (minimum required)
--max-calls 3     # Optimal batch size (100% success rate)
```

**Conservative Settings** (72-hour compliance):
```bash
-e 15-20          # Era depth for 72-hour window
--stop 1          # Skip current era
--max-calls 3     # Optimal batch size
```

**Example** (Maximum Efficiency):
```bash
node build/index.js collect \
  -e 84 \
  --stop 1 \
  --max-calls 3 \
  -w wss://sys.ibp.network:443/asset-hub-kusama \
  --stashesFile ./kusama-stashes.json \
  --suriFile ./kusama-key.txt
```

### Polkadot

**Chain Info**:
- Era Duration: ~24 hours
- Payout Window: 84 eras (~84 days)

**Maximum Efficiency Settings** (Production-Tested):
```bash
-e 84             # Full expiration window (never miss payouts)
--stop 1          # Skip only current era (minimum required)
--max-calls 3     # Optimal batch size (proven reliable)
```

**Note**: Polkadot may support higher max-calls values than Kusama AssetHub, but `max-calls=3` is proven reliable and provides excellent efficiency.

**Example** (Maximum Efficiency):
```bash
node build/index.js collect \
  -e 84 \
  --stop 1 \
  --max-calls 3 \
  -w wss://rpc.ibp.network:443/polkadot \
  --stashesFile ./polkadot-stashes.json \
  --suriFile ./polkadot-key.txt
```

---

## 🌐 RPC Endpoints

### Kusama AssetHub

**Primary (Recommended)**:
```
wss://sys.ibp.network:443/asset-hub-kusama
```

**Fallback**:
```
wss://kusama-asset-hub-rpc.polkadot.io/public
```

**⚠️ Note**: Old relay chain endpoints (`wss://kusama.api.onfinality.io`) no longer support staking operations after AssetHub migration.

### Polkadot

**Primary**:
```
wss://rpc.ibp.network:443/polkadot
```

**Fallback**:
```
wss://rpc.polkadot.io
```

---

## 🐛 Debugging

### Enable Debug Mode

```bash
export PAYOUTS_DEBUG=1
node build/index.js ls -e 10 --stop 1 \
  -w wss://sys.ibp.network:443/asset-hub-kusama \
  --stashesFile ./stashes.json
```

### Debug Output Includes

- Current era number
- Era range being processed (start→end)
- Validator vs nominator detection
- Stash address parsing
- Batch transaction details
- Retry attempts and results

**Example Output**:
```
[payouts] debug: Current era: 8675
[payouts] debug: Skipping 1 newest eras (stop parameter)
[payouts] debug: Checking 25 eras from 8649 to 8673
[payouts] debug: Validator address detected: Ed1x...Cb6
[payouts] info: Created 3 batch transactions with max 3 calls each
```

---

## 🤖 Automation

### Cron (Every 6-12 Hours)

**Maximum Efficiency Configuration**:
```bash
# Add to crontab: crontab -e
0 */6 * * * cd ~/staking-payouts && node build/index.js collect -e 84 --stop 1 --max-calls 3 -w wss://sys.ibp.network:443/asset-hub-kusama --stashesFile ./stashes.json --suriFile ./key.txt >> ~/payout.log 2>&1
```

### Systemd Timer

**Service file** (`/etc/systemd/system/kusama-payouts.service`):
```ini
[Unit]
Description=Kusama Staking Payouts (Maximum Efficiency)
After=network.target

[Service]
Type=oneshot
User=your-user
WorkingDirectory=/home/your-user/staking-payouts
Environment="PAYOUTS_DEBUG=1"
ExecStart=/usr/bin/node build/index.js collect -e 84 --stop 1 --max-calls 3 -w wss://sys.ibp.network:443/asset-hub-kusama --stashesFile ./stashes.json --suriFile ./key.txt
```

**Timer file** (`/etc/systemd/system/kusama-payouts.timer`):
```ini
[Unit]
Description=Run Kusama payouts every 12 hours

[Timer]
OnCalendar=*-*-* 00,12:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

**Enable**:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now kusama-payouts.timer
sudo systemctl status kusama-payouts.timer
```

---

## 🧪 Testing

### Read-Only Tests (Safe)

```bash
# List unclaimed payouts (no transactions sent)
export PAYOUTS_DEBUG=1
node build/index.js ls \
  -e 25 \
  --stop 1 \
  -w wss://sys.ibp.network:443/asset-hub-kusama \
  --stashesFile ./stashes.json
```

### Batch Size Testing

**Production Test Results** (Kusama AssetHub with 10 unclaimed payouts):

| max-calls | Result | Details |
|-----------|--------|---------|
| 10 | ❌ Failed | `Transaction would exhaust the block limits` |
| 6 | ⚠️ Partial | First tx (6 calls) failed, second tx succeeded |
| 5 | ❌ Failed | All transactions failed |
| 4 | ⚠️ Partial | 2/3 transactions succeeded (~66% success rate) |
| **3** | ✅ **Success** | **100% success rate - OPTIMAL** |
| 2 | ✅ Success | 100% success rate |
| 1 | ✅ Success | 100% success rate (requires v1.7.1+ nonce fix) |

**Key Findings**:
- **Hard Limit**: 5+ calls consistently fail with block weight errors
- **Unreliable Zone**: 4 calls works sometimes but fails unpredictably
- **Optimal Value**: 3 calls provides maximum efficiency with 100% reliability
- **Fee Savings**: max-calls=3 reduces transaction count by ~70% vs max-calls=1

**Testing Protocol**:

See `BATCH_SIZE_TESTING.md` for detailed testing protocol.

**Quick test with optimal batch**:
```bash
node build/index.js collect \
  -e 10 \
  --stop 1 \
  --max-calls 3 \
  -w wss://sys.ibp.network:443/asset-hub-kusama \
  --stashesFile ./stashes.json \
  --suriFile ./key.txt
```

---

## 🔒 Security

### Best Practices

- ✅ **Never commit private keys** to version control
- ✅ **Use read-only mode** (`ls` command) for testing
- ✅ **Test with small amounts** first
- ✅ **Keep backups** of your key files
- ✅ **Use hardware wallets** when possible
- ✅ **Monitor logs** for suspicious activity

### Files to Never Commit

The `.gitignore` is configured to exclude:
- `*.key` (private keys)
- `/test/` directory
- `/build/` directory
- `*.txt` containing seeds

---

## 🤝 Contributing

### Upstream Contributions

This fork maintains compatibility with the upstream project. Bug fixes may be contributed back via pull requests.

**Upstream Repository**: https://github.com/canontech/staking-payouts
**Submitted PR**: #107 (critical current era bug fix)

### Fork-Specific Features

For issues or features specific to this enhanced fork:
- **GitHub Issues**: https://github.com/infrachris/staking-payouts/issues
- **Pull Requests**: Welcome for improvements

---

## 📜 License

Apache-2.0 (same as upstream)

---

## 🙏 Credits

**Original Project**: [@zekemostov](https://github.com/emostov) / [canontech](https://github.com/canontech)
**Enhanced Fork**: [@infrachris](https://github.com/infrachris)

Special thanks to the original authors for creating this essential tool for the Polkadot ecosystem.

---

## 📞 Support

**For this enhanced fork**:
- GitHub Issues: https://github.com/infrachris/staking-payouts/issues

**For general staking-payouts questions**:
- Original Repo: https://github.com/canontech/staking-payouts

**For Substrate/Polkadot questions**:
- Polkadot Forum: https://forum.polkadot.network/
- Substrate Stack Exchange: https://substrate.stackexchange.com/

---

<div align="center">
  <p>
    <strong>Built for validators, by validators</strong><br>
    Making Substrate staking rewards accessible and automated
  </p>
</div>
