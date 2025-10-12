# v1.7.0 - AssetHub Compatibility & Advanced Features

## 🚀 New Features

- **`--stop` parameter**: Skip N newest eras (default: 1) for compliance requirements
- **`--max-calls` parameter**: Control batch size for AssetHub transaction limits
- **Retry logic**: Auto-retry failed transactions with detailed summaries
- **Era ordering**: Process payouts from oldest→newest

## ✅ Improvements

- Enhanced debug logging with `PAYOUTS_DEBUG=1`
- Transaction summaries showing success/failure counts
- Better error handling and graceful failure recovery
- Comprehensive documentation and testing guides

## 📖 Documentation

- Added `.claude/README.md` for development context
- Added `BATCH_SIZE_TESTING.md` for testing protocol
- Updated main README with examples and automation guides

## 🔧 Use Cases

- Kusama/Polkadot validator payout automation
- AssetHub transaction size constraints
- Time-based compliance requirements (e.g., 72-hour payouts)
- Multi-validator operations with batch optimization

## 📦 Installation

```bash
git clone https://github.com/infrachris/staking-payouts.git
cd staking-payouts
yarn install
yarn build
```

## 🧪 Testing

Successfully tested on Kusama AssetHub with real payouts.

## Quick Start

**List unclaimed payouts:**
```bash
node build/index.js ls \
  -e 25 \
  --stop 1 \
  -w wss://sys.ibp.network:443/asset-hub-kusama \
  --stashesFile ./stashes.json
```

**Collect payouts:**
```bash
node build/index.js collect \
  -e 20 \
  --stop 1 \
  --max-calls 1 \
  -w wss://sys.ibp.network:443/asset-hub-kusama \
  --stashesFile ./stashes.json \
  --suriFile ./key.txt
```

---

Co-Authored-By: Claude <noreply@anthropic.com>
