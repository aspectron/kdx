# Changelog

## [1.1.0] - 2020-08-19
This version updates KDX to be compatible with kaspad `v0.6.5-dev` branch. Before running you must reset your data folders with `node kdx --purge`.

### Added
- Compatibility with the latest Emanator integration API (please update Emanator `npm install -g emanator@alpha`)

### Changed
- Removed `--miningaddr` from Kaspad, migrated it to Kaspaminer

### Removed
- Removed network statistics (as they were removed from Kaspad); KDX no longer shows Kaspad network transfer rates.

