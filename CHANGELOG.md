# Changelog

## [2.2.0] - 2021-03-14
This release of KDX includes Kaspa build `v0.9.1` and is **compatible only with TESTNET-3**.
This release includes the following changes:
- KaspaUX re-integrated into KDX (KaspaUX now serves all wallet projects - PWA and KDX)
- Wallet Import / Export (via KaspaUX)
- Various user interface enhancements in the Wallet (via KaspaUX)
- Significant speed improvements during transaction generation (250-1000 UTXO/s depending on various factors)
- DNS seed settings have been removed from configuration templates (as of 0.9.1 dns-seeds are hard-coded)
- Full data folder reset (for testnet3 switch)
- Increased pastMedianTime sync tolerance from 45 to 75 sec

## [2.1.0] - 2021-02-19
This release of KDX includes Kaspa build `v0.8.9` and is **compatible only with TESTNET-2**.
This release includes the following changes (most coming from the corresponding Kaspa Walleet Framework release):
- Fix for missing transactions when KDX Wallet is offline (balance would update but transactions not recorded)
- Significant speed improvement for fee estimation
- Fix for QR code rendering that would cause QR codes not to display correctly
- Change transactions are no longer categorized as pending and are available for immediate spending
- Support for Kaspad running in archival mode (experimental)

## [2.0.2] - 2021-02-14
This release of KDX includes Kaspa build `v0.8.8` and is **compatible only with TESTNET-2**.
This is a minor release and includes the following changes:
- Integrates DNS Seeder settings specific to Testnet 2
- Detects and auto-purges KDX data folder if testnet network has changed
- Improved sync status display

## [2.0.1] - 2021-02-04
This release of KDX includes Kaspa build `v0.8.7`.

This is a minor release and includes the following changes:
- Removed storage rate metrics (no longer needed as the platform utilizes pruning)
- Refactored DAG SYNC metric to use Network Median Time
- Included Blue Score metric
- Fixed Uptime metric to correctly display days
- Included experimental Median Delta metric (depicts `computer time - network median time`)

## [2.0.0] - 2021-01-27
This release updates KDX compatibility with kaspad `v0.8.6-dev` branch.
After upgrading you must reset your data folders with `node kdx --purge`.

As of this release, KDX has been adapted to be a wallet-centric application based on top of Kaspa's Wallet Framework subsystem.

- Initial alpha-testnet release
- Implemented UTXO-index-based wallet subsystem (Kaspa Wallet Framework that interfaces with Kaspa's Karpov subsystem)
- Improved interface for setting the mining address
- Removed previously supported daemons (Kasparov, MQTT, Postgres etc.)

## [1.4.0] - 2020-09-24
** WORK IN PROGRESS - INTERNAL POC RELEASE **
This version updates KDX to be compatible with kaspad `v0.8.1-dev` branch (as of 2020-11-26 feature/karpov-rebase-3 branch). Before running you must reset your data folders with `node kdx --purge`.
- Removed 3rd-party service dependence (PostgreSQL and MQTT) from the project build.
- Integrated Karpov Wallet interface directly into KDX
- Integrated basic wallet functionality (creation, recovery etc)

## [1.2.0] - 2020-09-24
This version updates KDX to be compatible with kaspad `v0.7.2-dev` branch. Before running you must reset your data folders with `node kdx --purge`.

- Created gRPC interface for connection with Kaspad 
- Disabled Websocket JSON RPC support
- Removed JSON RPC arguments (`--rpcuser` and `--rpcclient`) from default Kaspa daemon settings
- Created startup dialog showing this Changelog
- Moved default MQTT port to 19792

## [1.1.0] - 2020-08-19
This version updates KDX to be compatible with kaspad `v0.6.5-dev` branch. Before running you must reset your data folders with `node kdx --purge`.

- Compatibility with the latest Emanator integration API (please update Emanator `npm install -g emanator@latest`)
- Migrated `--miningaddr` from Kaspad to Kaspaminer
- Removed network statistics (as RPC Call has been removed from Kaspad); KDX no longer shows Kaspad network transfer rates.

