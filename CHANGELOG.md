# Changelog

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

