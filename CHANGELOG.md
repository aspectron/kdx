# Changelog

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

