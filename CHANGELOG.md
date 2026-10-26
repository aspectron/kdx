# Changelog

## [2.21.0] - 2026-10-25
- Updated the bundled Kaspa node to the official rusty-kaspa (Rust) kaspad v2.1.0.
- Wallet updated to the Kaspa Rust WASM SDK v2.1.0; existing 12-word wallets open unchanged.
- The settings pane stays readable at any window size: long examples wrap and the template and network selectors reflow instead of being clipped.
- Closing KDX now exits cleanly instead of sometimes leaving the application running in the background.
- The Public Node dashboard no longer shows a negative DAG sync percentage right after connecting.
- A fresh install starts in Public Node mode without launching a local node.
- Upgrading from an earlier .deb package repairs the install folder permissions, so the app starts for every user.
- The wallet connects through the public node on the default configuration instead of staying offline.
- A newly created wallet shows its receive address right away.
- Enabling mining without a mining address no longer restarts the miner over and over: mining stays off with a notice until you open or create a wallet, then mines to that wallet's address. A mining address set in the settings is used instead unless Use Wallet Address for Mining is on.
- The settings page shows the active template and network on a fresh start.
- The Public Node panel no longer shows a storage tile for a node that stores nothing locally.
- Changing the network, or switching between a public and a local node, moves an open wallet to the new node without a restart; mining to the wallet's address then uses its address on the new network.
- The dashboard and the service tabs follow the applied configuration: a service that a template or configuration change removes disappears right away, and a node that stops because of an error keeps its tab with the reason.
- With a public node and a local node configured together, the miner mines on the local node; with no local node, mining stays off with a notice instead of restarting the miner over and over.
- After a wallet moves to another node, its DAA score shows that node's score as soon as it connects.
- Changing the network or the node while a wallet is still connecting to a public node moves the wallet to the new node right away instead of leaving it stuck.

## [2.20.0] - 2026-06-19
- Revived KDX on the modern Kaspa stack: bundles the official rusty-kaspa node (kaspad v2.0.1) and defaults to MAINNET.
- Node network and binary are configurable: the bundled node runs mainnet or testnet-10, and a custom build runs by dropping your own binary into ~/.kdx/bin/<platform>-<arch> and selecting it by name on a local template's binary field.
- Three configuration templates - Public Node (default), Local Node, and Local Node + Miner; applying a template (RESET) replaces the active service set, while non-module settings and synced node data are preserved.
- Wallet rebuilt on the official Kaspa Rust WASM SDK; existing 12-word wallets open unchanged.
- CPU mining via kaspanet/cpuminer (tag v0.2.7; the bundled kaspa-miner reports version 0.2.6); live hashrate + block-rate in the dashboard.
- User-space data layout under ~/.kdx (config, node data, user binaries); each node's captured log is kept separate per network.
- Packaged as a portable AppImage and a system .deb (app installs read-only to /opt/kdx); the launcher forces the X11 backend for reliable window resizing and dock-icon integration.
- Updated desktop runtime (NWJS 0.112).

## [2.12.10] - 2023-12-16
- v2.12.8 password compatibility, v2.12.9 users must restore from seed!
- Updated Kaspa node to v0.12.15.
- Updated Romanian translation! Thanks!
- Fixed a couple of broken translations.

## [2.12.9] - 2023-12-16
- NB: Withdrawn due to v2.12.8 password incompatibility.
- Updated Kaspa node to v0.12.15.
- Updated Romanian translation! Thanks!
- Fixed a couple of broken translations.

## [2.12.8] - 2023-10-14
- UPNP: Support for public node on non-standard port.
- Fixed welcome screen on low-resolution displays.

## [2.12.7] - 2023-10-06
- UPNP bugfixes and improvements.
- Add user agent string to identify as KDX to other nodes.

## [2.12.6] - 2023-10-03
- Fix for a rare condition resulting in "invalid derivation path" error when trying to send funds.
- UPNP support. It can be disabled in Settings -> Advanced -> Service Configuration.

## [2.12.5] - 2023-10-02
Big localization update, many thanks to our translators!
- UPNP support (initial)

## [2.12.4] - 2023-09-30
Updated Kaspa node to v0.12.14.

## [2.12.3] - 2023-04-15
This is a maintenance release. Due to an issue with GitHub some translations did not propagate
into the previous `2.12.2` release (this affected Windows builds only). 

## [2.12.2] - 2023-04-11
This release of KDX includes Kaspa build `v0.12.13`
- ECDSA address support 
- Added new languages: Français, Indonesian, Italiano, Português (Brazil) 

## [2.12.1] - 2022-12-01
This release of KDX includes Kaspa build `v0.12.11`
- Fix Date and text escaping issue in transactions export as CSV

## [2.12.0] - 2022-11-25
This release of KDX includes Kaspa build `v0.12.10`
- Support for wallet UI lock [issue#28](https://github.com/aspectron/kdx/issues/28)
- Transactions export as CSV [issue#19](https://github.com/aspectron/kdx/issues/19)
- Updated Kaspa logo and OSX icon [issue#21](https://github.com/aspectron/kdx/issues/21)
- Transactions addresses are now links to https://explorer.kaspa.org
- Transaction can now be updated using the archival node API at https://api.kaspa.org


## [2.11.2] - 2022-09-21
This release of KDX includes Kaspa build `v0.12.7`

## [2.11.1] - 2022-09-10
This release of KDX includes Kaspa build `v0.12.6`

## [2.11.0] - 2022-08-20

This release includes the following changes:
- Improved *Scan more addresses* functionality where selecting the function again will resume from the last address scan position (not restart from the current address).
- Support for auto-compounding. If you are a miner or receive a lot of transactions, you can go to settings and activate *Auto compound*.
- Now UTXO componding uses the first change address as the destination unless changed via *Use latest Change address*
- Fix incorrect handling of transaction mass
- Extra debug info when transaction submission results in an error
- UTXO list tab (primarily for debuging)

## [2.10.14] - 2022-08-20

This release includes the following changes:
- Support for auto-compounding, Go to setting and activate "Auto compound".
- Now UTXO componding uses first change address as destination unless changed via "Use latest Change address"
- Fix incorrect handling of transaction mass
- Extra debug info while transaction submit
- UTXO list for debuging

## [2.10.12] - 2022-07-18
This release of KDX includes Kaspa build `v0.12.4`

## [2.10.11] - 2022-07-05
This release of KDX includes Kaspa build `v0.12.3`
This release includes the following changes:
- German language support

## [2.10.10] - 2022-06-18
This release of KDX includes Kaspa build `v0.12.2`
- faucet support removed

## [2.10.9] - 2022-06-15
- This release addresses different number of confirmations requirement for regular vs. mining transactions.

## [2.10.8] - 2022-06-14
- Fix incorrect handling of transaction lock times
- Reduce transaction confirmation time in UX

## [2.10.7] - 2022-06-07
This release of KDX includes Kaspa build `v0.12.1`
- bug fix: No-balance after the initial wallet import
- Korean language support

## [2.10.5] - 2022-05-23
This release of KDX includes Kaspa build `v0.12.1-rc3`
This release includes the following changes:
- Disabling GPU support in the KDX user interface as it affects the mining software.
- This kaspad release `v0.12.1-rc3` includes fixes related to the UTXO index subsystem. 

## [2.10.4] - 2022-04-22
GPU miner support
- Internal improvements to the i18n engine

## [2.10.3] - 2022-04-20
This release includes the following changes:
- Disabled UTXO index warning during UTXO reindex
- Internal improvements to the i18n engine

## [2.10.2] - 2022-04-20
- Fixed a memory leak issue caused by GRPC dependencies.

## [2.10.1] - 2022-04-14
This release of KDX includes Kaspa build `v0.12.0`
This release includes the following changes:
- Implemented "Delete Data Folder and Resync" feature in the Settings panel. (if upgrading to Kaspad `v0.12.0` please use this to facilitate a faster resync).

## [2.10.0] - 2022-04-14
This release of KDX includes Kaspa build `v0.12.0`
This release includes the following changes:
- Internal improvements to the i18n engine
- Improved Chinese language support

## [2.9.1] - 2022-03-30
This release of KDX includes Kaspa build `v0.11.14`
This release includes the following changes:
- Fixed an issue preventing application from exiting when UI is in a language other than English
- Internal improvements to the i18n engine

## [2.9.0] - 2022-03-24
This release of KDX includes Kaspa build `v0.11.14`
This release includes the following changes:
- Partial Chinese language support

## [2.8.8] - 2022-01-28
This release of KDX includes Kaspa build `v0.11.11`
This release includes the following changes:
- Improved handling of address derivations. 

NOTE: If you are mining and your wallet is not showing correct balance, 
in the wallet panel, please switch to the DEBUG pane and click "Scan More Addresses" button.  

## [2.8.7] - 2022-01-04
This release of KDX includes Kaspa build `v0.11.9`
This release includes the following changes:
- Increased default address discovery extent to 150
- Fixed multiple issues where fee estimation can cause change address derivation
- Fixed an issue that advances change address derivation in case of transaction failures
- Fixed an RPC-related issue in the underlying libraries that can cause occasional RPC timeouts in PWA

## [2.8.6] - 2021-12-30
This release of KDX includes Kaspa build `v0.11.9`
This release includes the following changes:
- P2SH address support (ability to send to multisig addresses)

## [2.8.5] - 2021-12-13
This release of KDX includes Kaspa build `v0.11.8`
## [2.8.4] - 2021-12-12
This release of KDX includes Kaspa build `v0.11.7`

## [2.8.3] - 2021-11-22
This release of KDX includes Kaspa build `v0.11.6` and is **compatible with MAINNET**.

## [2.8.0] - 2021-11-22
This release of KDX includes Kaspa build `v0.11.4` and is **compatible with MAINNET**.

## [2.6.1] - 2021-05-30
This release of KDX includes Kaspa build `v0.10.2` and is **compatible only with TESTNET-5**.

This release addresses address compatibility issues in the wallet framework that occurred during 0.9.x to 0.10.x migration.

## [2.5.0] - 2021-05-25
This release of KDX includes Kaspa build `v0.10.2` and is **compatible only with TESTNET-5**.

This is an interim release - due to changes in the Kaspa project, the wallet framework functionality is currently disabled, instead you can use the "Console" tab to access the native Kaspa CLI wallet.

- Support for native Kaspa CLI wallet via Console tab
- Support for Kaspad RPC calls via Console tab

## [2.4.0] - 2021-05-10
This release of KDX includes Kaspa build `v0.10.2` and is **compatible only with TESTNET-5**.
This release includes the following changes:
- Kaspad now uses a single `--appdir` argument for data folder.
- The wallet framework now limits transaction sizes using kaspad-compatible transaction weight expressed in SigOps.

## [2.3.0] - 2021-04-08
This release of KDX includes Kaspa build `v0.9.2` and is **compatible only with TESTNET-4**.
This release includes the following changes:
- Disallow transactions with more than 50 inputs (upcoming kaspad v0.10.0 will address this).
- Compound feature now uses up to 50 inputs per compound transaction.
- Implemented a different UTXO tracking mechanism addressing UTXO reuse issues that were occurring when transactions get stuck in the mempool.

## [2.2.0] - 2021-03-14
This release of KDX includes Kaspa build `v0.9.1` and is **compatible only with TESTNET-3**.
This release includes the following changes:
- KaspaUX integrated into KDX (KaspaUX now serves all wallet projects - PWA and KDX)
- "Scan QR Code" now available (via KaspaUX)
- Wallet Import / Export (via KaspaUX)
- Various user interface enhancements in the Wallet (via KaspaUX)
- Significant speed improvements during transaction generation (250-1000 UTXO/s depending on various factors)
- DNS seed settings have been removed from configuration templates (as of 0.9.1 dns-seeds are hard-coded)
- Full data folder reset (for testnet3 switch)
- Increased pastMedianTime sync tolerance from 45 to 75 sec
- Basic auto-update features - KDX will check if the user is running the latest version and offer to update.

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

