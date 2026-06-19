/* tslint:disable */
/* eslint-disable */
/**
 * Returns returns true if the script passed is an ECDSA pay-to-pubkey.
 * @param script - The script ({@link HexString} or Uint8Array).
 * @category Wallet SDK
 */
export function isScriptPayToPubkeyECDSA(script: HexString | Uint8Array): boolean;
/**
 * Creates a new script to pay a transaction output to the specified address.
 * @category Wallet SDK
 */
export function payToAddressScript(address: Address | string): ScriptPublicKey;
/**
 * Returns true if the script passed is a pay-to-pubkey.
 * @param script - The script ({@link HexString} or Uint8Array).
 * @category Wallet SDK
 */
export function isScriptPayToPubkey(script: HexString | Uint8Array): boolean;
/**
 * Takes a script and returns an equivalent pay-to-script-hash script.
 * @param redeem_script - The redeem script ({@link HexString} or Uint8Array).
 * @category Wallet SDK
 */
export function payToScriptHashScript(redeem_script: HexString | Uint8Array): ScriptPublicKey;
/**
 * Returns true if the script passed is a pay-to-script-hash (P2SH) format, false otherwise.
 * @param script - The script ({@link HexString} or Uint8Array).
 * @category Wallet SDK
 */
export function isScriptPayToScriptHash(script: HexString | Uint8Array): boolean;
/**
 * Returns the address encoded in a script public key.
 * @param script_public_key - The script public key ({@link ScriptPublicKey}).
 * @param network - The network type.
 * @category Wallet SDK
 */
export function addressFromScriptPublicKey(script_public_key: ScriptPublicKey | HexString, network: NetworkType | NetworkId | string): Address | undefined;
/**
 * Generates a signature script that fits a pay-to-script-hash script.
 * @param redeem_script - The redeem script ({@link HexString} or Uint8Array).
 * @param signature - The signature ({@link HexString} or Uint8Array).
 * @category Wallet SDK
 */
export function payToScriptHashSignatureScript(redeem_script: HexString | Uint8Array, signature: HexString | Uint8Array): HexString;
/**
 * Computes the covenant ID from the genesis outpoint and its authorized outputs.
 *
 * `genesis_outpoint` may be a [`TransactionOutpoint`] instance or a
 * compatible plain object: `{ transactionId: HexString, index: number }`.
 *
 * `auth_outputs` is a JS array of objects, each with:
 * - `index: number` - position of this output in the transaction's output array
 * - `output: TransactionOutput | ITransactionOutput` - the authorized output
 *
 * @category Consensus
 */
export function covenantId(genesis_outpoint: ITransactionOutpoint | TransactionOutpoint, auth_outputs: ICovenantAuthorizedOutput[]): Hash;
/**
 * Calculates target from difficulty, based on set_difficulty function on
 * <https://github.com/tmrlvi/kaspa-miner/blob/bf361d02a46c580f55f46b5dfa773477634a5753/src/client/stratum.rs#L375>
 * @category Mining
 */
export function calculateTarget(difficulty: number): bigint;
/**
 * Signs a message with the given private key
 * @category Message Signing
 */
export function signMessage(value: ISignMessage): HexString;
/**
 * Verifies with a public key the signature of the given message
 * @category Message Signing
 */
export function verifyMessage(value: IVerifyMessage): boolean;
/**
 * `updateTransactionMass()` updates the mass property of the passed transaction.
 * If the transaction is invalid, the function throws an error.
 *
 * The function returns `true` if the mass is within the maximum standard transaction mass and
 * the transaction mass is updated. Otherwise, the function returns `false`.
 *
 * This is similar to `calculateTransactionMass()` but modifies the supplied
 * `Transaction` object.
 *
 * @category Wallet SDK
 * @see {@link maximumStandardTransactionMass}
 * @see {@link calculateTransactionMass}
 * @see {@link calculateTransactionFee}
 */
export function updateTransactionMass(network_id: NetworkId | string, tx: Transaction, minimum_signatures?: number | null): boolean;
/**
 * `calculateTransactionFee()` returns minimum fees needed for the transaction to be
 * accepted by the network. If the transaction is invalid or the mass can not be calculated,
 * the function throws an error. If the mass exceeds the maximum standard transaction mass,
 * the function returns `undefined`.
 *
 * @category Wallet SDK
 * @see {@link maximumStandardTransactionMass}
 * @see {@link calculateTransactionMass}
 * @see {@link updateTransactionMass}
 */
export function calculateTransactionFee(network_id: NetworkId | string, tx: ITransaction | Transaction, minimum_signatures?: number | null): bigint | undefined;
/**
 * `calculateTransactionMass()` returns the mass of the passed transaction.
 * If the transaction is invalid, or the mass can not be calculated
 * the function throws an error.
 *
 * The mass value must not exceed the maximum standard transaction mass
 * that can be obtained using `maximumStandardTransactionMass()`.
 *
 * @category Wallet SDK
 * @see {@link maximumStandardTransactionMass}
 */
export function calculateTransactionMass(network_id: NetworkId | string, tx: ITransaction | Transaction, minimum_signatures?: number | null): bigint;
/**
 * `calculateStorageMass()` is a helper function to compute the storage mass of inputs and outputs.
 * This function can be use to calculate the storage mass of transaction inputs and outputs.
 * Note that the storage mass is only a component of the total transaction mass. You are not
 * meant to use this function by itself and should use `calculateTransactionMass()` instead.
 * This function purely exists for diagnostic purposes and to help with complex algorithms that
 * may require a manual UTXO selection for identifying UTXOs and outputs needed for low storage mass.
 *
 * @category Wallet SDK
 * @see {@link maximumStandardTransactionMass}
 * @see {@link calculateTransactionMass}
 */
export function calculateStorageMass(network_id: NetworkId | string, input_values: Array<number>, output_values: Array<number>): bigint | undefined;
/**
 * `maximumStandardTransactionMass()` returns the maximum transaction
 * size allowed by the network.
 *
 * @category Wallet SDK
 * @see {@link calculateTransactionMass}
 * @see {@link updateTransactionMass}
 * @see {@link calculateTransactionFee}
 */
export function maximumStandardTransactionMass(): bigint;
/**
 *
 * Format a Sompi amount to a string representation of the amount in Kaspa with a suffix
 * based on the network type (e.g. `KAS` for mainnet, `TKAS` for testnet,
 * `SKAS` for simnet, `DKAS` for devnet).
 *
 * @category Wallet SDK
 */
export function sompiToKaspaStringWithSuffix(sompi: bigint | number | HexString, network: NetworkType | NetworkId | string): string;
/**
 * Convert a Kaspa string to Sompi represented by bigint.
 * This function provides correct precision handling and
 * can be used to parse user input.
 * @category Wallet SDK
 */
export function kaspaToSompi(kaspa: string): bigint | undefined;
export function getNetworkParams(networkId: NetworkId | string): INetworkParams;
/**
 *
 * Convert Sompi to a string representation of the amount in Kaspa.
 *
 * @category Wallet SDK
 */
export function sompiToKaspaString(sompi: bigint | number | HexString): string;
export function getTransactionMaturityProgress(blockDaaScore: bigint, currentDaaScore: bigint, networkId: NetworkId | string, isCoinbase: boolean): string;
/**
 * `createInputSignature()` is a helper function to sign a transaction input with a specific SigHash type using a private key.
 * @category Wallet SDK
 */
export function createInputSignature(tx: Transaction, input_index: number, private_key: PrivateKey, sighash_type?: SighashType | null): HexString;
/**
 * `signTransaction()` is a helper function to sign a transaction using a private key array or a signer array.
 * @category Wallet SDK
 */
export function signTransaction(tx: Transaction, signer: (PrivateKey | HexString | Uint8Array)[], verify_sig: boolean): Transaction;
/**
 * @category Wallet SDK
 */
export function signScriptHash(script_hash: any, privkey: PrivateKey): string;
/**
 * Set a custom storage folder for the wallet SDK
 * subsystem.  Encrypted wallet files and transaction
 * data will be stored in this folder. If not set
 * the storage folder will default to `~/.kaspa`
 * (note that the folder is hidden).
 *
 * This must be called before using any other wallet
 * SDK functions.
 *
 * NOTE: This function will create a folder if it
 * doesn't exist. This function will have no effect
 * if invoked in the browser environment.
 *
 * @param {String} folder - the path to the storage folder
 *
 * @category Wallet API
 */
export function setDefaultStorageFolder(folder: string): void;
/**
 * Set the name of the default wallet file name
 * or the `localStorage` key.  If `Wallet::open`
 * is called without a wallet file name, this name
 * will be used.  Please note that this name
 * will be suffixed with `.wallet` suffix.
 *
 * This function should be called before using any
 * other wallet SDK functions.
 *
 * @param {String} folder - the name to the wallet file or key.
 *
 * @category Wallet API
 */
export function setDefaultWalletFile(folder: string): void;
/**
 * @category Wallet SDK
 */
export function createAddress(key: PublicKey | string, network: NetworkType | NetworkId | string, ecdsa?: boolean | null, account_kind?: AccountKind | null): Address;
/**
 * @category Wallet SDK
 */
export function createMultisigAddress(minimum_signatures: number, keys: (PublicKey | string)[], network_type: NetworkType, ecdsa?: boolean | null, account_kind?: AccountKind | null): Address;
/**
 * WASM32 binding for `encryptXChaCha20Poly1305` function.
 * @returns The encrypted text as a base64 string.
 * @category Encryption
 */
export function encryptXChaCha20Poly1305(plainText: string, password: string): string;
/**
 * WASM32 binding for `SHA256d` hash function.
 * @param data - The data to hash ({@link HexString} or Uint8Array).
 * @category Encryption
 */
export function sha256dFromBinary(data: HexString | Uint8Array): HexString;
/**
 * WASM32 binding for `decryptXChaCha20Poly1305` function.
 * @category Encryption
 */
export function decryptXChaCha20Poly1305(base64string: string, password: string): string;
/**
 * WASM32 binding for `SHA256d` hash function.
 * @param {string} text - The text string to hash.
 * @category Encryption
 */
export function sha256dFromText(text: string): HexString;
/**
 * WASM32 binding for `SHA256` hash function.
 * @param data - The data to hash ({@link HexString} or Uint8Array).
 * @category Encryption
 */
export function sha256FromBinary(data: HexString | Uint8Array): HexString;
/**
 * WASM32 binding for `argon2sha256iv` hash function.
 * @param data - The data to hash ({@link HexString} or Uint8Array).
 * @category Encryption
 */
export function argon2sha256ivFromBinary(data: HexString | Uint8Array, hashLength: number): HexString;
/**
 * WASM32 binding for `argon2sha256iv` hash function.
 * @param text - The text string to hash.
 * @category Encryption
 */
export function argon2sha256ivFromText(text: string, byteLength: number): HexString;
/**
 * WASM32 binding for `SHA256` hash function.
 * @param {string} text - The text string to hash.
 * @category Encryption
 */
export function sha256FromText(text: string): HexString;
/**
 * Helper function that creates an estimate using the transaction {@link Generator}
 * by producing only the {@link GeneratorSummary} containing the estimate.
 * @see {@link IGeneratorSettingsObject}, {@link Generator}, {@link createTransactions}
 * @category Wallet SDK
 */
export function estimateTransactions(settings: IGeneratorSettingsObject): Promise<GeneratorSummary>;
/**
 * Helper function that creates a set of transactions using the transaction {@link Generator}.
 * @see {@link IGeneratorSettingsObject}, {@link Generator}, {@link estimateTransactions}
 * @category Wallet SDK
 */
export function createTransactions(settings: IGeneratorSettingsObject): Promise<ICreateTransactions>;
/**
 * Create a basic transaction without any mass limit checks.
 * @category Wallet SDK
 */
export function createTransaction(utxo_entry_source: IUtxoEntry[], outputs: IPaymentOutput[], priority_fee: bigint, payload?: HexString | Uint8Array | null, sig_op_count?: number | null): Transaction;
/**
 * Returns the version of the Rusty Kaspa framework.
 * @category General
 */
export function version(): string;
/**
 * Set the logger log level using a string representation.
 * Available variants are: 'off', 'error', 'warn', 'info', 'debug', 'trace'
 * @category General
 */
export function setLogLevel(level: "off" | "error" | "warn" | "info" | "debug" | "trace"): void;
/**
 * Configuration for the WASM32 bindings runtime interface.
 * @see {@link IWASM32BindingsConfig}
 * @category General
 */
export function initWASM32Bindings(config: IWASM32BindingsConfig): void;
/**
 * Initialize Rust panic handler in browser mode.
 *
 * This will output additional debug information during a panic in the browser
 * by creating a full-screen `DIV`. This is useful on mobile devices or where
 * the user otherwise has no access to console/developer tools. Use
 * {@link presentPanicHookLogs} to activate the panic logs in the
 * browser environment.
 * @see {@link presentPanicHookLogs}
 * @category General
 */
export function initBrowserPanicHook(): void;
/**
 * Initialize Rust panic handler in console mode.
 *
 * This will output additional debug information during a panic to the console.
 * This function should be called right after loading WASM libraries.
 * @category General
 */
export function initConsolePanicHook(): void;
/**
 * Present panic logs to the user in the browser.
 *
 * This function should be called after a panic has occurred and the
 * browser-based panic hook has been activated. It will present the
 * collected panic logs in a full-screen `DIV` in the browser.
 * @see {@link initBrowserPanicHook}
 * @category General
 */
export function presentPanicHookLogs(): void;
/**
 * r" Deferred promise - an object that has `resolve()` and `reject()`
 * r" functions that can be called outside of the promise body.
 * r" WARNING: This function uses `eval` and can not be used in environments
 * r" where dynamically-created code can not be executed such as web browser
 * r" extensions.
 * r" @category General
 */
export function defer(): Promise<any>;
/**
 * @category Wallet API
 */
export enum AccountsDiscoveryKind {
  Bip44 = 0,
}
/**
 *
 *  Kaspa `Address` version (`PubKey`, `PubKey ECDSA`, `ScriptHash`)
 *
 * @category Address
 */
export enum AddressVersion {
  /**
   * PubKey addresses always have the version byte set to 0
   */
  PubKey = 0,
  /**
   * PubKey ECDSA addresses always have the version byte set to 1
   */
  PubKeyECDSA = 1,
  /**
   * ScriptHash addresses always have the version byte set to 8
   */
  ScriptHash = 8,
}
/**
 * Specifies the type of an account address to be used in
 * commit reveal redeem script and also to spend reveal
 * operation to.
 *
 * @category Wallet API
 */
export enum CommitRevealAddressKind {
  Receive = 0,
  Change = 1,
}
/**
 * `ConnectionStrategy` specifies how the WebSocket `async fn connect()`
 * function should behave during the first-time connectivity phase.
 * @category WebSocket
 */
export enum ConnectStrategy {
  /**
   * Continuously attempt to connect to the server. This behavior will
   * block `connect()` function until the connection is established.
   */
  Retry = 0,
  /**
   * Causes `connect()` to return immediately if the first-time connection
   * has failed.
   */
  Fallback = 1,
}
/**
 * wRPC protocol encoding: `Borsh` or `JSON`
 * @category Transport
 */
export enum Encoding {
  Borsh = 0,
  SerdeJson = 1,
}
/**
 *
 * @see {@link IFees}, {@link IGeneratorSettingsObject}, {@link Generator}, {@link estimateTransactions}, {@link createTransactions}
 * @category Wallet SDK
 */
export enum FeeSource {
  SenderPays = 0,
  ReceiverPays = 1,
}
/**
 *
 * Languages supported by BIP39.
 *
 * Presently only English is specified by the BIP39 standard.
 *
 * @see {@link Mnemonic}
 *
 * @category Wallet SDK
 */
export enum Language {
  /**
   * English is presently the only supported language
   */
  English = 0,
}
/**
 * @category Consensus
 */
export enum NetworkType {
  Mainnet = 0,
  Testnet = 1,
  Devnet = 2,
  Simnet = 3,
}
/**
 * Specifies the type of an account address to create.
 * The address can bea receive address or a change address.
 *
 * @category Wallet API
 */
export enum NewAddressKind {
  Receive = 0,
  Change = 1,
}
/**
 * Kaspa Transaction Script Opcodes
 * @see {@link ScriptBuilder}
 * @category Consensus
 */
export enum Opcodes {
  OpFalse = 0,
  OpData1 = 1,
  OpData2 = 2,
  OpData3 = 3,
  OpData4 = 4,
  OpData5 = 5,
  OpData6 = 6,
  OpData7 = 7,
  OpData8 = 8,
  OpData9 = 9,
  OpData10 = 10,
  OpData11 = 11,
  OpData12 = 12,
  OpData13 = 13,
  OpData14 = 14,
  OpData15 = 15,
  OpData16 = 16,
  OpData17 = 17,
  OpData18 = 18,
  OpData19 = 19,
  OpData20 = 20,
  OpData21 = 21,
  OpData22 = 22,
  OpData23 = 23,
  OpData24 = 24,
  OpData25 = 25,
  OpData26 = 26,
  OpData27 = 27,
  OpData28 = 28,
  OpData29 = 29,
  OpData30 = 30,
  OpData31 = 31,
  OpData32 = 32,
  OpData33 = 33,
  OpData34 = 34,
  OpData35 = 35,
  OpData36 = 36,
  OpData37 = 37,
  OpData38 = 38,
  OpData39 = 39,
  OpData40 = 40,
  OpData41 = 41,
  OpData42 = 42,
  OpData43 = 43,
  OpData44 = 44,
  OpData45 = 45,
  OpData46 = 46,
  OpData47 = 47,
  OpData48 = 48,
  OpData49 = 49,
  OpData50 = 50,
  OpData51 = 51,
  OpData52 = 52,
  OpData53 = 53,
  OpData54 = 54,
  OpData55 = 55,
  OpData56 = 56,
  OpData57 = 57,
  OpData58 = 58,
  OpData59 = 59,
  OpData60 = 60,
  OpData61 = 61,
  OpData62 = 62,
  OpData63 = 63,
  OpData64 = 64,
  OpData65 = 65,
  OpData66 = 66,
  OpData67 = 67,
  OpData68 = 68,
  OpData69 = 69,
  OpData70 = 70,
  OpData71 = 71,
  OpData72 = 72,
  OpData73 = 73,
  OpData74 = 74,
  OpData75 = 75,
  OpPushData1 = 76,
  OpPushData2 = 77,
  OpPushData4 = 78,
  Op1Negate = 79,
  OpReserved = 80,
  OpTrue = 81,
  Op2 = 82,
  Op3 = 83,
  Op4 = 84,
  Op5 = 85,
  Op6 = 86,
  Op7 = 87,
  Op8 = 88,
  Op9 = 89,
  Op10 = 90,
  Op11 = 91,
  Op12 = 92,
  Op13 = 93,
  Op14 = 94,
  Op15 = 95,
  Op16 = 96,
  OpNop = 97,
  OpVer = 98,
  OpIf = 99,
  OpNotIf = 100,
  OpVerIf = 101,
  OpVerNotIf = 102,
  OpElse = 103,
  OpEndIf = 104,
  OpVerify = 105,
  OpReturn = 106,
  OpToAltStack = 107,
  OpFromAltStack = 108,
  Op2Drop = 109,
  Op2Dup = 110,
  Op3Dup = 111,
  Op2Over = 112,
  Op2Rot = 113,
  Op2Swap = 114,
  OpIfDup = 115,
  OpDepth = 116,
  OpDrop = 117,
  OpDup = 118,
  OpNip = 119,
  OpOver = 120,
  OpPick = 121,
  OpRoll = 122,
  OpRot = 123,
  OpSwap = 124,
  OpTuck = 125,
  /**
   * Splice opcodes.
   */
  OpCat = 126,
  OpSubstr = 127,
  OpLeft = 128,
  OpRight = 129,
  OpSize = 130,
  /**
   * Bitwise logic opcodes.
   */
  OpInvert = 131,
  OpAnd = 132,
  OpOr = 133,
  OpXor = 134,
  OpEqual = 135,
  OpEqualVerify = 136,
  OpReserved1 = 137,
  OpReserved2 = 138,
  /**
   * Numeric related opcodes.
   */
  Op1Add = 139,
  Op1Sub = 140,
  Op2Mul = 141,
  Op2Div = 142,
  OpNegate = 143,
  OpAbs = 144,
  OpNot = 145,
  Op0NotEqual = 146,
  OpAdd = 147,
  OpSub = 148,
  OpMul = 149,
  OpDiv = 150,
  OpMod = 151,
  OpLShift = 152,
  OpRShift = 153,
  OpBoolAnd = 154,
  OpBoolOr = 155,
  OpNumEqual = 156,
  OpNumEqualVerify = 157,
  OpNumNotEqual = 158,
  OpLessThan = 159,
  OpGreaterThan = 160,
  OpLessThanOrEqual = 161,
  OpGreaterThanOrEqual = 162,
  OpMin = 163,
  OpMax = 164,
  OpWithin = 165,
  /**
   * Undefined opcodes.
   */
  OpZkPrecompile = 166,
  OpBlake2bWithKey = 167,
  /**
   * Crypto opcodes.
   */
  OpSHA256 = 168,
  OpCheckMultiSigECDSA = 169,
  OpBlake2b = 170,
  OpCheckSigECDSA = 171,
  OpCheckSig = 172,
  OpCheckSigVerify = 173,
  OpCheckMultiSig = 174,
  OpCheckMultiSigVerify = 175,
  OpCheckLockTimeVerify = 176,
  OpCheckSequenceVerify = 177,
  /**
   * Transaction introspection opcodes.
   */
  OpTxVersion = 178,
  OpTxInputCount = 179,
  OpTxOutputCount = 180,
  OpTxLockTime = 181,
  OpTxSubnetId = 182,
  OpTxGas = 183,
  OpTxPayloadSubstr = 184,
  OpTxInputIndex = 185,
  OpOutpointTxId = 186,
  OpOutpointIndex = 187,
  OpTxInputScriptSigSubstr = 188,
  OpTxInputSeq = 189,
  OpTxInputAmount = 190,
  OpTxInputSpk = 191,
  OpTxInputDaaScore = 192,
  OpTxInputIsCoinbase = 193,
  OpTxOutputAmount = 194,
  OpTxOutputSpk = 195,
  OpTxPayloadLen = 196,
  OpTxInputSpkLen = 197,
  OpTxInputSpkSubstr = 198,
  OpTxOutputSpkLen = 199,
  OpTxOutputSpkSubstr = 200,
  OpTxInputScriptSigLen = 201,
  OpUnknown202 = 202,
  OpAuthOutputCount = 203,
  OpAuthOutputIdx = 204,
  OpNum2Bin = 205,
  OpBin2Num = 206,
  OpInputCovenantId = 207,
  OpCovInputCount = 208,
  OpCovInputIdx = 209,
  OpCovOutputCount = 210,
  OpCovOutputIdx = 211,
  OpChainblockSeqCommit = 212,
  OpOutputCovenantId = 213,
  OpUnknown214 = 214,
  OpCheckSigFromStack = 215,
  OpCheckSigFromStackECDSA = 216,
  OpBlake3 = 217,
  OpBlake3WithKey = 218,
  OpUnknown219 = 219,
  OpUnknown220 = 220,
  OpUnknown221 = 221,
  OpUnknown222 = 222,
  OpUnknown223 = 223,
  OpUnknown224 = 224,
  OpUnknown225 = 225,
  OpUnknown226 = 226,
  OpUnknown227 = 227,
  OpUnknown228 = 228,
  OpUnknown229 = 229,
  OpUnknown230 = 230,
  OpUnknown231 = 231,
  OpUnknown232 = 232,
  OpUnknown233 = 233,
  OpUnknown234 = 234,
  OpUnknown235 = 235,
  OpUnknown236 = 236,
  OpUnknown237 = 237,
  OpUnknown238 = 238,
  OpUnknown239 = 239,
  OpUnknown240 = 240,
  OpUnknown241 = 241,
  OpUnknown242 = 242,
  OpUnknown243 = 243,
  OpUnknown244 = 244,
  OpUnknown245 = 245,
  OpUnknown246 = 246,
  OpUnknown247 = 247,
  OpUnknown248 = 248,
  OpUnknown249 = 249,
  OpSmallInteger = 250,
  OpPubKeys = 251,
  OpUnknown252 = 252,
  OpPubKeyHash = 253,
  OpPubKey = 254,
  OpInvalidOpCode = 255,
}
/**
 * Kaspa Sighash types allowed by consensus
 * @category Consensus
 */
export enum SighashType {
  All = 0,
  None = 1,
  Single = 2,
  AllAnyOneCanPay = 3,
  NoneAnyOneCanPay = 4,
  SingleAnyOneCanPay = 5,
}

/**
 * Interface defining the structure of a transaction.
 *
 * @category Consensus
 */
export interface ITransaction {
    version: number;
    inputs: ITransactionInput[];
    outputs: ITransactionOutput[];
    lockTime: bigint;
    subnetworkId: HexString;
    gas: bigint;
    payload: HexString;

    /**
     * @deprecated since version 1.3.0, use `storageMass`
    */
    mass?: bigint;

    /** The mass of the transaction (the mass is undefined or zero unless explicitly set or obtained from the node) */
    storageMass?: bigint;

    /** Optional verbose data provided by RPC */
    verboseData?: ITransactionVerboseData;
}

/**
 * Optional transaction verbose data.
 *
 * @category Node RPC
 */
export interface ITransactionVerboseData {
    transactionId : HexString;
    hash : HexString;
    computeMass : bigint;
    blockHash : HexString;
    blockTime : bigint;
}



/**
 * Interface defining the structure of a transaction output.
 * 
 * @category Consensus
 */
export interface ITransactionOutput {
    value: bigint;
    scriptPublicKey: IScriptPublicKey | HexString;

    /** Optional verbose data provided by RPC */
    verboseData?: ITransactionOutputVerboseData;
}

/**
 * TransactionOutput verbose data.
 * 
 * @category Node RPC
 */
export interface ITransactionOutputVerboseData {
    scriptPublicKeyType : string;
    scriptPublicKeyAddress : string;
}



/**
 * Interface defines the structure of a UTXO entry.
 * 
 * @category Consensus
 */
export interface IUtxoEntry {
    /** @readonly */
    address?: Address;
    /** @readonly */
    outpoint: ITransactionOutpoint;
    /** @readonly */
    amount : bigint;
    /** @readonly */
    scriptPublicKey : IScriptPublicKey;
    /** @readonly */
    blockDaaScore: bigint;
    /** @readonly */
    isCoinbase: boolean;
}




/**
 * Interface defines the structure of a transaction input.
 * 
 * @category Consensus
 */
export interface ITransactionInput {
    previousOutpoint: ITransactionOutpoint;
    signatureScript?: HexString;
    sequence: bigint;
    sigOpCount: number;
    computeBudget?: number;
    utxo?: UtxoEntryReference;

    /** Optional verbose data provided by RPC */
    verboseData?: ITransactionInputVerboseData;
}

/**
 * Option transaction input verbose data.
 * 
 * @category Node RPC
 */
export interface ITransactionInputVerboseData { }





/**
 * Interface defines the structure of a serializable UTXO entry.
 * 
 * @see {@link ISerializableTransactionInput}, {@link ISerializableTransaction}
 * @category Wallet SDK
 */
export interface ISerializableUtxoEntry {
    address?: Address;
    amount: bigint;
    scriptPublicKey: ScriptPublicKey;
    blockDaaScore: bigint;
    isCoinbase: boolean;
}

/**
 * Interface defines the structure of a serializable transaction input.
 * 
 * @see {@link ISerializableTransaction}
 * @category Wallet SDK
 */
export interface ISerializableTransactionInput {
    transactionId : HexString;
    index: number;
    sequence: bigint;
    sigOpCount: number;
    computeBudget?: number;
    signatureScript?: HexString;
    utxo: ISerializableUtxoEntry;
}

/**
 * Interface defines the structure of a serializable transaction output.
 * 
 * @see {@link ISerializableTransaction}
 * @category Wallet SDK
 */
export interface ISerializableTransactionOutput {
    value: bigint;
    scriptPublicKey: IScriptPublicKey;
}

/**
 * Interface defines the structure of a serializable transaction.
 * 
 * Serializable transactions can be produced using 
 * {@link Transaction.serializeToJSON},
 * {@link Transaction.serializeToSafeJSON} and 
 * {@link Transaction.serializeToObject} 
 * functions for processing (signing) in external systems.
 * 
 * Once the transaction is signed, it can be deserialized
 * into {@link Transaction} using {@link Transaction.deserializeFromJSON}
 * and {@link Transaction.deserializeFromSafeJSON} functions. 
 * 
 * @see {@link Transaction},
 * {@link ISerializableTransactionInput},
 * {@link ISerializableTransactionOutput},
 * {@link ISerializableUtxoEntry}
 * 
 * @category Wallet SDK
 */
export interface ISerializableTransaction {
    id? : HexString;
    version: number;
    inputs: ISerializableTransactionInput[];
    outputs: ISerializableTransactionOutput[];
    lockTime: bigint;
    subnetworkId: HexString;
    gas: bigint;
    payload: HexString;
}




/**
 * Interface defining the structure of a block header.
 *
 * @category Consensus
 */
export interface IHeader {
    hash: HexString;
    version: number;
    parentsByLevel: Array<Array<HexString>>;
    hashMerkleRoot: HexString;
    acceptedIdMerkleRoot: HexString;
    utxoCommitment: HexString;
    timestamp: bigint;
    bits: number;
    nonce: bigint;
    daaScore: bigint;
    blueWork: bigint | HexString;
    blueScore: bigint;
    pruningPoint: HexString;
}

/**
 * Interface defining the structure of a raw block header.
 *
 * This interface is explicitly used by GetBlockTemplate and SubmitBlock RPCs
 * and unlike `IHeader`, does not include a hash.
 *
 * @category Consensus
 */
export interface IRawHeader {
    version: number;
    parentsByLevel: Array<Array<HexString>>;
    hashMerkleRoot: HexString;
    acceptedIdMerkleRoot: HexString;
    utxoCommitment: HexString;
    timestamp: bigint;
    bits: number;
    nonce: bigint;
    daaScore: bigint;
    blueWork: bigint | HexString;
    blueScore: bigint;
    pruningPoint: HexString;
}



/**
 * A genesis covenant group for bulk covenant binding population.
 *
 * @category Consensus
 */
export interface IGenesisCovenantGroup {
    authorizingInput: number;
    outputs: number[];
}



/**
 * A covenant binding binds a transaction output to the covenant and input authorizing its creation.
 *
 * @category Consensus
 */
export interface ICovenantBinding {
    authorizingInput: number;
    covenantId: HexString;
}



/**
 * Represents a block header where all fields are optional.
 *
 * @category Consensus
 */
export interface IOptionalHeader {
    hash?: HexString;
    version?: number;
    parentsByLevel?: CompressedParents;
    hashMerkleRoot?: HexString;
    acceptedIdMerkleRoot?: HexString;
    utxoCommitment?: HexString;
    timestamp?: bigint;
    bits?: number;
    nonce?: bigint;
    daaScore?: bigint;
    blueWork?: bigint | HexString;
    blueScore?: bigint;
    pruningPoint?: HexString;
}



/**
 * An output authorized by the genesis outpoint for covenant ID derivation.
 *
 * @category Consensus
 */
export interface ICovenantAuthorizedOutput {
    index: number;
    output: ITransactionOutput | TransactionOutput;
}



/**
 * Block Color
 *
 * @category Consensus
 */
 export type BlockColor = "blue" | "red" | "unknown";
 


/**
 * Interface defines the structure of a transaction outpoint (used by transaction input).
 * 
 * @category Consensus
 */
export interface ITransactionOutpoint {
    transactionId: HexString;
    index: number;
}



/**
 * Interface defines the structure of a Script Public Key.
 * 
 * @category Consensus
 */
export interface IScriptPublicKey {
    version : number;
    script: HexString;
}



        /**
         * Interface defining the structure of a block.
         *
         * @category Consensus
         */
        export interface IBlock {
            header: IHeader;
            transactions: ITransaction[];
            verboseData?: IBlockVerboseData;
        }

        /**
         * Interface defining the structure of a block verbose data.
         *
         * @category Node RPC
         */
        export interface IBlockVerboseData {
            hash: HexString;
            difficulty: number;
            selectedParentHash: HexString;
            transactionIds: HexString[];
            isHeaderOnly: boolean;
            blueScore: number;
            childrenHashes: HexString[];
            mergeSetBluesHashes: HexString[];
            mergeSetRedsHashes: HexString[];
            isChainBlock: boolean;
        }

        /**
         * Interface defining the structure of a raw block.
         *
         * Raw block is a structure used by GetBlockTemplate and SubmitBlock RPCs
         * and differs from `IBlock` in that it does not include verbose data and carries
         * `IRawHeader` that does not include a cached block hash.
         *
         * @category Consensus
         */
        export interface IRawBlock {
            header: IRawHeader;
            transactions: ITransaction[];
        }

        


            /**
             * Mempool entry.
             * 
             * @category Node RPC
             */
            export interface IMempoolEntry {
                fee : bigint;
                transaction : ITransaction;
                isOrphan : boolean;
            }
        


/**
* Return interface for the {@link RpcClient.submitBlock} RPC method.
*
*
* @category Node RPC
*/
    export interface ISubmitBlockResponse {
        report : ISubmitBlockReport;
    }
    


/**
* Argument interface for the {@link RpcClient.getSubnetwork} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetSubnetworkRequest {
        subnetworkId : HexString;
    }
    


/**
* Argument interface for the {@link RpcClient.getCurrentBlockColor} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetCurrentBlockColorRequest {
        hash: HexString;
    }
    


    /**
     * Data Verbosity level
     *
     * @category Node RPC
     */
    export type DataVerbosityLevel = "None" | "Low" | "High" | "Full";



/**
* Argument interface for the {@link RpcClient.getMempoolEntry} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetMempoolEntryRequest {
        transactionId : HexString;
        includeOrphanPool? : boolean;
        filterTransactionPool? : boolean;
    }
    


/**
* Return interface for the {@link RpcClient.getMempoolEntries} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetMempoolEntriesResponse {
        mempoolEntries : IMempoolEntry[];
    }
    


/**
* Argument interface for the {@link RpcClient.getBalancesByAddresses} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetBalancesByAddressesRequest {
        addresses : Address[] | string[];
    }
    


/**
* Return interface for the {@link RpcClient.resolveFinalityConflict} RPC method.
*
*
* @category Node RPC
*/
    export interface IResolveFinalityConflictResponse { }
    


/**
* Argument interface for the {@link RpcClient.getSyncStatus} RPC method.
* @category Node RPC
*/
    export interface IGetSyncStatusRequest { }
    


/**
* Argument interface for the {@link RpcClient.getSink} RPC method.
* @category Node RPC
*/
    export interface IGetSinkRequest { }
    


/**
* Argument interface for the {@link RpcClient.getBalanceByAddress} RPC method.
* @category Node RPC
*/
    export interface IGetBalanceByAddressRequest {
        address : Address | string;
    }
    


/**
* Argument interface for the {@link RpcClient.submitTransaction} RPC method.
* Submit transaction to the node.
*
* @category Node RPC
*/
    export interface ISubmitTransactionRequest {
        transaction : Transaction,
        allowOrphan? : boolean
    }
    


/**
* Return interface for the {@link RpcClient.addPeer} RPC method.
*
*
* @category Node RPC
*/
    export interface IAddPeerResponse { }
    


/**
* Argument interface for the {@link RpcClient.ping} RPC method.
* @category Node RPC
*/
    export interface IPingRequest {
        message?: string;
    }
    


/**
* Return interface for the {@link RpcClient.getBlockCount} RPC method.
* @category Node RPC
*/
    export interface IGetBlockCountResponse {
        headerCount : bigint;
        blockCount : bigint;
    }
    


    /**
     *
     *
     * @category Node RPC
     */
    export interface IFeeEstimateVerboseExperimentalData {
        mempoolReadyTransactionsCount : bigint;
        mempoolReadyTransactionsTotalMass : bigint;
        networkMassPerSecond : bigint;
        nextBlockTemplateFeerateMin : number;
        nextBlockTemplateFeerateMedian : number;
        nextBlockTemplateFeerateMax : number;
    }
    


/**
* Argument interface for the {@link RpcClient.getServerInfo} RPC method.
* @category Node RPC
*/
    export interface IGetServerInfoRequest { }
    


/**
* Return interface for the {@link RpcClient.getBalanceByAddress} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetBalanceByAddressResponse {
        balance : bigint;
    }
    


/**
* Argument interface for the {@link RpcClient.submitBlock} RPC method.
*
*
* @category Node RPC
*/
    export interface ISubmitBlockRequest {
        block : IRawBlock;
        allowNonDAABlocks: boolean;
    }
    


/**
* Argument interface for the {@link RpcClient.shutdown} RPC method.
* @category Node RPC
*/
    export interface IShutdownRequest { }
    


    /**
     * Accepted transaction IDs.
     *
     * @category Node RPC
     */
    export interface IAcceptedTransactionIds {
        acceptingBlockHash : HexString;
        acceptedTransactionIds : HexString[];
    }



/**
* Return interface for the {@link RpcClient.getDaaScoreTimestampEstimate} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetDaaScoreTimestampEstimateResponse {
        timestamps : bigint[];
    }
    


/**
* Return interface for the {@link RpcClient.getUtxosByAddresses} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetUtxosByAddressesResponse {
        entries : UtxoEntryReference[];
    }
    


/**
* Return interface for the {@link RpcClient.estimateNetworkHashesPerSecond} RPC method.
* @category Node RPC
*/
    export interface IEstimateNetworkHashesPerSecondResponse {
        networkHashesPerSecond : bigint;
    }
    


/**
* Return interface for the {@link RpcClient.getServerInfo} RPC method.
* @category Node RPC
*/
    export interface IGetServerInfoResponse {
        rpcApiVersion : number[];
        serverVersion : string;
        networkId : string;
        hasUtxoIndex : boolean;
        isSynced : boolean;
        virtualDaaScore : bigint;
    }
    


/**
* Return interface for the {@link RpcClient.getSyncStatus} RPC method.
* @category Node RPC
*/
    export interface IGetSyncStatusResponse {
        isSynced : boolean;
    }
    


/**
* Argument interface for the {@link RpcClient.getVirtualChainFromBlock} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetVirtualChainFromBlockRequest {
        startHash : HexString;
        includeAcceptedTransactionIds: boolean;
/**
* If passed, this request will only return blocks that have at least minConfirmationCount number of confirmations. Confirmation is counted through the distance from virtual chain tip.
* If not passed, it will be interpreted as 0.
*/
        minConfirmationCount?: number;
    }
    


/**
* Return interface for the {@link RpcClient.getInfo} RPC method.
* @category Node RPC
*/
    export interface IGetInfoResponse {
        p2pId : string;
        mempoolSize : bigint;
        serverVersion : string;
        isUtxoIndexed : boolean;
        isSynced : boolean;
/** GRPC ONLY */
        hasNotifyCommand : boolean;
/** GRPC ONLY */
        hasMessageId : boolean;
    }
    


/**
* Argument interface for the {@link RpcClient.ban} RPC method.
*
*
* @category Node RPC
*/
    export interface IBanRequest {
/**
* IPv4 or IPv6 address to ban.
*/
        ip : string;
    }
    


/**
* Return interface for the {@link RpcClient.getVirtualChainFromBlockV2} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetVirtualChainFromBlockV2Response {
        removedChainBlockHashes : HexString[];
        addedChainBlockHashes : HexString[];
        chainBlockAcceptedTransactions : IChainBlockAddedTransactions[];
    }
    


/**
* Argument interface for the {@link RpcClient.getInfo} RPC method.
* @category Node RPC
*/
    export interface IGetInfoRequest { }
    


/**
* Argument interface for the {@link RpcClient.getConnectedPeerInfo} RPC method.
* @category Node RPC
*/
    export interface IGetConnectedPeerInfoRequest { }
    


/**
* Argument interface for the {@link RpcClient.getUtxosByAddresses} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetUtxosByAddressesRequest {
        addresses : Address[] | string[]
    }
    


/**
* Return interface for the {@link RpcClient.getSinkBlueScore} RPC method.
* @category Node RPC
*/
    export interface IGetSinkBlueScoreResponse {
        blueScore : bigint;
    }
    


/**
* Argument interface for the {@link RpcClient.getHeaders} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetHeadersRequest {
        startHash : HexString;
        limit : bigint;
        isAscending : boolean;
    }
    


    /**
     * Accepted Acceptance Data
     *
     * @category Node RPC
     */
    export interface IChainBlockAddedTransactions {
        chainBlockHeader: IOptionalHeader;
        // small hack because wasm doesn't define OptionalTransaction utility
        acceptedTransactions: Partial<ITransaction>[];
    }



/**
* Argument interface for the {@link RpcClient.getBlockCount} RPC method.
* @category Node RPC
*/
    export interface IGetBlockCountRequest { }
    


/**
* Argument interface for the {@link RpcClient.getMetrics} RPC method.
* @category Node RPC
*/
    export interface IGetMetricsRequest { }
    


/**
* Return interface for the {@link RpcClient.shutdown} RPC method.
* @category Node RPC
*/
    export interface IShutdownResponse { }
    


    /**
     *
     *
     * @category Node RPC
     */
    export interface IFeerateBucket {
        /**
         * The fee/mass ratio estimated to be required for inclusion time <= estimated_seconds
         */
        feerate : number;
        /**
         * The estimated inclusion time for a transaction with fee/mass = feerate
         */
        estimatedSeconds : number;
    }
    


/**
* Return interface for the {@link RpcClient.getFeeEstimateExperimental} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetFeeEstimateExperimentalResponse {
        estimate : IFeeEstimate;
        verbose? : IFeeEstimateVerboseExperimentalData
    }
    


/**
* Return interface for the {@link RpcClient.ban} RPC method.
*
*
* @category Node RPC
*/
    export interface IBanResponse { }
    


/**
* Return interface for the {@link RpcClient.submitTransaction} RPC method.
*
*
* @category Node RPC
*/
    export interface ISubmitTransactionResponse {
        transactionId : HexString;
    }
    


/**
* Argument interface for the {@link RpcClient.getUtxoReturnAddress} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetUtxoReturnAddressRequest {
        txid: HexString;
        acceptingBlockDaaScore: bigint;
    }
    


/**
* Argument interface for the {@link RpcClient.getSinkBlueScore} RPC method.
* @category Node RPC
*/
    export interface IGetSinkBlueScoreRequest { }
    


/**
* Return interface for the {@link RpcClient.unban} RPC method.
*
*
* @category Node RPC
*/
    export interface IUnbanResponse { }
    


/**
* Argument interface for the {@link RpcClient.getBlockRewardInfo} RPC method.
* @category Node RPC
*/
    export interface IGetBlockRewardInfoRequest {
        hash: HexString;
    }
    


/**
* Argument interface for the {@link RpcClient.getCoinSupply} RPC method.
* @category Node RPC
*/
    export interface IGetCoinSupplyRequest { }
    


/**
* Return interface for the {@link RpcClient.getMempoolEntry} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetMempoolEntryResponse {
        mempoolEntry : IMempoolEntry;
    }
    


/**
* Return interface for the {@link RpcClient.getCoinSupply} RPC method.
* @category Node RPC
*/
    export interface IGetCoinSupplyResponse {
        maxSompi: bigint;
        circulatingSompi: bigint;
    }
    


/**
* Return interface for the {@link RpcClient.getHeaders} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetHeadersResponse {
        headers : IHeader[];
    }
    


/**
* Return interface for the {@link RpcClient.getPeerAddresses} RPC method.
* @category Node RPC
*/
    export interface IGetPeerAddressesResponse {
        [key: string]: any
    }
    


/**
* Argument interface for the {@link RpcClient.getConnections} RPC method.
* @category Node RPC
*/
    export interface IGetConnectionsRequest { }
    


/**
* Argument interface for the {@link RpcClient.getFeeEstimateExperimental} RPC method.
* Get fee estimate from the node.
*
* @category Node RPC
*/
    export interface IGetFeeEstimateExperimentalRequest { }
    


/**
* Return interface for the {@link RpcClient.getCurrentBlockColor} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetCurrentBlockColorResponse {
        blue: boolean;
    }
    


/**
* Argument interface for the {@link RpcClient.getFeeEstimate} RPC method.
* Get fee estimate from the node.
*
* @category Node RPC
*/
    export interface IGetFeeEstimateRequest { }
    


/**
* Return interface for the {@link RpcClient.getVirtualChainFromBlock} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetVirtualChainFromBlockResponse {
        removedChainBlockHashes : HexString[];
        addedChainBlockHashes : HexString[];
        acceptedTransactionIds : IAcceptedTransactionIds[];
    }
    


/**
* Return interface for the {@link RpcClient.getBalancesByAddresses} RPC method.
*
*
* @category Node RPC
*/
    export interface IBalancesByAddressesEntry {
        address : Address;
        balance : bigint;
    }
/**
*
*
* @category Node RPC
*/
    export interface IGetBalancesByAddressesResponse {
        entries : IBalancesByAddressesEntry[];
    }
    


/**
* Argument interface for the {@link RpcClient.unban} RPC method.
*
*
* @category Node RPC
*/
    export interface IUnbanRequest {
/**
* IPv4 or IPv6 address to unban.
*/
        ip : string;
    }
    


/**
* Argument interface for the {@link RpcClient.submitTransactionReplacement} RPC method.
* Submit transaction replacement to the node.
*
* @category Node RPC
*/
    export interface ISubmitTransactionReplacementRequest {
        transaction : Transaction,
    }
    


/**
* Return interface for the {@link RpcClient.getBlock} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetBlockResponse {
        block : IBlock;
    }
    


/**
* Return interface for the {@link RpcClient.getBlockTemplate} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetBlockTemplateResponse {
        block : IRawBlock;
    }
    


/**
* Return interface for the {@link RpcClient.getCurrentNetwork} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetCurrentNetworkResponse {
        network : string;
    }
    


/**
* Return interface for the {@link RpcClient.getSink} RPC method.
* @category Node RPC
*/
    export interface IGetSinkResponse {
        sink : HexString;
    }
    


/**
* Return interface for the {@link RpcClient.getMetrics} RPC method.
* @category Node RPC
*/
    export interface IGetMetricsResponse {
        [key: string]: any
    }
    


    /**
     *
     * @category Node RPC
     */
    export enum SubmitBlockRejectReason {
        /**
         * The block is invalid.
         */
        BlockInvalid = "BlockInvalid",
        /**
         * The node is not synced.
         */
        IsInIBD = "IsInIBD",
        /**
         * Route is full.
         */
        RouteIsFull = "RouteIsFull",
    }

    /**
     *
     * @category Node RPC
     */
    export interface ISubmitBlockReport {
        type : "success" | "reject";
        reason? : SubmitBlockRejectReason;
    }



/**
* Argument interface for the {@link RpcClient.getBlocks} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetBlocksRequest {
        lowHash? : HexString;
        includeBlocks : boolean;
        includeTransactions : boolean;
    }
    


/**
* Argument interface for the {@link RpcClient.getVirtualChainFromBlockV2} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetVirtualChainFromBlockV2Request {
        startHash : HexString;
        dataVerbosityLevel?: DataVerbosityLevel;
/**
* If passed, this request will only return blocks that have at least minConfirmationCount number of confirmations. Confirmation is counted through the distance from virtual chain tip.
* If not passed, it will be interpreted as 0.
*/
        minConfirmationCount?: number;
    }
    


/**
* Argument interface for the {@link RpcClient.addPeer} RPC method.
*
*
* @category Node RPC
*/
    export interface IAddPeerRequest {
        peerAddress : INetworkAddress;
        isPermanent : boolean;
    }
    


/**
* Return interface for the {@link RpcClient.getBlockDagInfo} RPC method.
* @category Node RPC
*/
    export interface IGetBlockDagInfoResponse {
        network: string;
        blockCount: bigint;
        headerCount: bigint;
        tipHashes: HexString[];
        difficulty: number;
        pastMedianTime: bigint;
        virtualParentHashes: HexString[];
        pruningPointHash: HexString;
        virtualDaaScore: bigint;
        sink: HexString;
    }
    


/**
* Argument interface for the {@link RpcClient.getDaaScoreTimestampEstimate} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetDaaScoreTimestampEstimateRequest {
        daaScores : bigint[];
    }
    


/**
* Argument interface for the {@link RpcClient.getCurrentNetwork} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetCurrentNetworkRequest { }
    


/**
* Return interface for the {@link RpcClient.getConnections} RPC method.
* @category Node RPC
*/
    export interface IGetConnectionsResponse {
        [key: string]: any
    }
    


/**
* Argument interface for the {@link RpcClient.getPeerAddresses} RPC method.
* @category Node RPC
*/
    export interface IGetPeerAddressesRequest { }
    


/**
* Return interface for the {@link RpcClient.submitTransactionReplacement} RPC method.
*
*
* @category Node RPC
*/
    export interface ISubmitTransactionReplacementResponse {
        transactionId : HexString;
        replacedTransaction: Transaction;
    }
    


/**
* Argument interface for the {@link RpcClient.getBlock} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetBlockRequest {
        hash : HexString;
        includeTransactions : boolean;
    }
    


    /**
     *
     *
     * @category Node RPC
     */
    export interface IFeeEstimate {
        /**
         * *Top-priority* feerate bucket. Provides an estimation of the feerate required for sub-second DAG inclusion.
         *
         * Note: for all buckets, feerate values represent fee/mass of a transaction in `sompi/gram` units.
         * Given a feerate value recommendation, calculate the required fee by
         * taking the transaction mass and multiplying it by feerate: `fee = feerate * mass(tx)`
         */

        priorityBucket : IFeerateBucket;
        /**
         * A vector of *normal* priority feerate values. The first value of this vector is guaranteed to exist and
         * provide an estimation for sub-*minute* DAG inclusion. All other values will have shorter estimation
         * times than all `low_bucket` values. Therefor by chaining `[priority] | normal | low` and interpolating
         * between them, one can compose a complete feerate function on the client side. The API makes an effort
         * to sample enough "interesting" points on the feerate-to-time curve, so that the interpolation is meaningful.
         */

        normalBuckets : IFeerateBucket[];
        /**
        * An array of *low* priority feerate values. The first value of this vector is guaranteed to
        * exist and provide an estimation for sub-*hour* DAG inclusion.
        */
        lowBuckets : IFeerateBucket[];
    }
    


/**
* Return interface for the {@link RpcClient.getMempoolEntriesByAddresses} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetMempoolEntriesByAddressesResponse {
        entries : IMempoolEntry[];
    }
    


/**
* Argument interface for the {@link RpcClient.getMempoolEntries} RPC method.
* @category Node RPC
*/
    export interface IGetMempoolEntriesRequest {
/** Whether or not to include the orphan pool (transactions which inputs are not known at this time) */
        includeOrphanPool: boolean;
/** Whether or not to filter out the transaction pool */
        filterTransactionPool: boolean;
    }
    


/**
* Argument interface for the {@link RpcClient.getMempoolEntriesByAddresses} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetMempoolEntriesByAddressesRequest {
        addresses : Address[] | string[];
/** Whether or not to include the orphan pool (transactions which inputs are not known at this time) */
        includeOrphanPool: boolean;
/** Whether or not to filter out the transaction pool */
        filterTransactionPool: boolean;
    }
    


/**
* Argument interface for the {@link RpcClient.getBlockDagInfo} RPC method.
* @category Node RPC
*/
    export interface IGetBlockDagInfoRequest { }
    


/**
* Argument interface for the {@link RpcClient.resolveFinalityConflict} RPC method.
*
*
* @category Node RPC
*/
    export interface IResolveFinalityConflictRequest {
        finalityBlockHash: HexString;
    }
    


/**
* Argument interface for the {@link RpcClient.estimateNetworkHashesPerSecond} RPC method.
* @category Node RPC
*/
    export interface IEstimateNetworkHashesPerSecondRequest {
        windowSize : number;
        startHash? : HexString;
    }
    


/**
* Return interface for the {@link RpcClient.getFeeEstimate} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetFeeEstimateResponse {
        estimate : IFeeEstimate;
    }
    


/**
* Return interface for the {@link RpcClient.getConnectedPeerInfo} RPC method.
* @category Node RPC
*/
    export interface IGetConnectedPeerInfoResponse {
        [key: string]: any
    }
    


/**
* Return interface for the {@link RpcClient.ping} RPC method.
* @category Node RPC
*/
    export interface IPingResponse {
        message?: string;
    }
    


/**
* Argument interface for the {@link RpcClient.getBlockTemplate} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetBlockTemplateRequest {
        payAddress : Address | string;
/**
* `extraData` can contain a user-supplied plain text or a byte array represented by `Uint8array`.
*/
        extraData? : string | Uint8Array;
    }
    


/**
* Return interface for the {@link RpcClient.getSubnetwork} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetSubnetworkResponse {
        gasLimit : bigint;
    }
    


/**
* Return interface for the {@link RpcClient.getUtxoReturnAddress} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetUtxoReturnAddressResponse {
        returnAddress: Address;
    }
    


/**
* Return interface for the {@link RpcClient.getBlocks} RPC method.
*
*
* @category Node RPC
*/
    export interface IGetBlocksResponse {
        blockHashes : HexString[];
        blocks : IBlock[];
    }
    


/**
* Return interface for the {@link RpcClient.getBlockRewardInfo} RPC method.
* @category Node RPC
*/
    export interface IGetBlockRewardInfoResponse {
        header: IHeader;
        blockColor: BlockColor;
        confirmationCount?: bigint;
        mergingChainBlockHash?: HexString;
        rewardAmount?: bigint;
    }
    


/**
 * Script builder engine flags.
 *
 * @category TxScript
 */
export interface ScriptBuilderFlags {
    /** Whether or not covenant opcodes and post-Toccata script limits are enabled. */
    covenantsEnabled?: boolean;
    /** Script units charged for each signature operation. Defaults to the native engine default. */
    sigopScriptUnits?: bigint | number;
}

/**
 * Script builder options.
 *
 * @category TxScript
 */
export interface ScriptBuilderOptions {
    /** Engine flags used by the underlying native ScriptBuilder. */
    flags?: ScriptBuilderFlags;
}



    /**
     * Generic network address representation.
     * 
     * @category General
     */
    export interface INetworkAddress {
        /**
         * IPv4 or IPv6 address.
         */
        ip: string;
        /**
         * Optional port number.
         */
        port?: number;
    }



/**
 * 
 * 
 * @category Wallet SDK
 * 
 */
export enum TransactionKind {
    Reorg = "reorg",
    Stasis = "stasis",
    Batch = "batch",
    Change = "change",
    Incoming = "incoming",
    Outgoing = "outgoing",
    External = "external",
    TransferIncoming = "transfer-incoming",
    TransferOutgoing = "transfer-outgoing",
}




/**
 * Type of a binding record.
 * @see {@link IBinding}, {@link ITransactionDataVariant}, {@link ITransactionRecord}
 * @category Wallet SDK
 */
export enum BindingType {
    /**
     * The data structure is associated with a user-supplied id.
     * @see {@link IBinding}
     */
    Custom = "custom",
    /**
     * The data structure is associated with a wallet account.
     * @see {@link IBinding}, {@link Account}
     */
    Account = "account",
}

/**
 * Internal transaction data contained within the transaction record.
 * @see {@link ITransactionRecord}
 * @category Wallet SDK
 */
export interface IBinding {
    type : BindingType;
    id : HexString;
}



/**
 * Interface declaration for {@link verifyMessage} function arguments.
 *
 * @category Message Signing
 */
export interface IVerifyMessage {
    message: string;
    signature: HexString;
    publicKey: PublicKey | string;
}



/**
 * Interface declaration for {@link signMessage} function arguments.
 *
 * @category Message Signing
 */
export interface ISignMessage {
    message: string;
    privateKey: PrivateKey | string;
    noAuxRand?: boolean;
}



/**
 * {@link UtxoContext} (wallet account) balance.
 * @category Wallet SDK
 */
export interface IBalance {
    /**
     * Total amount of Kaspa (in SOMPI) available for 
     * spending.
     */
    mature: bigint;
    /**
     * Total amount of Kaspa (in SOMPI) that has been 
     * received and is pending confirmation.
     */
    pending: bigint;
    /**
     * Total amount of Kaspa (in SOMPI) currently 
     * being sent as a part of the outgoing transaction
     * but has not yet been accepted by the network.
     */
    outgoing: bigint;
    /**
     * Number of UTXOs available for spending.
     */
    matureUtxoCount: number;
    /**
     * Number of UTXOs that have been received and 
     * are pending confirmation.
     */
    pendingUtxoCount: number;
    /**
     * Number of UTXOs currently in stasis (coinbase 
     * transactions received as a result of mining).
     * Unlike regular user transactions, coinbase 
     * transactions go through `stasis->pending->mature`
     * stages. Client applications should ignore `stasis`
     * stages and should process transactions only when
     * they have reached the `pending` stage. However, 
     * `stasis` information can be used for informative 
     * purposes to indicate that coinbase transactions
     * have arrived.
     */
    stasisUtxoCount: number;
}



/**
 * 
 * Defines a single payment output.
 * 
 * @see {@link IGeneratorSettingsObject}, {@link Generator}
 * @category Wallet SDK
 */
export interface IPaymentOutput {
    /**
     * Destination address. The address prefix must match the network
     * you are transacting on (e.g. `kaspa:` for mainnet, `kaspatest:` for testnet, etc).
     */
    address: Address | string;
    /**
     * Output amount in SOMPI.
     */
    amount: bigint;
}



    /**
     * 
     * @category Wallet SDK
     */
    export interface IFees {
        amount: bigint;
        source?: FeeSource;
    }
    


/**
* Argument interface for the {@link Wallet.accountsGetUtxos} method.
*
*
* @category Wallet API
*/
    export interface IAccountsGetUtxosRequest {
        accountId : HexString;
        addresses : Address[] | string[];
        minAmountSompi? : bigint;
    }
    


/**
* Return interface for the {@link Wallet.addressBookEnumerate} method.
*
*
* @category Wallet API
*/
    export interface IAddressBookEnumerateResponse {
        // TODO
    }
    


/**
* Argument interface for the {@link Wallet.retainContext} method.
*
*
* @category Wallet API
*/
    export interface IRetainContextRequest {
/**
* Optional context creation name.
*/
        name : string;
/**
* Optional context data to retain.
*/
        data? : string;
    }
    


/**
* Argument interface for the {@link Wallet.transactionsReplaceMetadata} method.
* Metadata is a wallet-specific string that can be used to store arbitrary data.
* It should contain a serialized JSON string with `key` containing the custom
* data stored by the wallet.  When interacting with metadata, the wallet should
* always deserialize the JSON string and then serialize it again after making
* changes, preserving any foreign keys that it might encounter.
*
* To preserve foreign metadata, the pattern of access should be:
* `Get -> Modify -> Replace`
*
* @category Wallet API
*/
    export interface ITransactionsReplaceMetadataRequest {
/**
* The id of account the transaction belongs to.
*/
        accountId: HexString,
/**
* The network id of the transaction.
*/
        networkId: NetworkId | string,
/**
* The id of the transaction.
*/
        transactionId: HexString,
/**
* Optional metadata string to replace the existing metadata.
* If not supplied, the metadata will be removed.
*/
        metadata?: string,    
    }
    


/**
* Return interface for the {@link Wallet.flush} method.
*
*
* @category Wallet API
*/
    export interface IFlushResponse { }
    


/**
* Argument interface for the {@link Wallet.connect} method.
*
*
* @category Wallet API
*/
    export interface IConnectRequest {
        // destination wRPC node URL (if omitted, the resolver is used)
        url? : string;
        // network identifier
        networkId : NetworkId | string;
        // retry on error
        retryOnError? : boolean;
        // block async connect (method will not return until the connection is established)
        block? : boolean;
        // require node to be synced (fail otherwise)
        requireSync? : boolean;
    }
    


/**
* Argument interface for the {@link Wallet.walletReload} method.
*
*
* @category Wallet API
*/
    export interface IWalletReloadRequest {
/**
* Reactivate accounts that are active before the reload.
*/
        reactivate: boolean;
    }
    


/**
* Argument interface for the {@link Wallet.accountsGet} method.
*
*
* @category Wallet API
*/
    export interface IAccountsGetRequest {
        accountId: string;
    }
    


/**
* Return interface for the {@link Wallet.accountsCommitRevealManual} method.
*
*
* @category Wallet API
*/
    export interface IAccountsCommitRevealManualResponse {
        transactionIds : HexString[];
    }
    


/**
* Argument interface for the {@link Wallet.prvKeyDataCreate} method.
*
*
* @category Wallet API
*/
    export interface IPrvKeyDataCreateRequest {
/** Wallet encryption secret */
        walletSecret: string;
/** Optional name of the private key */
        name? : string;
/**
* Optional key secret (BIP39 passphrase).
*
* If supplied, all operations requiring access
* to the key will require the `paymentSecret`
* to be provided.
*/
        paymentSecret? : string;
/** BIP39 mnemonic phrase (12 or 24 words) if kind is mnemonic */
        mnemonic? : string;
/** Secret key if kind is secretKey */
        secretKey? : string;
/** Kind of the private key data */
        kind : "mnemonic" | "secretKey";
    }
    


/**
* Argument interface for the {@link Wallet.accountsPskbSend} method.
*
*
* @category Wallet API
*/
    export interface IAccountsPskbSendRequest {
/**
* Hex identifier of the account.
*/
        accountId : HexString;
/**
* Wallet encryption secret.
*/
        walletSecret : string;
/**
* Optional key encryption secret or BIP39 passphrase.
*/
        paymentSecret? : string;

/**
* PSKB to sign.
*/
        pskb : string;

/**
* Address to sign for.
*/
        signForAddress? : Address | string;
    }
    


/**
* Return interface for the {@link Wallet.accountsGetUtxos} method.
*
*
* @category Wallet API
*/
    export interface IAccountsGetUtxosResponse {
        utxos : UtxoEntry[];
    }
    


/**
* Return interface for the {@link Wallet.accountsPskbBroadcast} method.
*
*
* @category Wallet API
*/
    export interface IAccountsPskbBroadcastResponse {
        transactionIds : HexString[];
    }
    


/**
* Return interface for the {@link Wallet.prvKeyDataEnumerate} method.
*
* Response returning a list of private key ids, their optional names and properties.
*
* @see {@link IPrvKeyDataInfo}
* @category Wallet API
*/
    export interface IPrvKeyDataEnumerateResponse {
        prvKeyDataList: IPrvKeyDataInfo[],
    }
    


/**
* Argument interface for the {@link Wallet.walletImport} method.
*
*
* @category Wallet API
*/
    export interface IWalletImportRequest {
        walletSecret: string;
        walletData: HexString | Uint8Array;
    }
    


/**
* Return interface for the {@link Wallet.walletExport} method.
*
*
* @category Wallet API
*/
    export interface IWalletExportResponse {
        walletData: HexString;
    }
    


/**
* Argument interface for the {@link Wallet.prvKeyDataGet} method.
*
*
* @category Wallet API
*/
    export interface IPrvKeyDataGetRequest {
        walletSecret: string;
        prvKeyDataId: HexString;
    }
    


/**
* Return interface for the {@link Wallet.accountsDeactivate} method.
*
*
* @category Wallet API
*/
    export interface IAccountsDeactivateResponse { }
    


    export interface IFeeRatePollerDisableRequest { }
    


/**
* Return interface for the {@link Wallet.walletEnumerate} method.
*
*
* @category Wallet API
*/
    export interface IWalletEnumerateResponse {
        walletDescriptors: WalletDescriptor[];
    }
    


/**
* Argument interface for the {@link Wallet.accountsDiscovery} method.
*
*
* @category Wallet API
*/
    export interface IAccountsDiscoveryRequest {
        discoveryKind: AccountsDiscoveryKind,
        accountScanExtent: number,
        addressScanExtent: number,
        bip39_passphrase?: string,
        bip39_mnemonic: string,
    }
    


/**
* Return interface for the {@link Wallet.accountsPskbSign} method.
*
*
* @category Wallet API
*/
    export interface IAccountsPskbSignResponse {
/**
* signed PSKB.
*/
        pskb: string;
    }
    


/**
* Return interface for the {@link Wallet.walletClose} method.
*
*
* @category Wallet API
*/
    export interface IWalletCloseResponse { }
    


/**
* Argument interface for the {@link Wallet.walletCreate} method.
*
* If filename is not supplied, the filename will be derived from the wallet title.
* If both wallet title and filename are not supplied, the wallet will be create
* with the default filename `kaspa`.
*
* @category Wallet API
*/
    export interface IWalletCreateRequest {
/** Wallet encryption secret */
        walletSecret: string;
/** Optional wallet title */
        title?: string;
/** Optional wallet filename */
        filename?: string;
/** Optional user hint */
        userHint?: string;
/**
* Overwrite wallet data if the wallet with the same filename already exists.
* (Use with caution!)
*/
        overwriteWalletStorage?: boolean;
    }
    


/**
* Argument interface for the {@link Wallet.walletClose} method.
*
*
* @category Wallet API
*/
    export interface IWalletCloseRequest { }
    


    export interface IFeeRatePollerDisableResponse { }
    


/**
* Return interface for the {@link Wallet.transactionsDataGet} method.
*
*
* @category Wallet API
*/
    export interface ITransactionsDataGetResponse {
        accountId : HexString;
        transactions : ITransactionRecord[];
        start : bigint;
        total : bigint;
    }
    


/**
* Return interface for the {@link Wallet.transactionsReplaceMetadata} method.
*
*
* @category Wallet API
*/
    export interface ITransactionsReplaceMetadataResponse { }
    


/**
* Return interface for the {@link Wallet.accountsEnumerate} method.
*
*
* @category Wallet API
*/
    export interface IAccountsEnumerateResponse {
        accountDescriptors: IAccountDescriptor[];
    }
    


/**
* Argument interface for the {@link Wallet.accountsEnsureDefault} method.
*
*
* @category Wallet API
*/
    export interface IAccountsEnsureDefaultRequest {
        walletSecret: string;
        paymentSecret?: string;
        type : AccountKind | string;
        mnemonic? : string;
    }
    


/**
* Return interface for the {@link Wallet.accountsCreateNewAddress} method.
*
*
* @category Wallet API
*/
    export interface IAccountsCreateNewAddressResponse {
        address: Address;
    }
    


/**
* Return interface for the {@link Wallet.walletCreate} method.
*
*
* @category Wallet API
*/
    export interface IWalletCreateResponse {
        walletDescriptor: IWalletDescriptor;
        storageDescriptor: IStorageDescriptor;
    }
    


/**
* Return interface for the {@link Wallet.accountsImport} method.
*
*
* @category Wallet API
*/
    export interface IAccountsImportResponse {
        // TODO
    }
    


    export interface IFeeRatePollerEnableRequest {
        intervalSeconds : number;
    }
    


/**
* Argument interface for the {@link Wallet.accountsPskbBroadcast} method.
*
*
* @category Wallet API
*/
    export interface IAccountsPskbBroadcastRequest {
        accountId : HexString;
        pskb : string;
    }
    


/**
* Argument interface for the {@link Wallet.flush} method.
*
*
* @category Wallet API
*/
    export interface IFlushRequest {
        walletSecret : string;
    }
    


/**
* Argument interface for the {@link Wallet.accountsEstimate} method.
*
*
* @category Wallet API
*/
    export interface IAccountsEstimateRequest {
        accountId : HexString;
        destination : IPaymentOutput[];
        feeRate? : number;
        priorityFeeSompi : IFees | bigint;
        payload? : Uint8Array | string;
    }
    


/**
* Argument interface for the {@link Wallet.accountsImport} method.
*
*
* @category Wallet API
*/
    export interface IAccountsImportRequest {
        walletSecret: string;
        // TODO
    }
    


/**
* Argument interface for the {@link Wallet.walletEnumerate} method.
*
*
* @category Wallet API
*/
    export interface IWalletEnumerateRequest { }
    


/**
* Argument interface for the {@link Wallet.batch} method.
* Suspend storage operations until invocation of flush().
*
* @category Wallet API
*/
    export interface IBatchRequest { }
    


/**
* Argument interface for the {@link Wallet.walletExport} method.
*
*
* @category Wallet API
*/
    export interface IWalletExportRequest {
        walletSecret: string;
        includeTransactions: boolean;
    }
    


/**
* Return interface for the {@link Wallet.prvKeyDataRemove} method.
*
*
* @category Wallet API
*/
    export interface IPrvKeyDataRemoveResponse { }
    


/**
* Argument interface for the {@link Wallet.accountsDeactivate} method.
*
*
* @category Wallet API
*/
    export interface IAccountsDeactivateRequest {
        accountIds?: string[];
    }
    


/**
* Argument interface for the {@link Wallet.walletOpen} method.
*
* @category Wallet API
*/
    export interface IWalletOpenRequest {
        walletSecret: string;
        filename?: string;
        accountDescriptors: boolean;
/** Enable legacy (KDX, kaspanet.io Web Wallet) account compatibility mode. */
        legacyAccounts?: boolean;
    }
    


/**
* Return interface for the {@link Wallet.accountsEstimate} method.
*
*
* @category Wallet API
*/
    export interface IAccountsEstimateResponse {
        generatorSummary : GeneratorSummary;
    }
    


/**
* Argument interface for the {@link Wallet.accountsRename} method.
*
*
* @category Wallet API
*/
    export interface IAccountsRenameRequest {
        accountId: string;
        name?: string;
        walletSecret: string;
    }
    


/**
* Return interface for the {@link Wallet.walletImport} method.
*
*
* @category Wallet API
*/
    export interface IWalletImportResponse { }
    


/**
* Return interface for the {@link Wallet.accountsSend} method.
*
*
* @category Wallet API
*/
    export interface IAccountsSendResponse {
/**
* Summary produced by the transaction generator.
*/
        generatorSummary : GeneratorSummary;
/**
* Hex identifiers of successfully submitted transactions.
*/
        transactionIds : HexString[];
    }
    


/**
* Return interface for the {@link Wallet.walletOpen} method.
*
*
* @category Wallet API
*/
    export interface IWalletOpenResponse {
        accountDescriptors: IAccountDescriptor[];
    }
    


/**
* Return interface for the {@link Wallet.accountsDiscovery} method.
*
*
* @category Wallet API
*/
    export interface IAccountsDiscoveryResponse {
        lastAccountIndexFound : number;
    }
    


/**
* Return interface for the {@link Wallet.accountsGet} method.
*
*
* @category Wallet API
*/
    export interface IAccountsGetResponse {
        accountDescriptor: IAccountDescriptor;
    }
    


    export interface IFeeRateEstimateResponse {
        priority : IFeeRateEstimateBucket,
        normal : IFeeRateEstimateBucket,
        low : IFeeRateEstimateBucket,
    }
    


/**
* Argument interface for the {@link Wallet.accountsEnumerate} method.
*
*
* @category Wallet API
*/
    export interface IAccountsEnumerateRequest { }
    


/**
* Return interface for the {@link Wallet.connect} method.
*
*
* @category Wallet API
*/
    export interface IConnectResponse { }
    


/**
* Return interface for the {@link Wallet.transactionsReplaceNote} method.
*
*
* @category Wallet API
*/
    export interface ITransactionsReplaceNoteResponse { }
    


    export interface IFeeRatePollerEnableResponse { }
    


/**
* Argument interface for the {@link Wallet.addressBookEnumerate} method.
*
*
* @category Wallet API
*/
    export interface IAddressBookEnumerateRequest { }
    


/**
* Argument interface for the {@link Wallet.accountsActivate} method.
*
*
* @category Wallet API
*/
    export interface IAccountsActivateRequest {
        accountIds?: HexString[],
    }
    


/**
* Return interface for the {@link Wallet.accountsCommitReveal} method.
*
*
* @category Wallet API
*/
    export interface IAccountsCommitRevealResponse {
        transactionIds : HexString[];
    }
    


/**
* Return interface for the {@link Wallet.accountsTransfer} method.
*
*
* @category Wallet API
*/
    export interface IAccountsTransferResponse {
        generatorSummary : GeneratorSummary;
        transactionIds : HexString[];
    }
    


/**
* Argument interface for the {@link Wallet.accountsSend} method.
*
*
* @category Wallet API
*/
    export interface IAccountsSendRequest {
/**
* Hex identifier of the account.
*/
        accountId : HexString;
/**
* Wallet encryption secret.
*/
        walletSecret : string;
/**
* Optional key encryption secret or BIP39 passphrase.
*/
        paymentSecret? : string;
/**
* Fee rate in sompi per 1 gram of mass.
*/
        feeRate? : number;
/**
* Priority fee.
*/
        priorityFeeSompi? : IFees | bigint;
/**
*
*/
        payload? : Uint8Array | HexString;
/**
* If not supplied, the destination will be the change address resulting in a UTXO compound transaction.
*/
        destination? : IPaymentOutput[];
    }
    


/**
* Return interface for the {@link Wallet.retainContext} method.
*
*
* @category Wallet API
*/
    export interface IRetainContextResponse {
    }
    


/**
* Return interface for the {@link Wallet.walletChangeSecret} method.
*
*
* @category Wallet API
*/
    export interface IWalletChangeSecretResponse { }
    


/**
* Return interface for the {@link Wallet.prvKeyDataCreate} method.
*
*
* @category Wallet API
*/
    export interface IPrvKeyDataCreateResponse {
        prvKeyDataId: HexString;
    }
    


/**
 * @categoryDescription Wallet API
 * Wallet API for interfacing with Rusty Kaspa Wallet implementation.
 */



/**
* Argument interface for the {@link Wallet.accountsCommitReveal} method.
*
* Atomic commit reveal operation using parameterized account address to
* dynamically generate the commit P2SH address.
*
* The account address is selected through addressType and addressIndex
* and will be used to complete the script signature.
*
* A placeholder of format {{pubkey}} is to be provided inside ScriptSig
* in order to be superseded by the selected address' payload.
*
* The selected address will also be used to spend reveal transaction to.
*
* The default revealFeeSompi is 100_000 sompi.
*
* @category Wallet API
*/
    export interface IAccountsCommitRevealRequest {
        accountId : HexString;
        addressType : CommitRevealAddressKind;
        addressIndex : number;
        scriptSig : Uint8Array | HexString;
        walletSecret : string;
        commitAmountSompi : bigint;
        paymentSecret? : string;
        feeRate? : number;
        revealFeeSompi : bigint;
        payload? : Uint8Array | HexString;
    }
    


    export interface IFeeRateEstimateBucket {
        feeRate : number;
        seconds : number;
    }
    


/**
* Return interface for the {@link Wallet.disconnect} method.
*
*
* @category Wallet API
*/
    export interface IDisconnectResponse { }
    


    export interface IFeeRateEstimateRequest { }
    


/**
* Return interface for the {@link Wallet.accountsPskbSend} method.
*
*
* @category Wallet API
*/
    export interface IAccountsPskbSendResponse {
        transactionIds : HexString[];
    }
    


/**
* Return interface for the {@link Wallet.accountsRename} method.
*
*
* @category Wallet API
*/
    export interface IAccountsRenameResponse { }
    


/**
* Argument interface for the {@link Wallet.transactionsDataGet} method.
*
*
* @category Wallet API
*/
    export interface ITransactionsDataGetRequest {
        accountId : HexString;
        networkId : NetworkId | string;
        filter? : TransactionKind[];
        start : bigint;
        end : bigint;
    }
    


/**
* Return interface for the {@link Wallet.prvKeyDataGet} method.
*
*
* @category Wallet API
*/
    export interface IPrvKeyDataGetResponse {
        // prvKeyData: PrvKeyData,
    }
    


/**
* Argument interface for the {@link Wallet.walletChangeSecret} method.
*
*
* @category Wallet API
*/
    export interface IWalletChangeSecretRequest {
        oldWalletSecret: string;
        newWalletSecret: string;
    }
    


/**
* Argument interface for the {@link Wallet.transactionsReplaceNote} method.
*
*
* @category Wallet API
*/
    export interface ITransactionsReplaceNoteRequest {
/**
* The id of account the transaction belongs to.
*/
        accountId: HexString,
/**
* The network id of the transaction.
*/
        networkId: NetworkId | string,
/**
* The id of the transaction.
*/
        transactionId: HexString,
/**
* Optional note string to replace the existing note.
* If not supplied, the note will be removed.
*/
        note?: string,
    }
    


/**
* Argument interface for the {@link Wallet.accountsCommitRevealManual} method.
*
* Atomic commit reveal operation using given payment outputs.
*
* The startDestination stands for the commit transaction and the endDestination
* for the reveal transaction.
*
* The scriptSig will be used to spend the UTXO of the first transaction and
* must therefore match the startDestination output P2SH.
*
* Set revealFeeSompi or reflect the reveal fee transaction on endDestination
* output amount.
*
* The default revealFeeSompi is 100_000 sompi.
*
* @category Wallet API
*/
    export interface IAccountsCommitRevealManualRequest {
        accountId : HexString;
        scriptSig : Uint8Array | HexString;
        startDestination: IPaymentOutput;
        endDestination: IPaymentOutput;
        walletSecret : string;
        paymentSecret? : string;
        feeRate? : number;
        revealFeeSompi : bigint;
        payload? : Uint8Array | HexString;
    }
    


/**
* Return interface for the {@link Wallet.accountsActivate} method.
*
*
* @category Wallet API
*/
    export interface IAccountsActivateResponse { }
    


/**
* Argument interface for the {@link Wallet.accountsCreateNewAddress} method.
*
*
* @category Wallet API
*/
    export interface IAccountsCreateNewAddressRequest {
        accountId: string;
        addressKind?: NewAddressKind | string,
    }
    


/**
* Return interface for the {@link Wallet.getStatus} method.
*
*
* @category Wallet API
*/
    export interface IGetStatusResponse {
        isConnected : boolean;
        isSynced : boolean;
        isOpen : boolean;
        url? : string;
        networkId? : NetworkId;
        context? : HexString;
    }
    


/**
* Return interface for the {@link Wallet.accountsEnsureDefault} method.
*
*
* @category Wallet API
*/
    export interface IAccountsEnsureDefaultResponse {
        accountDescriptor : IAccountDescriptor;
    }
    


/**
* Argument interface for the {@link Wallet.accountsTransfer} method.
*
*
* @category Wallet API
*/
    export interface IAccountsTransferRequest {
        sourceAccountId : HexString;
        destinationAccountId : HexString;
        walletSecret : string;
        paymentSecret? : string;
        feeRate? : number;
        priorityFeeSompi? : IFees | bigint;
        transferAmountSompi : bigint;
    }
    


/**
* Argument interface for the {@link Wallet.prvKeyDataEnumerate} method.
*
*
* @category Wallet API
*/
    export interface IPrvKeyDataEnumerateRequest { }
    


/**
* Argument interface for the {@link Wallet.accountsPskbSign} method.
*
*
* @category Wallet API
*/
    export interface IAccountsPskbSignRequest {
/**
* Hex identifier of the account.
*/
        accountId : HexString;
/**
* Wallet encryption secret.
*/
        walletSecret : string;
/**
* Optional key encryption secret or BIP39 passphrase.
*/
        paymentSecret? : string;

/**
* PSKB to sign.
*/
        pskb : string;

/**
* Address to sign for.
*/
        signForAddress? : Address | string;
    }
    


/**
* Argument interface for the {@link Wallet.accountsCreate} method.
*
*
* @category Wallet API
*/
    export type IAccountsCreateRequest = {
        walletSecret: string;
        type: "bip32";
        accountName:string;
        accountIndex?:number;
        prvKeyDataId:string;
        paymentSecret?:string;
    } | {
        walletSecret: string;
        type: "kaspa-keypair-standard";
        accountName:string;
        prvKeyDataId:string;
        paymentSecret?:string;
        ecdsa?:boolean;
    };

    //   |{
    //     walletSecret: string;
    //     type: "bip32-readonly";
    //     accountName:string;
    //     accountIndex?:number;
    //     pubkey:HexString;
    //     paymentSecret?:string;
    //  }
    


/**
* Argument interface for the {@link Wallet.disconnect} method.
*
*
* @category Wallet API
*/
    export interface IDisconnectRequest { }
    


/**
* Return interface for the {@link Wallet.batch} method.
*
*
* @category Wallet API
*/
    export interface IBatchResponse { }
    


/**
* Argument interface for the {@link Wallet.prvKeyDataRemove} method.
*
*
* @category Wallet API
*/
    export interface IPrvKeyDataRemoveRequest {
        walletSecret: string;
        prvKeyDataId: HexString;
    }
    


/**
* Return interface for the {@link Wallet.walletReload} method.
*
*
* @category Wallet API
*/
    export interface IWalletReloadResponse { }
    


/**
* Return interface for the {@link Wallet.accountsCreate} method.
*
*
* @category Wallet API
*/
    export interface IAccountsCreateResponse {
        accountDescriptor : IAccountDescriptor;
    }
    


/**
* Argument interface for the {@link Wallet.getStatus} method.
*
*
* @category Wallet API
*/
    export interface IGetStatusRequest {
/**
* Optional context creation name.
* @see {@link IRetainContextRequest}
*/
        name? : string;
    }
    


    /**
     * 
     * 
     * @category Wallet API
     */
    export interface INetworkParams {
        coinbaseTransactionMaturityPeriodDaa : number;
        coinbaseTransactionStasisPeriodDaa : number;
        userTransactionMaturityPeriodDaa : number;
        additionalCompoundTransactionMass : number;
    }
    



export interface IPrvKeyDataArgs {
    prvKeyDataId: HexString;
    paymentSecret?: string;
}

export interface IAccountCreateArgsBip32 {
    accountName?: string;
    accountIndex?: number;
}

/**
 * @category Wallet API
 */
export interface IAccountCreateArgs {
    type : "bip32";
    args : IAccountCreateArgsBip32;
    prvKeyDataArgs? : IPrvKeyDataArgs;
}



    /**
     * 
     * 
     * @category Wallet API
     */
    export interface IAccountDescriptor {
        kind : AccountKind,
        accountId : HexString,
        accountName? : string,
        receiveAddress? : Address,
        changeAddress? : Address,
        addresses? : Address[],
        prvKeyDataIds : HexString[],
        // balance? : Balance,
        [key: string]: any
    }
    


    /**
     * Private key data information.
     * @category Wallet API
     */
    export interface IPrvKeyDataInfo {
        /** Deterministic wallet id of the private key */
        id: HexString;
        /** Optional name of the private key */
        name?: string;
        /** 
         * Indicates if the key requires additional payment or a recovery secret
         * to perform wallet operations that require access to it.
         * For BIP39 keys this indicates that the key was created with a BIP39 passphrase.
         */
        isEncrypted: boolean;
    }
    


        interface UtxoProcessor {
            /**
            * @param {UtxoProcessorNotificationCallback} callback
            */
            addEventListener(callback: UtxoProcessorNotificationCallback): void;
            /**
            * @param {UtxoProcessorEventType} event
            * @param {UtxoProcessorNotificationCallback} [callback]
            */
            addEventListener<E extends keyof UtxoProcessorEventMap>(
                event: E,
                callback: UtxoProcessorNotificationCallback<E>
            )
        }


    /**
     * UtxoProcessor constructor arguments.
     * 
     * @see {@link UtxoProcessor}, {@link UtxoContext}, {@link RpcClient}, {@link NetworkId}
     * @category Wallet SDK
     */
    export interface IUtxoProcessorArgs {
        /**
         * The RPC client to use for network communication.
         */
        rpc : RpcClient;
        networkId : NetworkId | string;
    }
    


/**
 * Configuration for the transaction {@link Generator}. This interface
 * allows you to specify UTXO sources, transaction outputs, change address,
 * priority fee, and other transaction parameters.
 * 
 * If the total number of UTXOs needed to satisfy the transaction outputs
 * exceeds maximum allowed number of UTXOs per transaction (limited by
 * the maximum transaction mass), the {@link Generator} will produce 
 * multiple chained transactions to the change address and then used these
 * transactions as a source for the "final" transaction.
 * 
 * @see 
 *      {@link kaspaToSompi},
 *      {@link Generator}, 
 *      {@link PendingTransaction}, 
 *      {@link UtxoContext}, 
 *      {@link UtxoEntry},
 *      {@link createTransactions},
 *      {@link estimateTransactions}
 * @category Wallet SDK
 */
interface IGeneratorSettingsObject {
    /** 
     * Final transaction outputs (do not supply change transaction).
     * 
     * Typical usage: { address: "kaspa:...", amount: 1000n }
     */
    outputs: PaymentOutput | IPaymentOutput[];
    /** 
     * Address to be used for change, if any. 
     */
    changeAddress: Address | string;
    /**
     * Fee rate in SOMPI per 1 gram of mass.
     * 
     * Fee rate is applied to all transactions generated by the {@link Generator}.
     * This includes batch and final transactions. If not set, the fee rate is 
     * not applied.
     */
    feeRate?: number;
    /** 
     * Priority fee in SOMPI.
     * 
     * If supplying `bigint` value, it will be interpreted as a sender-pays fee.
     * Alternatively you can supply an object with `amount` and `source` properties
     * where `source` contains the {@link FeeSource} enum.
     * 
     * **IMPORTANT:* When sending an outbound transaction (transaction that
     * contains outputs), the `priorityFee` must be set, even if it is zero.
     * However, if the transaction is missing outputs (and thus you are
     * creating a compound transaction against your change address),
     * `priorityFee` should not be set (i.e. it should be `undefined`).
     * 
     * @see {@link IFees}, {@link FeeSource}
     */
    priorityFee?: IFees | bigint;
    /**
     * UTXO entries to be used for the transaction. This can be an
     * array of UtxoEntry instances, objects matching {@link IUtxoEntry}
     * interface, or a {@link UtxoContext} instance.
     */
    entries: IUtxoEntry[] | UtxoEntryReference[] | UtxoContext;
    /**
     * Optional UTXO entries that will be consumed before those available in `entries`.
     * You can use this property to apply custom input selection logic.
     * Please note that these inputs are consumed first, then `entries` are consumed
     * to generate a desirable transaction output amount.  If transaction mass
     * overflows, these inputs will be consumed into a batch/sweep transaction
     * where the destination if the `changeAddress`.
     */
    priorityEntries?: IUtxoEntry[] | UtxoEntryReference[],
    /**
     * Optional number of signature operations in the transaction.
     */
    sigOpCount?: number;
    /**
     * Optional minimum number of signatures required for the transaction.
     */
    minimumSignatures?: number;
    /**
     * Optional data payload to be included in the transaction.
     */
    payload?: Uint8Array | HexString;

    /**
     * Optional NetworkId or network id as string (i.e. `mainnet` or `testnet-11`). Required when {@link IGeneratorSettingsObject.entries} is array
     */
    networkId?: NetworkId | string
}



    /**
     * UtxoContext constructor arguments.
     * 
     * @see {@link UtxoProcessor}, {@link UtxoContext}, {@link RpcClient}
     * @category Wallet SDK
     */
    export interface IUtxoContextArgs {
        /**
         * Associated UtxoProcessor.
         */
        processor: UtxoProcessor;
        /**
         * Optional id for the UtxoContext.
         * **The id must be a valid 32-byte hex string.**
         * You can use {@link sha256FromBinary} or {@link sha256FromText} to generate a valid id.
         * 
         * If not provided, a random id will be generated.
         * The IDs are deterministic, based on the order UtxoContexts are created.
         */
        id?: HexString;
    }
    



/**
 * 
 * @category Wallet SDK
 */
export interface IUtxoRecord {
    address?: Address;
    index: number;
    amount: bigint;
    scriptPublicKey: HexString;
    isCoinbase: boolean;
}

/**
 * Type of transaction data record.
 * @see {@link ITransactionData}, {@link ITransactionDataVariant}, {@link ITransactionRecord}
 * @category Wallet SDK
 */
export enum TransactionDataType {
    /**
     * Transaction has been invalidated due to a BlockDAG reorganization.
     * Such transaction is no longer valid and its UTXO entries are removed.
     * @see {@link ITransactionDataReorg}
     */
    Reorg = "reorg",
    /**
     * Transaction has been received and its UTXO entries are added to the 
     * pending or mature UTXO set.
     * @see {@link ITransactionDataIncoming}
     */
    Incoming = "incoming",
    /**
     * Transaction is in stasis and its UTXO entries are not yet added to the UTXO set.
     * This event is generated for **Coinbase** transactions only.
     * @see {@link ITransactionDataStasis}
     */
    Stasis = "stasis",
    /**
     * Observed transaction is not performed by the wallet subsystem but is executed
     * against the address set managed by the wallet subsystem.
     * @see {@link ITransactionDataExternal}
     */
    External = "external",
    /**
     * Transaction is outgoing and its UTXO entries are removed from the UTXO set.
     * @see {@link ITransactionDataOutgoing}
     */
    Outgoing = "outgoing",
    /**
     * Transaction is a batch transaction (compounding UTXOs to an internal change address).
     * @see {@link ITransactionDataBatch}
     */
    Batch = "batch",
    /**
     * Transaction is an incoming transfer from another {@link UtxoContext} managed by the {@link UtxoProcessor}.
     * When operating under the integrated wallet, these are transfers between different wallet accounts.
     * @see {@link ITransactionDataTransferIncoming}
     */
    TransferIncoming = "transfer-incoming",
    /**
     * Transaction is an outgoing transfer to another {@link UtxoContext} managed by the {@link UtxoProcessor}.
     * When operating under the integrated wallet, these are transfers between different wallet accounts.
     * @see {@link ITransactionDataTransferOutgoing}
     */
    TransferOutgoing = "transfer-outgoing",
    /**
     * Transaction is a change transaction and its UTXO entries are added to the UTXO set.
     * @see {@link ITransactionDataChange}
     */
    Change = "change",
}

/**
 * Contains UTXO entries and value for a transaction
 * that has been invalidated due to a BlockDAG reorganization.
 * @category Wallet SDK
 */
export interface ITransactionDataReorg {
    utxoEntries: IUtxoRecord[];
    value: bigint;
}

/**
 * Contains UTXO entries and value for an incoming transaction.
 * @category Wallet SDK
 */
export interface ITransactionDataIncoming {
    utxoEntries: IUtxoRecord[];
    value: bigint;
}

/**
 * Contains UTXO entries and value for a stasis transaction.
 * @category Wallet SDK
 */
export interface ITransactionDataStasis {
    utxoEntries: IUtxoRecord[];
    value: bigint;
}

/**
 * Contains UTXO entries and value for an external transaction.
 * An external transaction is a transaction that was not issued 
 * by this instance of the wallet but belongs to this address set.
 * @category Wallet SDK
 */
export interface ITransactionDataExternal {
    utxoEntries: IUtxoRecord[];
    value: bigint;
}

/**
 * Batch transaction data (created by the {@link Generator} as a 
 * result of UTXO compounding process).
 * @category Wallet SDK
 */
export interface ITransactionDataBatch {
    fees: bigint;
    inputValue: bigint;
    outputValue: bigint;
    transaction: ITransaction;
    paymentValue: bigint;
    changeValue: bigint;
    acceptedDaaScore?: bigint;
    utxoEntries: IUtxoRecord[];
}

/**
 * Outgoing transaction data.
 * @category Wallet SDK
 */
export interface ITransactionDataOutgoing {
    fees: bigint;
    inputValue: bigint;
    outputValue: bigint;
    transaction: ITransaction;
    paymentValue: bigint;
    changeValue: bigint;
    acceptedDaaScore?: bigint;
    utxoEntries: IUtxoRecord[];
}

/**
 * Incoming transfer transaction data.
 * Transfer occurs when a transaction is issued between 
 * two {@link UtxoContext} (wallet account) instances.
 * @category Wallet SDK
 */
export interface ITransactionDataTransferIncoming {
    fees: bigint;
    inputValue: bigint;
    outputValue: bigint;
    transaction: ITransaction;
    paymentValue: bigint;
    changeValue: bigint;
    acceptedDaaScore?: bigint;
    utxoEntries: IUtxoRecord[];
}

/**
 * Outgoing transfer transaction data.
 * Transfer occurs when a transaction is issued between 
 * two {@link UtxoContext} (wallet account) instances.
 * @category Wallet SDK
 */
export interface ITransactionDataTransferOutgoing {
    fees: bigint;
    inputValue: bigint;
    outputValue: bigint;
    transaction: ITransaction;
    paymentValue: bigint;
    changeValue: bigint;
    acceptedDaaScore?: bigint;
    utxoEntries: IUtxoRecord[];
}

/**
 * Change transaction data.
 * @category Wallet SDK
 */
export interface ITransactionDataChange {
    inputValue: bigint;
    outputValue: bigint;
    transaction: ITransaction;
    paymentValue: bigint;
    changeValue: bigint;
    acceptedDaaScore?: bigint;
    utxoEntries: IUtxoRecord[];
}

/**
 * Transaction record data variants.
 * @category Wallet SDK
 */
export type ITransactionDataVariant = 
    ITransactionDataReorg
    | ITransactionDataIncoming
    | ITransactionDataStasis
    | ITransactionDataExternal
    | ITransactionDataOutgoing
    | ITransactionDataBatch
    | ITransactionDataTransferIncoming
    | ITransactionDataTransferOutgoing
    | ITransactionDataChange;

/**
 * Internal transaction data contained within the transaction record.
 * @see {@link ITransactionRecord}
 * @category Wallet SDK
 */
export interface ITransactionData {
    type : TransactionDataType;
    data : ITransactionDataVariant;
}

/**
 * Transaction record generated by the Kaspa Wallet SDK.
 * This data structure is delivered within {@link UtxoProcessor} and `Wallet` notification events.
 * @see {@link ITransactionData}, {@link TransactionDataType}, {@link ITransactionDataVariant}
 * @category Wallet SDK
 */
export interface ITransactionRecord {
    /**
     * Transaction id.
     */
    id: string;
    /**
     * Transaction UNIX time in milliseconds.
     */
    unixtimeMsec?: bigint;
    /**
     * Transaction value in SOMPI.
     */
    value: bigint;
    /**
     * Transaction binding (id of UtxoContext or Wallet Account).
     */
    binding: HexString;
    /**
     * Block DAA score.
     */
    blockDaaScore: bigint;
    /**
     * Network id on which this transaction has occurred.
     */
    network: NetworkId;
    /**
     * Transaction data.
     */
    data: ITransactionData;
    /**
     * Optional transaction note as a human-readable string.
     */
    note?: string;
    /**
     * Optional transaction metadata.
     * 
     * If present, this must contain a JSON-serialized string.
     * A client application updating the metadata must deserialize
     * the string into JSON, add a key with it's own identifier
     * and store its own metadata into the value of this key.
     */
    metadata?: string;

    /**
     * Transaction data type.
     */
    type: string;
}



/**
 * Wallet storage information.
 */
export interface IStorageDescriptor {
    kind: string;
    data: string;
}



/**
 * Wallet storage information.
 * 
 * @category Wallet API
 */
export interface IWalletDescriptor {
    title?: string;
    filename: string;
}



    /**
     * Emitted by {@link Wallet} when an account has been deactivated.
     * 
     * @category Wallet Events
     */
    export interface IAccountDeactivationEvent {
        ids : HexString[];
    }
    


    /**
     * Emitted by {@link Wallet} when it opens and contains an optional anti-phishing 'hint' set by the user.
     * 
     * @category Wallet Events
     */
    export interface IWalletHintEvent {
        hint? : string;
    }
    


    /**
     * Emitted by {@link UtxoProcessor} after successfully opening an RPC
     * connection to the Kaspa node. This event contains general information
     * about the Kaspa node.
     * 
     * @category Wallet Events
     */
    export interface IServerStatusEvent {
        networkId : string;
        serverVersion : string;
        isSynced : boolean;
        url? : string;
    }
    


    /**
     * Emitted by {@link Wallet} when the wallet has created a private key.
     * 
     * @category Wallet Events
     */
    export interface IPrvKeyDataCreateEvent {
        prvKeyDataInfo : IPrvKeyDataInfo;
    }
    


    /**
     * Emitted by {@link Wallet} when an account has been created.
     * 
     * @category Wallet Events
     */
    export interface IAccountCreateEvent {
        accountDescriptor : IAccountDescriptor;
    }
    


    /**
     * Emitted by {@link Wallet} when the wallet is successfully opened.
     * 
     * @category Wallet Events
     */
    export interface IWalletOpenEvent {
        walletDescriptor : IWalletDescriptor;
        accountDescriptors : IAccountDescriptor[];
    }
    


    /**
     * Emitted by {@link UtxoContext} when detecting a new coinbase transaction.
     * Transactions are kept in "stasis" for the half of the coinbase maturity DAA period.
     * A wallet should ignore these transactions until they are re-broadcasted
     * via the "pending" event.
     * 
     * @category Wallet Events
     */
    export type IStasisEvent = TransactionRecord;
    



    /**
     * 
     * @category Wallet Events
     */
    export interface ISyncState {
        event : string;
        data? : ISyncProofEvent | ISyncHeadersEvent | ISyncBlocksEvent | ISyncUtxoSyncEvent | ISyncTrustSyncEvent | ISyncSmtSyncEvent;
    }
    
    /**
     * 
     * @category Wallet Events
     */
    export interface ISyncStateEvent {
        syncState : ISyncState;
    }
    


    /**
     * Emitted by {@link UtxoProcessor} when node is syncing cryptographic trust data as a part of the IBD (Initial Block Download) process.
     * 
     * @category Wallet Events
     */
    export interface ISyncTrustSyncEvent {
        processed : number;
        total : number;
    }
    


    /**
     * Emitted by {@link UtxoProcessor} when node is syncing the UTXO set as a part of the IBD (Initial Block Download) process.
     * 
     * @category Wallet Events
     */
    export interface ISyncUtxoSyncEvent {
        chunks : number;
        total : number;
    }
    


    /**
     * Emitted by {@link UtxoProcessor} indicating a non-recoverable internal error.
     * If such event is emitted, the application should stop the UtxoProcessor
     * and restart all related subsystem. This event is emitted when the UtxoProcessor
     * encounters a critical condition such as "out of memory".
     * 
     * @category Wallet Events
     */
    export interface IUtxoProcErrorEvent {
        message : string;
    }
    


    /**
     * Emitted by {@link Wallet} when the fee rate changes.
     * 
     * @category Wallet Events
     */
    export interface IFeeRateEvent {
        priority: {
            feerate: bigint,
            seconds: bigint,
        },
        normal: {
            feerate: bigint,
            seconds: bigint,
        },
        low: {
            feerate: bigint,
            seconds: bigint,
        },
    }
    


    /**
     * Emitted by {@link UtxoProcessor} when it disconnects from RPC.
     * 
     * @category Wallet Events
     */
    export interface IDisconnectEvent {
        networkId : string;
        url? : string;
    }
    


    /**
     * Emitted when detecting a general error condition.
     * 
     * @category Wallet Events
     */
    export interface IErrorEvent {
        message : string;
    }
    


    /**
     * Emitted by {@link UtxoProcessor} when node is importing the pruning point SMT state as a part of the IBD (Initial Block Download) process.
     * 
     * @category Wallet Events
     */
    export interface ISyncSmtSyncEvent {
        processed : number;
        total : number;
    }
    


    /**
     * Emitted by {@link UtxoContext} when transaction is considered to be confirmed.
     * This notification will be followed by the "balance" event.
     * 
     * @category Wallet Events
     */
    export type IMaturityEvent = TransactionRecord;
    


    /**
     * Emitted by {@link Wallet} when an account data has been updated.
     * This event signifies a chance in the internal account state that
     * includes new address generation.
     * 
     * @category Wallet Events
     */
    export interface IAccountUpdateEvent {
        accountDescriptor : IAccountDescriptor;
    }
    


    /**
     * Emitted by {@link Wallet} when an error occurs (for example, the wallet has failed to open).
     * 
     * @category Wallet Events
     */
    export interface IWalletErrorEvent {
        message : string;
    }
    


    /**
     * Emitted by {@link UtxoContext} when detecting a pending transaction.
     * This notification will be followed by the "balance" event.
     * 
     * @category Wallet Events
     */
    export type IPendingEvent = TransactionRecord;
    


    /**
     * Emitted by {@link UtxoProcessor} when node is syncing and processing cryptographic proofs.
     * 
     * @category Wallet Events
     */
    export interface ISyncProofEvent {
        level : number;
    }
    


    /**
     * Emitted by {@link UtxoProcessor} when it negotiates a successful RPC connection.
     * 
     * @category Wallet Events
     */
    export interface IConnectEvent {
        networkId : string;
        url? : string;
    }
    



        /**
         * Events emitted by the {@link Wallet}.
         * @category Wallet API
         */
        export enum WalletEventType {
            Connect = "connect",
            Disconnect = "disconnect",
            UtxoIndexNotEnabled = "utxo-index-not-enabled",
            SyncState = "sync-state",
            WalletHint = "wallet-hint",
            WalletOpen = "wallet-open",
            WalletCreate = "wallet-create",
            WalletReload = "wallet-reload",
            WalletError = "wallet-error",
            WalletClose = "wallet-close",
            PrvKeyDataCreate = "prv-key-data-create",
            AccountActivation = "account-activation",
            AccountDeactivation = "account-deactivation",
            AccountSelection = "account-selection",
            AccountCreate = "account-create",
            AccountUpdate = "account-update",
            ServerStatus = "server-status",
            UtxoProcStart = "utxo-proc-start",
            UtxoProcStop = "utxo-proc-stop",
            UtxoProcError = "utxo-proc-error",
            DaaScoreChange = "daa-score-change",
            Pending = "pending",
            Reorg = "reorg",
            Stasis = "stasis",
            Maturity = "maturity",
            Discovery = "discovery",
            Balance = "balance",
            Error = "error",
            FeeRate = "fee-rate",
        }

        /**
         * Wallet notification event data map.
         * @see {@link Wallet.addEventListener}
         * @category Wallet API
         */
        export type WalletEventMap = {
            "connect": IConnectEvent,
            "disconnect": IDisconnectEvent,
            "utxo-index-not-enabled": IUtxoIndexNotEnabledEvent,
            "sync-state": ISyncStateEvent,
            "wallet-hint": IWalletHintEvent,
            "wallet-open": IWalletOpenEvent,
            "wallet-create": IWalletCreateEvent,
            "wallet-reload": IWalletReloadEvent,
            "wallet-error": IWalletErrorEvent,
            "wallet-close": undefined,
            "prv-key-data-create": IPrvKeyDataCreateEvent,
            "account-activation": IAccountActivationEvent,
            "account-deactivation": IAccountDeactivationEvent,
            "account-selection": IAccountSelectionEvent,
            "account-create": IAccountCreateEvent,
            "account-update": IAccountUpdateEvent,
            "server-status": IServerStatusEvent,
            "utxo-proc-start": undefined,
            "utxo-proc-stop": undefined,
            "utxo-proc-error": IUtxoProcErrorEvent,
            "daa-score-change": IDaaScoreChangeEvent,
            "pending": IPendingEvent,
            "reorg": IReorgEvent,
            "stasis": IStasisEvent,
            "maturity": IMaturityEvent,
            "discovery": IDiscoveryEvent,
            "balance": IBalanceEvent,
            "error": IErrorEvent,
            "fee-rate": IFeeRateEvent,
        }
        
        /**
         * {@link Wallet} notification event interface.
         * @category Wallet API
         */
        export type IWalletEvent<T extends keyof WalletEventMap> = {
            [K in T]: {
                type: K,
                data: WalletEventMap[K]
            }
        }[T];


        /**
         * Wallet notification callback type.
         * 
         * This type declares the callback function that is called when notification is emitted
         * from the Wallet (and the underlying UtxoProcessor or UtxoContext subsystems).
         * 
         * @see {@link Wallet}
         * 
         * @category Wallet API
         */
        export type WalletNotificationCallback<E extends keyof WalletEventMap = keyof WalletEventMap> = (event: IWalletEvent<E>) => void;
        


    /**
     * Emitted by {@link UtxoProcessor} when node is syncing headers as a part of the IBD (Initial Block Download) process.
     * 
     * @category Wallet Events
     */
    export interface ISyncHeadersEvent {
        headers : number;
        progress : number;
    }
    


    /**
     * Emitted by {@link UtxoProcessor} on DAA score change.
     * 
     * @category Wallet Events
     */
    export interface IDaaScoreChangeEvent {
        currentDaaScore : number;
    }
    


    /**
     * Emitted by {@link Wallet} when an account has been activated.
     * 
     * @category Wallet Events
     */
    export interface IAccountActivationEvent {
        ids : HexString[];
    }
    


    /**
     * Emitted by {@link UtxoProcessor} when node is syncing blocks as a part of the IBD (Initial Block Download) process.
     * 
     * @category Wallet Events
     */
    export interface ISyncBlocksEvent {
        blocks : number;
        progress : number;
    }
    



        /**
         * Events emitted by the {@link UtxoProcessor}.
         * @category Wallet SDK
         */
        export enum UtxoProcessorEventType {
            Connect = "connect",
            Disconnect = "disconnect",
            UtxoIndexNotEnabled = "utxo-index-not-enabled",
            SyncState = "sync-state",
            UtxoProcStart = "utxo-proc-start",
            UtxoProcStop = "utxo-proc-stop",
            UtxoProcError = "utxo-proc-error",
            DaaScoreChange = "daa-score-change",
            Pending = "pending",
            Reorg = "reorg",
            Stasis = "stasis",
            Maturity = "maturity",
            Discovery = "discovery",
            Balance = "balance",
            Error = "error",
        }

        /**
         * {@link UtxoProcessor} notification event data map.
         * 
         * @category Wallet API
         */
        export type UtxoProcessorEventMap = {
            "connect": IConnectEvent,
            "disconnect": IDisconnectEvent,
            "utxo-index-not-enabled": IUtxoIndexNotEnabledEvent,
            "sync-state": ISyncStateEvent,
            "server-status": IServerStatusEvent,
            "utxo-proc-start": undefined,
            "utxo-proc-stop": undefined,
            "utxo-proc-error": IUtxoProcErrorEvent,
            "daa-score-change": IDaaScoreChangeEvent,
            "pending": IPendingEvent,
            "reorg": IReorgEvent,
            "stasis": IStasisEvent,
            "maturity": IMaturityEvent,
            "discovery": IDiscoveryEvent,
            "balance": IBalanceEvent,
            "error": IErrorEvent
        }

        /**
         * 
         * @category Wallet API
         */

        export type UtxoProcessorEvent<T extends keyof UtxoProcessorEventMap> = {
          [K in T]: {
            type: K,
            data: UtxoProcessorEventMap[K]
          }
        }[T];
        
        /**
         * {@link UtxoProcessor} notification callback type.
         * 
         * This type declares the callback function that is called when notification is emitted
         * from the UtxoProcessor or UtxoContext subsystems.
         * 
         * @see {@link UtxoProcessor}, {@link UtxoContext},
         * 
         * @category Wallet SDK
         */

        export type UtxoProcessorNotificationCallback<E extends keyof UtxoProcessorEventMap = keyof UtxoProcessorEventMap> = (event: UtxoProcessorEvent<E>) => void;
        


    /**
     * Emitted by {@link UtxoContext} when detecting a balance change.
     * This notification is produced during the UTXO scan, when UtxoContext
     * detects incoming or outgoing transactions or when transactions
     * change their state (e.g. from pending to confirmed).
     * 
     * @category Wallet Events
     */
    export interface IBalanceEvent {
        id : HexString;
        balance? : IBalance;
    }
    


    /**
     * Emitted by {@link Wallet} when the wallet data storage has been successfully created.
     * 
     * @category Wallet Events
     */
    export interface IWalletCreateEvent {
        walletDescriptor : IWalletDescriptor;
        storageDescriptor : IStorageDescriptor;
    }
    


    /**
     * Emitted by {@link UtxoContext} when detecting a new transaction during
     * the initialization phase. Discovery transactions indicate that UTXOs
     * have been discovered during the initial UTXO scan.
     * 
     * When receiving such notifications, the application should check its 
     * internal storage to see if the transaction already exists. If it doesn't,
     * it should create a correspond in record and notify the user of a new
     * transaction.
     * 
     * This event is emitted when an address has existing UTXO entries that
     * may have been received during previous sessions or while the wallet
     * was offline.
     * 
     * @category Wallet Events
     */
    export type IDiscoveryEvent = TransactionRecord;
    


    /**
     * Emitted by {@link Wallet} when the wallet is successfully reloaded.
     * 
     * @category Wallet Events
     */
    export interface IWalletReloadEvent {
        walletDescriptor : IWalletDescriptor;
        accountDescriptors : IAccountDescriptor[];
    }
    


    /**
     * Emitted by {@link UtxoContext} when detecting a reorg transaction condition.
     * A transaction is considered reorg if it has been removed from the UTXO set
     * as a part of the network reorg process. Transactions notified with this event
     * should be considered as invalid and should be removed from the application state.
     * Associated UTXOs will be automatically removed from the UtxoContext state.
     * 
     * @category Wallet Events
     */
    export type IReorgEvent = TransactionRecord;
    


    /**
     * Emitted by {@link UtxoProcessor} when it detects that connected node does not have UTXO index enabled.
     * 
     * @category Wallet Events
     */
    export interface IUtxoIndexNotEnabledEvent {
        url? : string;
    }
    


    /**
     * Emitted by {@link Wallet} when an account has been selected.
     * This event is used internally in Rust SDK to track currently
     * selected account in the Rust CLI wallet.
     * 
     * @category Wallet Events
     */
    export interface IAccountSelectionEvent {
        id? : HexString;
    }
    


    /**
     * 
     * 
     * @category  Wallet API
     */
    export interface IWalletConfig {
        /**
         * `resident` is a boolean indicating if the wallet should not be stored on the permanent medium.
         */
        resident?: boolean;
        networkId?: NetworkId | string;
        encoding?: Encoding | string;
        url?: string;
        resolver?: Resolver;
    }
    


        interface Wallet {
            /**
            * @param {WalletNotificationCallback} callback
            */
            addEventListener(callback:WalletNotificationCallback): void;
            /**
            * @param {WalletEventType} event
            * @param {WalletNotificationCallback} [callback]
            */
            addEventListener<M extends keyof WalletEventMap>(
                event: M,
                callback: (eventData: WalletEventMap[M]) => void
            )
        }





    /**
     * Interface defining response from the {@link createTransactions} function.
     * 
     * @category Wallet SDK
     */
    export interface ICreateTransactions {
        /**
         * Array of pending unsigned transactions.
         */
        transactions : PendingTransaction[];
        /**
         * Summary of the transaction generation process.
         */
        summary : GeneratorSummary;
    }
    


/**
 * Color range configuration for Hex View.
 * 
 * @category General
 */ 
export interface IHexViewColor {
    start: number;
    end: number;
    color?: string;
    background?: string;
}

/**
 * Configuration interface for Hex View.
 * 
 * @category General
 */ 
export interface IHexViewConfig {
    offset? : number;
    replacementCharacter? : string;
    width? : number;
    colors? : IHexViewColor[];
}



/**
 * A string containing a hexadecimal representation of the data (typically representing for IDs or Hashes).
 * 
 * @category General
 */ 
export type HexString = string;



    /**
     * RPC Resolver configuration options
     * 
     * @category Node RPC
     */
    export interface IResolverConfig {
        /**
         * Optional URLs for one or multiple resolvers.
         */
        urls?: string[];
        /**
         * Use strict TLS for RPC connections.
         * If not set or `false` (default), the resolver will
         * provide the best available connection regardless of
         * whether this connection supports TLS or not.
         * If set to `true`, the resolver will only provide
         * TLS-enabled connections.
         * 
         * This setting is ignored in the browser environment
         * when the browser navigator location is `https`.
         * In which case the resolver will always use TLS-enabled
         * connections.
         */
        tls?: boolean;
    }
    


    /**
     * RPC Resolver connection options
     * 
     * @category Node RPC
     */
    export interface IResolverConnect {
        /**
         * RPC encoding: `borsh` (default) or `json`
         */
        encoding?: Encoding | string;
        /**
         * Network identifier: `mainnet` or `testnet-11` etc.
         */
        networkId?: NetworkId | string;
    }
    



/**
 * RPC notification events.
 * 
 * @see {RpcClient.addEventListener}, {RpcClient.removeEventListener}
 */
export enum RpcEventType {
    Connect = "connect",
    Disconnect = "disconnect",
    BlockAdded = "block-added",
    VirtualChainChanged = "virtual-chain-changed",
    FinalityConflict = "finality-conflict",
    FinalityConflictResolved = "finality-conflict-resolved",
    UtxosChanged = "utxos-changed",
    SinkBlueScoreChanged = "sink-blue-score-changed",
    VirtualDaaScoreChanged = "virtual-daa-score-changed",
    PruningPointUtxoSetOverride = "pruning-point-utxo-set-override",
    NewBlockTemplate = "new-block-template",
}

/**
 * RPC notification data payload.
 * 
 * @category Node RPC
 */
export type RpcEventData = IBlockAdded 
    | IVirtualChainChanged 
    | IFinalityConflict 
    | IFinalityConflictResolved 
    | IUtxosChanged 
    | ISinkBlueScoreChanged 
    | IVirtualDaaScoreChanged 
    | IPruningPointUtxoSetOverride 
    | INewBlockTemplate;

/**
 * RPC notification event data map.
 * 
 * @category Node RPC
 */
export type RpcEventMap = {
    "connect" : undefined,
    "disconnect" : undefined,
    "block-added" : IBlockAdded,
    "virtual-chain-changed" : IVirtualChainChanged,
    "finality-conflict" : IFinalityConflict,
    "finality-conflict-resolved" : IFinalityConflictResolved,
    "utxos-changed" : IUtxosChanged,
    "sink-blue-score-changed" : ISinkBlueScoreChanged,
    "virtual-daa-score-changed" : IVirtualDaaScoreChanged,
    "pruning-point-utxo-set-override" : IPruningPointUtxoSetOverride,
    "new-block-template" : INewBlockTemplate,
}

/**
 * RPC notification event.
 * 
 * @category Node RPC
 */
export type RpcEvent = {
    [K in keyof RpcEventMap]: { event: K, data: RpcEventMap[K] }
}[keyof RpcEventMap];

/**
 * RPC notification callback type.
 * 
 * This type is used to define the callback function that is called when an RPC notification is received.
 * 
 * @see {@link RpcClient.subscribeVirtualDaaScoreChanged},
 * {@link RpcClient.subscribeUtxosChanged}, 
 * {@link RpcClient.subscribeVirtualChainChanged},
 * {@link RpcClient.subscribeBlockAdded},
 * {@link RpcClient.subscribeFinalityConflict},
 * {@link RpcClient.subscribeFinalityConflictResolved},
 * {@link RpcClient.subscribeSinkBlueScoreChanged},
 * {@link RpcClient.subscribePruningPointUtxoSetOverride},
 * {@link RpcClient.subscribeNewBlockTemplate},
 * 
 * @category Node RPC
 */
export type RpcEventCallback = (event: RpcEvent) => void;




    /**
     * Finality conflict resolved notification event is produced when a finality
     * conflict in the Kaspa BlockDAG is resolved.
     * 
     * @category Node RPC
     */
    export interface IFinalityConflictResolved {
        [key: string]: any;
    }
    


    /**
     * Block added notification event is produced when a new
     * block is added to the Kaspa BlockDAG.
     * 
     * @category Node RPC
     */
    export interface IBlockAdded {
        [key: string]: any;
    }
    


    /**
     * Virtual chain changed notification event is produced when the virtual
     * chain changes in the Kaspa BlockDAG.
     * 
     * @category Node RPC
     */
    export interface IVirtualChainChanged {
        [key: string]: any;
    }
    


    /**
     * Pruning point UTXO set override notification event is produced when the
     * UTXO set override for the pruning point changes in the Kaspa BlockDAG.
     * 
     * @category Node RPC
     */
    export interface IPruningPointUtxoSetOverride {
        [key: string]: any;
    }
    


    /**
     * Finality conflict notification event is produced when a finality
     * conflict occurs in the Kaspa BlockDAG.
     * 
     * @category Node RPC
     */
    export interface IFinalityConflict {
        [key: string]: any;
    }
    


    /**
     * Virtual DAA score changed notification event is produced when the virtual
     * Difficulty Adjustment Algorithm (DAA) score changes in the Kaspa BlockDAG.
     * 
     * @category Node RPC
     */
    export interface IVirtualDaaScoreChanged {
        [key: string]: any;
    }
    


    /**
     * UTXOs changed notification event is produced when the set
     * of unspent transaction outputs (UTXOs) changes in the
     * Kaspa BlockDAG. The event notification is scoped to the
     * monitored list of addresses specified during the subscription.
     * 
     * @category Node RPC
     */
    export interface IUtxosChanged {
        [key: string]: any;
    }
    


    /**
     * New block template notification event is produced when a new block
     * template is generated for mining in the Kaspa BlockDAG.
     * 
     * @category Node RPC
     */
    export interface INewBlockTemplate {
        [key: string]: any;
    }
    


    /**
     * Sink blue score changed notification event is produced when the blue
     * score of the sink block changes in the Kaspa BlockDAG.
     * 
     * @category Node RPC
     */
    export interface ISinkBlueScoreChanged {
        [key: string]: any;
    }
    


        interface RpcClient {
            /**
            * @param {RpcEventCallback} callback
            */
            addEventListener(callback:RpcEventCallback): void;
            /**
            * @param {RpcEventType} event
            * @param {RpcEventCallback} [callback]
            */
            addEventListener<M extends keyof RpcEventMap>(
                event: M,
                callback: (eventData: RpcEventMap[M]) => void
            )
        }


    /**
     * RPC client configuration options
     *
     * @category Node RPC
     */
    export interface IRpcConfig {
        /**
         * An instance of the {@link Resolver} class to use for an automatic public node lookup.
         * If supplying a resolver, the `url` property is ignored.
         */
        resolver? : Resolver,
        /**
         * URL for wRPC node endpoint
         */
        url?: string;
        /**
         * RPC encoding: `borsh` or `json` (default is `borsh`)
         */
        encoding?: Encoding;
        /**
         * Network identifier: `mainnet`, `testnet-10` etc.
         * `networkId` is required when using a resolver.
         */
        networkId?: NetworkId | string;
    }
    


/**
 * Interface for configuring workflow-rs WASM32 bindings.
 * 
 * @category General
 */
export interface IWASM32BindingsConfig {
    /**
     * This option can be used to disable the validation of class names
     * for instances of classes exported by Rust WASM32 when passing
     * these classes to WASM32 functions.
     * 
     * This can be useful to programmatically disable checks when using
     * a bundler that mangles class symbol names.
     */
    validateClassNames : boolean;
}




        /**
         * `WebSocketConfig` is used to configure the `WebSocket`.
         * 
         * @category WebSocket
         */
        export interface IWebSocketConfig {
            /** Maximum size of the WebSocket message. */
            maxMessageSize: number,
            /** Maximum size of the WebSocket frame. */
            maxFrameSize: number,
        }
        



        /**
         * `ConnectOptions` is used to configure the `WebSocket` connectivity behavior.
         * 
         * @category WebSocket
         */
        export interface IConnectOptions {
            /**
             * Indicates if the `async fn connect()` method should return immediately
             * or wait for connection to occur or fail before returning.
             * (default is `true`)
             */
            blockAsyncConnect? : boolean,
            /**
             * ConnectStrategy used to configure the retry or fallback behavior.
             * In retry mode, the WebSocket will continuously attempt to connect to the server.
             * (default is {link ConnectStrategy.Retry}).
             */
            strategy?: ConnectStrategy | string,
            /** 
             * A custom URL that will change the current URL of the WebSocket.
             * If supplied, the URL will override the use of resolver.
             */
            url?: string,
            /**
             * A custom connection timeout in milliseconds.
             */
            timeoutDuration?: number,
            /** 
             * A custom retry interval in milliseconds.
             */
            retryInterval?: number,
        }
        

/**
 *
 * Abortable trigger wraps an `Arc<AtomicBool>`, which can be cloned
 * to signal task terminating using an atomic bool.
 *
 * ```text
 * let abortable = Abortable::default();
 * let result = my_task(abortable).await?;
 * // ... elsewhere
 * abortable.abort();
 * ```
 *
 * @category General
 */
export class Abortable {
  free(): void;
  isAborted(): boolean;
  constructor();
  abort(): void;
  check(): void;
  reset(): void;
}
/**
 * Error emitted by [`Abortable`].
 * @category General
 */
export class Aborted {
  private constructor();
  free(): void;
}
/**
 *
 * Account kind is a string signature that represents an account type.
 * Account kind is used to identify the account type during
 * serialization, deserialization and various API calls.
 *
 * @category Wallet SDK
 */
export class AccountKind {
  free(): void;
  toString(): string;
  constructor(kind: string);
}
/**
 * Kaspa [`Address`] struct that serializes to and from an address format string: `kaspa:qz0s...t8cv`.
 *
 * @category Address
 */
export class Address {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  constructor(address: string);
  /**
   * Convert an address to a string.
   */
  toString(): string;
  static validate(address: string): boolean;
  readonly prefix: string;
  readonly payload: string;
  readonly version: string;
  set setPrefix(value: string);
}
export class AgentConstructorOptions {
  private constructor();
  free(): void;
  keep_alive: boolean;
  max_sockets: number;
  timeout: number;
  keep_alive_msecs: number;
  max_free_sockets: number;
}
export class AppendFileOptions {
  free(): void;
  constructor(encoding?: string | null, mode?: number | null, flag?: string | null);
  static new(): AppendFileOptions;
  get encoding(): string | undefined;
  set encoding(value: string | null | undefined);
  get flag(): string | undefined;
  set flag(value: string | null | undefined);
  get mode(): number | undefined;
  set mode(value: number | null | undefined);
}
export class AssertionErrorOptions {
  free(): void;
  constructor(message: string | null | undefined, actual: any, expected: any, operator: string);
  /**
   * The actual property on the error instance.
   */
  actual: any;
  /**
   * If provided, the error message is set to this value.
   */
  get message(): string | undefined;
  set message(value: string | null | undefined);
  /**
   * The expected property on the error instance.
   */
  expected: any;
  /**
   * The operator property on the error instance.
   */
  operator: string;
}
/**
 *
 * Represents a {@link UtxoContext} (account) balance.
 *
 * @see {@link IBalance}, {@link UtxoContext}
 *
 * @category Wallet SDK
 */
export class Balance {
  private constructor();
  free(): void;
  toBalanceStrings(network_type: NetworkType | NetworkId | string): BalanceStrings;
  /**
   * Confirmed amount of funds available for spending.
   */
  readonly mature: bigint;
  /**
   * Amount of funds that are being received and are not yet confirmed.
   */
  readonly pending: bigint;
  /**
   * Amount of funds that are being send and are not yet accepted by the network.
   */
  readonly outgoing: bigint;
}
/**
 *
 * Formatted string representation of the {@link Balance}.
 *
 * The value is formatted as `123,456.789`.
 *
 * @category Wallet SDK
 */
export class BalanceStrings {
  private constructor();
  free(): void;
  readonly mature: string;
  readonly pending: string | undefined;
}
/**
 * An efficient cumulative-sum run-length encoding for the parents-by-level vector in the block header.
 * @category Consensus
 */
export class CompressedParents {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  /**
   * Converts the compressed parents to an expanded `JsValue` of `Array<Array<HexString>>`.
   */
  toExpanded(): any;
  /**
   * The number of levels in the expanded representation.
   */
  expandedLen(): number;
  /**
   * Get the parent hashes at a specific level.
   * Returns an array of `HexString`s.
   */
  get(index: number): any;
  constructor(js_value: any);
}
export class ConsoleConstructorOptions {
  free(): void;
  constructor(stdout: any, stderr: any, ignore_errors: boolean | null | undefined, color_mod: any, inspect_options?: object | null);
  static new(stdout: any, stderr: any): ConsoleConstructorOptions;
  stderr: any;
  stdout: any;
  get ignore_errors(): boolean | undefined;
  set ignore_errors(value: boolean | null | undefined);
  color_mod: any;
  get inspect_options(): object | undefined;
  set inspect_options(value: object | null | undefined);
}
export class CovenantBinding {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  toJSON(): object;
  constructor(authorizing_input: number, covenant_id: Hash);
  covenantId: Hash;
  authorizingInput: number;
}
export class CreateHookCallbacks {
  free(): void;
  constructor(init: Function, before: Function, after: Function, destroy: Function, promise_resolve: Function);
  before: Function;
  destroy: Function;
  promise_resolve: Function;
  init: Function;
  after: Function;
}
export class CreateReadStreamOptions {
  free(): void;
  constructor(auto_close?: boolean | null, emit_close?: boolean | null, encoding?: string | null, end?: number | null, fd?: number | null, flags?: string | null, high_water_mark?: number | null, mode?: number | null, start?: number | null);
  get auto_close(): boolean | undefined;
  set auto_close(value: boolean | null | undefined);
  get emit_close(): boolean | undefined;
  set emit_close(value: boolean | null | undefined);
  get encoding(): string | undefined;
  set encoding(value: string | null | undefined);
  get high_water_mark(): number | undefined;
  set high_water_mark(value: number | null | undefined);
  get fd(): number | undefined;
  set fd(value: number | null | undefined);
  get end(): number | undefined;
  set end(value: number | null | undefined);
  get mode(): number | undefined;
  set mode(value: number | null | undefined);
  get flags(): string | undefined;
  set flags(value: string | null | undefined);
  get start(): number | undefined;
  set start(value: number | null | undefined);
}
export class CreateWriteStreamOptions {
  free(): void;
  constructor(auto_close?: boolean | null, emit_close?: boolean | null, encoding?: string | null, fd?: number | null, flags?: string | null, mode?: number | null, start?: number | null);
  get auto_close(): boolean | undefined;
  set auto_close(value: boolean | null | undefined);
  get emit_close(): boolean | undefined;
  set emit_close(value: boolean | null | undefined);
  get encoding(): string | undefined;
  set encoding(value: string | null | undefined);
  get fd(): number | undefined;
  set fd(value: number | null | undefined);
  get mode(): number | undefined;
  set mode(value: number | null | undefined);
  get flags(): string | undefined;
  set flags(value: string | null | undefined);
  get start(): number | undefined;
  set start(value: number | null | undefined);
}
/**
 *
 * CryptoBox allows for encrypting and decrypting messages using the `crypto_box` crate.
 *
 * <https://docs.rs/crypto_box/0.9.1/crypto_box/>
 *
 *  @category Wallet SDK
 */
export class CryptoBox {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  constructor(secretKey: CryptoBoxPrivateKey | HexString | Uint8Array, peerPublicKey: CryptoBoxPublicKey | HexString | Uint8Array);
  decrypt(base64string: string): string;
  encrypt(plaintext: string): string;
  readonly publicKey: string;
}
/**
 * @category Wallet SDK
 */
export class CryptoBoxPrivateKey {
  free(): void;
  to_public_key(): CryptoBoxPublicKey;
  constructor(secretKey: HexString | Uint8Array);
}
/**
 * @category Wallet SDK
 */
export class CryptoBoxPublicKey {
  free(): void;
  toString(): string;
  constructor(publicKey: HexString | Uint8Array);
}
/**
 *
 * Key derivation path
 *
 * @category Wallet SDK
 */
export class DerivationPath {
  free(): void;
  /**
   * Get the count of [`ChildNumber`] values in this derivation path.
   */
  length(): number;
  constructor(path: string);
  /**
   * Push a [`ChildNumber`] onto an existing derivation path.
   */
  push(child_number: number, hardened?: boolean | null): void;
  /**
   * Get the parent [`DerivationPath`] for the current one.
   *
   * Returns `Undefined` if this is already the root path.
   */
  parent(): DerivationPath | undefined;
  toString(): string;
  /**
   * Is this derivation path empty? (i.e. the root)
   */
  isEmpty(): boolean;
}
export class FormatInputPathObject {
  free(): void;
  constructor(base?: string | null, dir?: string | null, ext?: string | null, name?: string | null, root?: string | null);
  static new(): FormatInputPathObject;
  get dir(): string | undefined;
  set dir(value: string | null | undefined);
  get ext(): string | undefined;
  set ext(value: string | null | undefined);
  get base(): string | undefined;
  set base(value: string | null | undefined);
  get name(): string | undefined;
  set name(value: string | null | undefined);
  get root(): string | undefined;
  set root(value: string | null | undefined);
}
/**
 * Generator is a type capable of generating transactions based on a supplied
 * set of UTXO entries or a UTXO entry producer (such as {@link UtxoContext}). The Generator
 * accumulates UTXO entries until it can generate a transaction that meets the
 * requested amount or until the total mass of created inputs exceeds the allowed
 * transaction mass, at which point it will produce a compound transaction by forwarding
 * all selected UTXO entries to the supplied change address and prepare to start generating
 * a new transaction.  Such sequence of daisy-chained transactions is known as a "batch".
 * Each compound transaction results in a new UTXO, which is immediately reused in the
 * subsequent transaction.
 *
 * The Generator constructor accepts a single {@link IGeneratorSettingsObject} object.
 *
 * ```javascript
 *
 * let generator = new Generator({
 *     utxoEntries : [...],
 *     changeAddress : "kaspa:...",
 *     outputs : [
 *         { amount : kaspaToSompi(10.0), address: "kaspa:..."},
 *         { amount : kaspaToSompi(20.0), address: "kaspa:..."},
 *         ...
 *     ],
 *     priorityFee : 1000n,
 * });
 *
 * let pendingTransaction;
 * while(pendingTransaction = await generator.next()) {
 *     await pendingTransaction.sign(privateKeys);
 *     await pendingTransaction.submit(rpc);
 * }
 *
 * let summary = generator.summary();
 * console.log(summary);
 *
 * ```
 * @see
 *     {@link IGeneratorSettingsObject},
 *     {@link PendingTransaction},
 *     {@link UtxoContext},
 *     {@link createTransactions},
 *     {@link estimateTransactions},
 * @category Wallet SDK
 */
export class Generator {
  free(): void;
  constructor(args: IGeneratorSettingsObject);
  /**
   * Generate next transaction
   */
  next(): Promise<any>;
  summary(): GeneratorSummary;
  estimate(): Promise<GeneratorSummary>;
}
/**
 *
 * A class containing a summary produced by transaction {@link Generator}.
 * This class contains the number of transactions, the aggregated fees,
 * the aggregated UTXOs and the final transaction amount that includes
 * both network and QoS (priority) fees.
 *
 * @see {@link createTransactions}, {@link IGeneratorSettingsObject}, {@link Generator}
 * @category Wallet SDK
 */
export class GeneratorSummary {
  private constructor();
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  readonly networkType: NetworkType;
  readonly fees: bigint;
  readonly mass: bigint;
  readonly utxos: number;
  readonly finalTransactionId: string | undefined;
  readonly finalAmount: bigint | undefined;
  readonly transactions: number;
}
/**
 * A genesis covenant group for bulk covenant binding population.
 *
 * All listed outputs are bound to the same covenant id, derived from the
 * authorizing input outpoint and this exact ordered output list.
 * @category Consensus
 */
export class GenesisCovenantGroup {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  toString(): string;
  toJSON(): object;
  constructor(authorizing_input: number, outputs: Array<number>);
  outputs: Array<number>;
  authorizingInput: number;
}
export class GetNameOptions {
  private constructor();
  free(): void;
  static new(family: number | null | undefined, host: string, local_address: string, port: number): GetNameOptions;
  get family(): number | undefined;
  set family(value: number | null | undefined);
  local_address: string;
  host: string;
  port: number;
}
/**
 * @category General
 */
export class Hash {
  free(): void;
  constructor(hex_str: string);
  toString(): string;
}
/**
 * Kaspa Block Header
 *
 * @category Consensus
 */
export class Header {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  constructor(js_value: Header | IHeader | IRawHeader);
  /**
   * Finalizes the header and recomputes (updates) the header hash
   * @return { String } header hash
   */
  finalize(): string;
  getBlueWorkAsHex(): string;
  /**
   * Obtain `JSON` representation of the header. JSON representation
   * should be obtained using WASM, to ensure proper serialization of
   * big integers.
   */
  asJSON(): string;
  blueScore: bigint;
  version: number;
  timestamp: bigint;
  daaScore: bigint;
  readonly hash: string;
  get pruningPoint(): string;
  set pruningPoint(value: any);
  get utxoCommitment(): string;
  set utxoCommitment(value: any);
  get hashMerkleRoot(): string;
  set hashMerkleRoot(value: any);
  get blueWork(): bigint;
  set blueWork(value: any);
  parentsByLevel: any;
  get acceptedIdMerkleRoot(): string;
  set acceptedIdMerkleRoot(value: any);
  bits: number;
  nonce: bigint;
}
/**
 * Data structure that contains a secret and public keys.
 * @category Wallet SDK
 */
export class Keypair {
  private constructor();
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  /**
   * Get the [`Address`] of this Keypair's [`PublicKey`].
   * Receives a [`NetworkType`](kaspa_consensus_core::network::NetworkType)
   * to determine the prefix of the address.
   * JavaScript: `let address = keypair.toAddress(NetworkType.MAINNET);`.
   */
  toAddress(network: NetworkType | NetworkId | string): Address;
  /**
   * Create a new [`Keypair`] from a [`PrivateKey`].
   * JavaScript: `let privkey = new PrivateKey(hexString); let keypair = privkey.toKeypair();`.
   */
  static fromPrivateKey(secret_key: PrivateKey): Keypair;
  /**
   * Get `ECDSA` [`Address`] of this Keypair's [`PublicKey`].
   * Receives a [`NetworkType`](kaspa_consensus_core::network::NetworkType)
   * to determine the prefix of the address.
   * JavaScript: `let address = keypair.toAddress(NetworkType.MAINNET);`.
   */
  toAddressECDSA(network: NetworkType | NetworkId | string): Address;
  /**
   * Create a new random [`Keypair`].
   * JavaScript: `let keypair = Keypair::random();`.
   */
  static random(): Keypair;
  /**
   * Get the [`PublicKey`] of this [`Keypair`].
   */
  readonly publicKey: string;
  /**
   * Get the [`PrivateKey`] of this [`Keypair`].
   */
  readonly privateKey: string;
  /**
   * Get the `XOnlyPublicKey` of this [`Keypair`].
   */
  readonly xOnlyPublicKey: any;
}
export class MkdtempSyncOptions {
  free(): void;
  constructor(encoding?: string | null);
  static new(): MkdtempSyncOptions;
  get encoding(): string | undefined;
  set encoding(value: string | null | undefined);
}
/**
 * BIP39 mnemonic phrases: sequences of words representing cryptographic keys.
 * @category Wallet SDK
 */
export class Mnemonic {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  constructor(phrase: string, language?: Language | null);
  toSeed(password?: string | null): string;
  static random(word_count?: number | null): Mnemonic;
  /**
   * Validate mnemonic phrase. Returns `true` if the phrase is valid, `false` otherwise.
   */
  static validate(phrase: string, language?: Language | null): boolean;
  phrase: string;
  entropy: string;
}
export class NetServerOptions {
  private constructor();
  free(): void;
  get allow_half_open(): boolean | undefined;
  set allow_half_open(value: boolean | null | undefined);
  get pause_on_connect(): boolean | undefined;
  set pause_on_connect(value: boolean | null | undefined);
}
/**
 *
 * NetworkId is a unique identifier for a kaspa network instance.
 * It is composed of a network type and an optional suffix.
 *
 * @category Consensus
 */
export class NetworkId {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  toString(): string;
  addressPrefix(): string;
  constructor(value: any);
  type: NetworkType;
  get suffix(): number | undefined;
  set suffix(value: number | null | undefined);
  readonly id: string;
}
/**
 *
 * Data structure representing a Node connection endpoint
 * as provided by the {@link Resolver}.
 *
 * @category Node RPC
 */
export class NodeDescriptor {
  private constructor();
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  /**
   * The unique identifier of the node.
   */
  uid: string;
  /**
   * The URL of the node WebSocket (wRPC URL).
   */
  url: string;
}
export class OptionalHeader {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  constructor(js_value: OptionalHeader | IOptionalHeader);
  readonly blueScore: bigint | undefined;
  readonly blueWork: any;
  readonly pruningPoint: string | undefined;
  readonly utxoCommitment: string | undefined;
  readonly hashMerkleRoot: string | undefined;
  readonly parentsByLevel: CompressedParents | undefined;
  readonly acceptedIdMerkleRoot: string | undefined;
  readonly bits: number | undefined;
  readonly hash: string | undefined;
  readonly nonce: bigint | undefined;
  readonly version: number | undefined;
  readonly daaScore: bigint | undefined;
  readonly timestamp: bigint | undefined;
}
export class PSKB {
  free(): void;
  static deserialize(hex_data: string): PSKB;
  displayFormat(network_id: NetworkId | string): string;
  add(pskt: PSKT): void;
  constructor();
  merge(other: PSKB): void;
  serialize(): string;
  readonly length: number;
}
export class PSKT {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  /**
   * Change role to `CONSTRUCTOR`
   */
  toConstructor(): PSKT;
  calculateId(): Hash;
  setSequence(n: bigint, input_index: number): PSKT;
  calculateMass(data: any): bigint;
  noMoreInputs(): PSKT;
  noMoreOutputs(): PSKT;
  inputAndRedeemScript(input: ITransactionInput | TransactionInput, data: any): PSKT;
  inputsModifiable(): PSKT;
  fallbackLockTime(lock_time: bigint): PSKT;
  outputsModifiable(): PSKT;
  constructor(payload: PSKT | Transaction | string | undefined);
  input(input: ITransactionInput | TransactionInput): PSKT;
  output(output: ITransactionOutput | TransactionOutput): PSKT;
  /**
   * Change role to `SIGNER`
   */
  toSigner(): PSKT;
  /**
   * Change role to `CREATOR`
   * #[wasm_bindgen(js_name = toCreator)]
   */
  creator(): PSKT;
  /**
   * Change role to `UPDATER`
   */
  toUpdater(): PSKT;
  /**
   * Change role to `COMBINER`
   */
  toCombiner(): PSKT;
  /**
   * Change role to `EXTRACTOR`
   */
  toExtractor(): PSKT;
  /**
   * Change role to `FINALIZER`
   */
  toFinalizer(): PSKT;
  serialize(): string;
  readonly role: string;
  readonly payload: any;
}
/**
 * A Rust data structure representing a single payment
 * output containing a destination address, amount and covenant.
 *
 * @category Wallet SDK
 */
export class PaymentOutput {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  /**
   * Factory method for covenant variant
   */
  static withCovenant(address: Address, amount: bigint, covenant: CovenantBinding): PaymentOutput;
  /**
   * Main constructor (no covenant)
   */
  constructor(address: Address, amount: bigint);
  address: Address;
  amount: bigint;
  get covenant(): CovenantBinding | undefined;
  set covenant(value: CovenantBinding | null | undefined);
}
/**
 * @category Wallet SDK
 */
export class PaymentOutputs {
  free(): void;
  constructor(output_array: IPaymentOutput[]);
}
/**
 * @category Wallet SDK
 */
export class PendingTransaction {
  private constructor();
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  /**
   * Sets a signature to the input at the specified index.
   */
  fillInput(input_index: number, signature_script: HexString | Uint8Array): void;
  /**
   * Signs the input at the specified index with the supplied private key
   * and an optional SighashType.
   */
  signInput(input_index: number, private_key: PrivateKey, sighash_type?: SighashType | null): void;
  /**
   * Provides a list of UTXO entries used by the transaction.
   */
  getUtxoEntries(): Array<any>;
  /**
   * Serializes the transaction to a JSON string.
   * The schema of the JSON is defined by {@link ISerializableTransaction}.
   * Once serialized, the transaction can be deserialized using {@link Transaction.deserializeFromJSON}.
   * @see {@link Transaction}, {@link ISerializableTransaction}
   */
  serializeToJSON(): string;
  /**
   * Serializes the transaction to a pure JavaScript Object.
   * The schema of the JavaScript object is defined by {@link ISerializableTransaction}.
   * @see {@link ISerializableTransaction}
   * @see {@link Transaction}, {@link ISerializableTransaction}
   */
  serializeToObject(): ITransaction | Transaction;
  /**
   * Creates and returns a signature for the input at the specified index.
   */
  createInputSignature(input_index: number, private_key: PrivateKey, sighash_type?: SighashType | null): HexString;
  /**
   * Serializes the transaction to a "Safe" JSON schema where it converts all `bigint` values to `string` to avoid potential client-side precision loss.
   * Once serialized, the transaction can be deserialized using {@link Transaction.deserializeFromSafeJSON}.
   * @see {@link Transaction}, {@link ISerializableTransaction}
   */
  serializeToSafeJSON(): string;
  /**
   * Signs transaction with supplied [`Array`] or [`PrivateKey`] or an array of
   * raw private key bytes (encoded as `Uint8Array` or as hex strings)
   */
  sign(js_value: (PrivateKey | HexString | Uint8Array)[], check_fully_signed?: boolean | null): void;
  /**
   * Submit transaction to the supplied [`RpcClient`]
   * **IMPORTANT:** This method will remove UTXOs from the associated
   * {@link UtxoContext} if one was used to create the transaction
   * and will return UTXOs back to {@link UtxoContext} in case of
   * a failed submission.
   *
   * # Important
   *
   * Make sure to consume the returned `txid` value. Always invoke this method
   * as follows `let txid = await pendingTransaction.submit(rpc);`. If you do not
   * consume the returned value and the rpc object is temporary, the GC will
   * collect the `rpc` object passed to submit() potentially causing a panic.
   *
   * @see {@link RpcClient.submitTransaction}
   */
  submit(wasm_rpc_client: RpcClient): Promise<string>;
  /**
   * List of unique addresses used by transaction inputs.
   * This method can be used to determine addresses used by transaction inputs
   * in order to select private keys needed for transaction signing.
   */
  addresses(): Array<any>;
  /**
   * Returns encapsulated network [`Transaction`]
   */
  readonly transaction: Transaction;
  /**
   * Change amount (if any).
   */
  readonly changeAmount: bigint;
  /**
   * Total amount transferred to the destination (aggregate output - change).
   */
  readonly paymentAmount: any;
  /**
   * Minimum number of signatures required by the transaction.
   * (as specified during the transaction creation).
   */
  readonly minimumSignatures: number;
  /**
   * Total aggregate input amount.
   */
  readonly aggregateInputAmount: bigint;
  /**
   * Total aggregate output amount.
   */
  readonly aggregateOutputAmount: bigint;
  /**
   * Transaction Id
   */
  readonly id: string;
  /**
   * Total transaction fees (network fees + priority fees).
   */
  readonly feeAmount: bigint;
  /**
   * Transaction type ("batch" or "final").
   */
  readonly type: string;
  /**
   * Calculated transaction mass.
   */
  readonly mass: bigint;
}
export class PipeOptions {
  free(): void;
  constructor(end?: boolean | null);
  get end(): boolean | undefined;
  set end(value: boolean | null | undefined);
}
/**
 * Represents a Kaspa header PoW manager
 * @category Mining
 */
export class PoW {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  /**
   * Checks if the computed target meets or exceeds the difficulty specified in the template.
   * @returns A boolean indicating if it reached the target and a bigint representing the reached target.
   */
  checkWork(nonce: bigint): [boolean, bigint];
  constructor(header: Header | IHeader | IRawHeader, timestamp?: bigint | null);
  /**
   * Can be used for parsing Stratum templates.
   */
  static fromRaw(pre_pow_hash: string, timestamp: bigint, target_bits?: number | null): PoW;
  /**
   * Hash of the header without timestamp and nonce.
   */
  readonly prePoWHash: string;
  /**
   * The target based on the provided bits.
   */
  readonly target: bigint;
}
/**
 * Data structure that envelops a Private Key.
 * @category Wallet SDK
 */
export class PrivateKey {
  free(): void;
  /**
   * Get the [`Address`] of the PublicKey generated from this PrivateKey.
   * Receives a [`NetworkType`](kaspa_consensus_core::network::NetworkType)
   * to determine the prefix of the address.
   * JavaScript: `let address = privateKey.toAddress(NetworkType.MAINNET);`.
   */
  toAddress(network: NetworkType | NetworkId | string): Address;
  /**
   * Generate a [`Keypair`] from this [`PrivateKey`].
   */
  toKeypair(): Keypair;
  toPublicKey(): PublicKey;
  /**
   * Get `ECDSA` [`Address`] of the PublicKey generated from this PrivateKey.
   * Receives a [`NetworkType`](kaspa_consensus_core::network::NetworkType)
   * to determine the prefix of the address.
   * JavaScript: `let address = privateKey.toAddress(NetworkType.MAINNET);`.
   */
  toAddressECDSA(network: NetworkType | NetworkId | string): Address;
  /**
   * Returns the [`PrivateKey`] key encoded as a hex string.
   */
  toString(): string;
  /**
   * Create a new [`PrivateKey`] from a hex-encoded string.
   */
  constructor(key: string);
}
/**
 *
 * Helper class to generate private keys from an extended private key (XPrv).
 * This class accepts the master Kaspa XPrv string (e.g. `xprv1...`) and generates
 * private keys for the receive and change paths given the pre-set parameters
 * such as account index, multisig purpose and cosigner index.
 *
 * Please note that in Kaspa master private keys use `kprv` prefix.
 *
 * @see {@link PublicKeyGenerator}, {@link XPub}, {@link XPrv}, {@link Mnemonic}
 * @category Wallet SDK
 */
export class PrivateKeyGenerator {
  free(): void;
  changeKey(index: number): PrivateKey;
  receiveKey(index: number): PrivateKey;
  constructor(xprv: XPrv | string, is_multisig: boolean, account_index: bigint, cosigner_index?: number | null);
}
export class ProcessSendOptions {
  free(): void;
  constructor(swallow_errors?: boolean | null);
  get swallow_errors(): boolean | undefined;
  set swallow_errors(value: boolean | null | undefined);
}
/**
 * @category Wallet SDK
 */
export class PrvKeyDataInfo {
  private constructor();
  free(): void;
  setName(_name: string): void;
  readonly isEncrypted: any;
  readonly id: string;
  readonly name: any;
}
/**
 * Data structure that envelopes a PublicKey.
 * Only supports Schnorr-based addresses.
 * @category Wallet SDK
 */
export class PublicKey {
  free(): void;
  /**
   * Compute a 4-byte key fingerprint for this public key as a hex string.
   * Default implementation uses `RIPEMD160(SHA256(public_key))`.
   */
  fingerprint(): HexString | undefined;
  /**
   * Get the [`Address`] of this PublicKey.
   * Receives a [`NetworkType`] to determine the prefix of the address.
   * JavaScript: `let address = publicKey.toAddress(NetworkType.MAINNET);`.
   */
  toAddress(network: NetworkType | NetworkId | string): Address;
  toString(): string;
  /**
   * Get `ECDSA` [`Address`] of this PublicKey.
   * Receives a [`NetworkType`] to determine the prefix of the address.
   * JavaScript: `let address = publicKey.toAddress(NetworkType.MAINNET);`.
   */
  toAddressECDSA(network: NetworkType | NetworkId | string): Address;
  toXOnlyPublicKey(): XOnlyPublicKey;
  /**
   * Create a new [`PublicKey`] from a hex-encoded string.
   */
  constructor(key: string);
}
/**
 *
 * Helper class to generate public keys from an extended public key (XPub)
 * that has been derived up to the co-signer index.
 *
 * Please note that in Kaspa master public keys use `kpub` prefix.
 *
 * @see {@link PrivateKeyGenerator}, {@link XPub}, {@link XPrv}, {@link Mnemonic}
 * @category Wallet SDK
 */
export class PublicKeyGenerator {
  private constructor();
  free(): void;
  /**
   * Generate a single Change Public Key derivation at a given index.
   */
  changePubkey(index: number): PublicKey;
  /**
   * Generate a single Change Address derivation at a given index.
   */
  changeAddress(networkType: NetworkType | NetworkId | string, index: number): Address;
  /**
   * Generate Change Public Key derivations for a given range.
   */
  changePubkeys(start: number, end: number): (PublicKey | string)[];
  /**
   * Generate a single Receive Public Key derivation at a given index.
   */
  receivePubkey(index: number): PublicKey;
  /**
   * Generate a single Receive Address derivation at a given index.
   */
  receiveAddress(networkType: NetworkType | NetworkId | string, index: number): Address;
  /**
   * Generate Receive Public Key derivations for a given range.
   */
  receivePubkeys(start: number, end: number): (PublicKey | string)[];
  /**
   * Generate Change Address derivations for a given range.
   */
  changeAddresses(networkType: NetworkType | NetworkId | string, start: number, end: number): Address[];
  static fromMasterXPrv(xprv: XPrv | string, is_multisig: boolean, account_index: bigint, cosigner_index?: number | null): PublicKeyGenerator;
  /**
   * Generate Receive Address derivations for a given range.
   */
  receiveAddresses(networkType: NetworkType | NetworkId | string, start: number, end: number): Address[];
  /**
   * Generate a single Change Public Key derivation at a given index and return it as a string.
   */
  changePubkeyAsString(index: number): string;
  /**
   * Generate a single Change Address derivation at a given index and return it as a string.
   */
  changeAddressAsString(networkType: NetworkType | NetworkId | string, index: number): string;
  /**
   * Generate a single Receive Public Key derivation at a given index and return it as a string.
   */
  receivePubkeyAsString(index: number): string;
  /**
   * Generate a range of Change Public Key derivations and return them as strings.
   */
  changePubkeysAsStrings(start: number, end: number): Array<string>;
  /**
   * Generate a single Receive Address derivation at a given index and return it as a string.
   */
  receiveAddressAsString(networkType: NetworkType | NetworkId | string, index: number): string;
  /**
   * Generate a range of Receive Public Key derivations and return them as strings.
   */
  receivePubkeysAsStrings(start: number, end: number): Array<string>;
  /**
   * Generate a range of Change Address derivations and return them as strings.
   */
  changeAddressAsStrings(networkType: NetworkType | NetworkId | string, start: number, end: number): Array<string>;
  /**
   * Generate a range of Receive Address derivations and return them as strings.
   */
  receiveAddressAsStrings(networkType: NetworkType | NetworkId | string, start: number, end: number): Array<string>;
  static fromXPub(kpub: XPub | string, cosigner_index?: number | null): PublicKeyGenerator;
  toString(): string;
}
/**
 *
 * Resolver is a client for obtaining public Kaspa wRPC URL.
 *
 * Resolver queries a list of public Kaspa Resolver URLs using HTTP to fetch
 * wRPC endpoints for the given encoding, network identifier and other
 * parameters. It then provides this information to the {@link RpcClient}.
 *
 * Each time {@link RpcClient} disconnects, it will query the resolver
 * to fetch a new wRPC URL.
 *
 * ```javascript
 * // using integrated public URLs
 * let rpc = RpcClient({
 *     resolver: new Resolver(),
 *     networkId : "mainnet"
 * });
 *
 * // specifying custom resolver URLs
 * let rpc = RpcClient({
 *     resolver: new Resolver({urls: ["<resolver-url>",...]}),
 *     networkId : "mainnet"
 * });
 * ```
 *
 * @see {@link IResolverConfig}, {@link IResolverConnect}, {@link RpcClient}
 * @category Node RPC
 */
export class Resolver {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  /**
   * Creates a new Resolver client with the given
   * configuration supplied as {@link IResolverConfig}
   * interface. If not supplied, the default configuration
   * containing a list of community-operated resolvers
   * will be used.
   */
  constructor(args?: IResolverConfig | string[] | null);
  /**
   * Connect to a public Kaspa wRPC endpoint for the given encoding and network identifier
   * supplied via {@link IResolverConnect} interface.
   * @see {@link IResolverConnect}, {@link RpcClient}
   */
  connect(options: IResolverConnect | NetworkId | string): Promise<RpcClient>;
  /**
   * Fetches a public Kaspa wRPC endpoint URL for the given encoding and network identifier.
   * @see {@link Encoding}, {@link NetworkId}
   */
  getUrl(encoding: Encoding, network_id: NetworkId | string): Promise<string>;
  /**
   * Fetches a public Kaspa wRPC endpoint for the given encoding and network identifier.
   * @see {@link Encoding}, {@link NetworkId}, {@link Node}
   */
  getNode(encoding: Encoding, network_id: NetworkId | string): Promise<NodeDescriptor>;
  /**
   * List of public Kaspa Resolver URLs.
   */
  readonly urls: string[] | undefined;
}
/**
 *
 *
 * Kaspa RPC client uses ([wRPC](https://github.com/workflow-rs/workflow-rs/tree/master/rpc))
 * interface to connect directly with Kaspa Node. wRPC supports
 * two types of encodings: `borsh` (binary, default) and `json`.
 *
 * There are two ways to connect: Directly to any Kaspa Node or to a
 * community-maintained public node infrastructure using the {@link Resolver} class.
 *
 * **Connecting to a public node using a resolver**
 *
 * ```javascript
 * let rpc = new RpcClient({
 *    resolver : new Resolver(),
 *    networkId : "mainnet",
 * });
 *
 * await rpc.connect();
 * ```
 *
 * **Connecting to a Kaspa Node directly**
 *
 * ```javascript
 * let rpc = new RpcClient({
 *    // if port is not provided it will default
 *    // to the default port for the networkId
 *    url : "127.0.0.1",
 *    networkId : "mainnet",
 * });
 * ```
 *
 * **Example usage**
 *
 * ```javascript
 *
 * // Create a new RPC client with a URL
 * let rpc = new RpcClient({ url : "wss://<node-wrpc-address>" });
 *
 * // Create a new RPC client with a resolver
 * // (networkId is required when using a resolver)
 * let rpc = new RpcClient({
 *     resolver : new Resolver(),
 *     networkId : "mainnet",
 * });
 *
 * rpc.addEventListener("connect", async (event) => {
 *     console.log("Connected to", rpc.url);
 *     await rpc.subscribeDaaScore();
 * });
 *
 * rpc.addEventListener("disconnect", (event) => {
 *     console.log("Disconnected from", rpc.url);
 * });
 *
 * try {
 *     await rpc.connect();
 * } catch(err) {
 *     console.log("Error connecting:", err);
 * }
 *
 * ```
 *
 * You can register event listeners to receive notifications from the RPC client
 * using {@link RpcClient.addEventListener} and {@link RpcClient.removeEventListener} functions.
 *
 * **IMPORTANT:** If RPC is disconnected, upon reconnection you do not need
 * to re-register event listeners, but your have to re-subscribe for Kaspa node
 * notifications:
 *
 * ```typescript
 * rpc.addEventListener("connect", async (event) => {
 *     console.log("Connected to", rpc.url);
 *     // re-subscribe each time we connect
 *     await rpc.subscribeDaaScore();
 *     // ... perform wallet address subscriptions
 * });
 *
 * ```
 *
 * If using NodeJS, it is important that {@link RpcClient.disconnect} is called before
 * the process exits to ensure that the WebSocket connection is properly closed.
 * Failure to do this will prevent the process from exiting.
 *
 * @category Node RPC
 */
export class RpcClient {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  /**
   * Disconnect from the Kaspa RPC server.
   */
  disconnect(): Promise<void>;
  /**
   * Retrieves multiple blocks from the Kaspa BlockDAG.
   * Returned information: List of block information.
   * @see {@link IGetBlocksRequest}, {@link IGetBlocksResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getBlocks(request: IGetBlocksRequest): Promise<IGetBlocksResponse>;
  /**
   * Retrieves block headers from the Kaspa BlockDAG.
   * Returned information: List of block headers.
   * @see {@link IGetHeadersRequest}, {@link IGetHeadersResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getHeaders(request: IGetHeadersRequest): Promise<IGetHeadersResponse>;
  /**
   * Retrieves various metrics and statistics related to the
   * performance and status of the Kaspa node.
   * Returned information: Memory usage, CPU usage, network activity.
   * @see {@link IGetMetricsRequest}, {@link IGetMetricsResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getMetrics(request?: IGetMetricsRequest | null): Promise<IGetMetricsResponse>;
  static defaultPort(encoding: Encoding, network: NetworkType | NetworkId | string): number;
  /**
   * Set the resolver for the RPC client.
   * This setting will take effect on the next connection.
   */
  setResolver(resolver: Resolver): void;
  /**
   * Submits a block to the Kaspa network.
   * Returned information: None.
   * @see {@link ISubmitBlockRequest}, {@link ISubmitBlockResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  submitBlock(request: ISubmitBlockRequest): Promise<ISubmitBlockResponse>;
  /**
   * Triggers a disconnection on the underlying WebSocket
   * if the WebSocket is in connected state.
   * This is intended for debug purposes only.
   * Can be used to test application reconnection logic.
   */
  triggerAbort(): void;
  /**
   * Retrieves information about a subnetwork in the Kaspa BlockDAG.
   * Returned information: Subnetwork information.
   * @see {@link IGetSubnetworkRequest}, {@link IGetSubnetworkResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getSubnetwork(request: IGetSubnetworkRequest): Promise<IGetSubnetworkResponse>;
  /**
   * Set the network id for the RPC client.
   * This setting will take effect on the next connection.
   */
  setNetworkId(network_id: NetworkId | string): void;
  /**
   * Retrieves the current number of blocks in the Kaspa BlockDAG.
   * This is not a block count, not a "block height" and can not be
   * used for transaction validation.
   * Returned information: Current block count.
   * @see {@link IGetBlockCountRequest}, {@link IGetBlockCountResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getBlockCount(request?: IGetBlockCountRequest | null): Promise<IGetBlockCountResponse>;
  /**
   * Returns the total current coin supply of Kaspa network.
   * Returned information: Total coin supply.
   * @see {@link IGetCoinSupplyRequest}, {@link IGetCoinSupplyResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getCoinSupply(request?: IGetCoinSupplyRequest | null): Promise<IGetCoinSupplyResponse>;
  /**
   * Retrieves current number of network connections
   * @see {@link IGetConnectionsRequest}, {@link IGetConnectionsResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getConnections(request?: IGetConnectionsRequest | null): Promise<IGetConnectionsResponse>;
  /**
   * Retrieves information about the Kaspa server.
   * Returned information: Version of the Kaspa server, protocol
   * version, network identifier.
   * @see {@link IGetServerInfoRequest}, {@link IGetServerInfoResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getServerInfo(request?: IGetServerInfoRequest | null): Promise<IGetServerInfoResponse>;
  /**
   * Obtains basic information about the synchronization status of the Kaspa node.
   * Returned information: Syncing status.
   * @see {@link IGetSyncStatusRequest}, {@link IGetSyncStatusResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getSyncStatus(request?: IGetSyncStatusRequest | null): Promise<IGetSyncStatusResponse>;
  /**
   * Feerate estimates
   * @see {@link IGetFeeEstimateRequest}, {@link IGetFeeEstimateResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getFeeEstimate(request?: IGetFeeEstimateRequest | null): Promise<IGetFeeEstimateResponse>;
  /**
   * Retrieves a specific mempool entry by transaction ID.
   * Returned information: Mempool entry information.
   * @see {@link IGetMempoolEntryRequest}, {@link IGetMempoolEntryResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getMempoolEntry(request: IGetMempoolEntryRequest): Promise<IGetMempoolEntryResponse>;
  /**
   * Provides information about the Directed Acyclic Graph (DAG)
   * structure of the Kaspa BlockDAG.
   * Returned information: Number of blocks in the DAG,
   * number of tips in the DAG, hash of the selected parent block,
   * difficulty of the selected parent block, selected parent block
   * blue score, selected parent block time.
   * @see {@link IGetBlockDagInfoRequest}, {@link IGetBlockDagInfoResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getBlockDagInfo(request?: IGetBlockDagInfoRequest | null): Promise<IGetBlockDagInfoResponse>;
  /**
   * Generates a new block template for mining.
   * Returned information: Block template information.
   * @see {@link IGetBlockTemplateRequest}, {@link IGetBlockTemplateResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getBlockTemplate(request: IGetBlockTemplateRequest): Promise<IGetBlockTemplateResponse>;
  /**
   * Provides a list of addresses of known peers in the Kaspa
   * network that the node can potentially connect to.
   * Returned information: List of peer addresses.
   * @see {@link IGetPeerAddressesRequest}, {@link IGetPeerAddressesResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getPeerAddresses(request?: IGetPeerAddressesRequest | null): Promise<IGetPeerAddressesResponse>;
  /**
   * Submits a transaction to the Kaspa network.
   * Returned information: Submitted Transaction Id.
   * @see {@link ISubmitTransactionRequest}, {@link ISubmitTransactionResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  submitTransaction(request: ISubmitTransactionRequest): Promise<ISubmitTransactionResponse>;
  /**
   * Retrieves the current network configuration.
   * Returned information: Current network configuration.
   * @see {@link IGetCurrentNetworkRequest}, {@link IGetCurrentNetworkResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getCurrentNetwork(request?: IGetCurrentNetworkRequest | null): Promise<IGetCurrentNetworkResponse>;
  /**
   * Retrieves mempool entries from the Kaspa node's mempool.
   * Returned information: List of mempool entries.
   * @see {@link IGetMempoolEntriesRequest}, {@link IGetMempoolEntriesResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getMempoolEntries(request: IGetMempoolEntriesRequest): Promise<IGetMempoolEntriesResponse>;
  /**
   * Returns the blue score of the current sink block, indicating
   * the total amount of work that has been done on the main chain
   * leading up to that block.
   * Returned information: Blue score of the sink block.
   * @see {@link IGetSinkBlueScoreRequest}, {@link IGetSinkBlueScoreResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getSinkBlueScore(request?: IGetSinkBlueScoreRequest | null): Promise<IGetSinkBlueScoreResponse>;
  /**
   * Manage subscription for a virtual DAA score changed notification event.
   * Virtual DAA score changed notification event is produced when the virtual
   * Difficulty Adjustment Algorithm (DAA) score changes in the Kaspa BlockDAG.
   */
  subscribeVirtualDaaScoreChanged(): Promise<void>;
  /**
   *
   * Unregister a single event listener callback from all events.
   *
   *
   */
  clearEventListener(callback: RpcEventCallback): void;
  /**
   * Retrieves reward information for a block.
   * Returned information: block color, confirmation count, reward, merging chain block, and header.
   * @see {@link IGetBlockRewardInfoRequest}, {@link IGetBlockRewardInfoResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getBlockRewardInfo(request: IGetBlockRewardInfoRequest): Promise<IGetBlockRewardInfoResponse>;
  /**
   *
   * Unregister an event listener.
   * This function will remove the callback for the specified event.
   * If the `callback` is not supplied, all callbacks will be
   * removed for the specified event.
   *
   * @see {@link RpcClient.addEventListener}
   */
  removeEventListener(event: RpcEventType | string, callback?: RpcEventCallback | null): void;
  /**
   * Manage subscription for a block added notification event.
   * Block added notification event is produced when a new
   * block is added to the Kaspa BlockDAG.
   */
  subscribeBlockAdded(): Promise<void>;
  /**
   * Manage subscription for a virtual DAA score changed notification event.
   * Virtual DAA score changed notification event is produced when the virtual
   * Difficulty Adjustment Algorithm (DAA) score changes in the Kaspa BlockDAG.
   */
  unsubscribeVirtualDaaScoreChanged(): Promise<void>;
  /**
   * Retrieves the balance of a specific address in the Kaspa BlockDAG.
   * Returned information: Balance of the address.
   * @see {@link IGetBalanceByAddressRequest}, {@link IGetBalanceByAddressResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getBalanceByAddress(request: IGetBalanceByAddressRequest): Promise<IGetBalanceByAddressResponse>;
  /**
   * Retrieves unspent transaction outputs (UTXOs) associated with
   * specific addresses.
   * Returned information: List of UTXOs.
   * @see {@link IGetUtxosByAddressesRequest}, {@link IGetUtxosByAddressesResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getUtxosByAddresses(request: IGetUtxosByAddressesRequest | Address[] | string[]): Promise<IGetUtxosByAddressesResponse>;
  /**
   * Retrieves information about the peers connected to the Kaspa node.
   * Returned information: Peer ID, IP address and port, connection
   * status, protocol version.
   * @see {@link IGetConnectedPeerInfoRequest}, {@link IGetConnectedPeerInfoResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getConnectedPeerInfo(request?: IGetConnectedPeerInfoRequest | null): Promise<IGetConnectedPeerInfoResponse>;
  /**
   * Checks if block is blue or not.
   * Returned information: Block blueness.
   * @see {@link IGetCurrentBlockColorRequest}, {@link IGetCurrentBlockColorResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getCurrentBlockColor(request: IGetCurrentBlockColorRequest): Promise<IGetCurrentBlockColorResponse>;
  /**
   * Get UTXO Return Addresses.
   * @see {@link IGetUtxoReturnAddressRequest}, {@link IGetUtxoReturnAddressResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getUtxoReturnAddress(request: IGetUtxoReturnAddressRequest): Promise<IGetUtxoReturnAddressResponse>;
  /**
   * Subscribe for a UTXOs changed notification event.
   * UTXOs changed notification event is produced when the set
   * of unspent transaction outputs (UTXOs) changes in the
   * Kaspa BlockDAG. The event notification will be scoped to the
   * provided list of addresses.
   */
  subscribeUtxosChanged(addresses: (Address | string)[]): Promise<void>;
  unsubscribeBlockAdded(): Promise<void>;
  /**
   * Retrieves balances for multiple addresses in the Kaspa BlockDAG.
   * Returned information: Balances of the addresses.
   * @see {@link IGetBalancesByAddressesRequest}, {@link IGetBalancesByAddressesResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getBalancesByAddresses(request: IGetBalancesByAddressesRequest | Address[] | string[]): Promise<IGetBalancesByAddressesResponse>;
  /**
   * Resolves a finality conflict in the Kaspa BlockDAG.
   * Returned information: None.
   * @see {@link IResolveFinalityConflictRequest}, {@link IResolveFinalityConflictResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  resolveFinalityConflict(request: IResolveFinalityConflictRequest): Promise<IResolveFinalityConflictResponse>;
  /**
   * Unsubscribe from UTXOs changed notification event
   * for a specific set of addresses.
   */
  unsubscribeUtxosChanged(addresses: (Address | string)[]): Promise<void>;
  /**
   *
   * Unregister all notification callbacks for all events.
   */
  removeAllEventListeners(): void;
  /**
   * Manage subscription for a finality conflict notification event.
   * Finality conflict notification event is produced when a finality
   * conflict occurs in the Kaspa BlockDAG.
   */
  subscribeFinalityConflict(): Promise<void>;
  /**
   * Retrieves the virtual chain corresponding to a specified block hash.
   * Returned information: Virtual chain information.
   * @see {@link IGetVirtualChainFromBlockRequest}, {@link IGetVirtualChainFromBlockResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getVirtualChainFromBlock(request: IGetVirtualChainFromBlockRequest): Promise<IGetVirtualChainFromBlockResponse>;
  /**
   * Manage subscription for a new block template notification event.
   * New block template notification event is produced when a new block
   * template is generated for mining in the Kaspa BlockDAG.
   */
  subscribeNewBlockTemplate(): Promise<void>;
  /**
   * Feerate estimates (experimental)
   * @see {@link IGetFeeEstimateExperimentalRequest}, {@link IGetFeeEstimateExperimentalResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getFeeEstimateExperimental(request: IGetFeeEstimateExperimentalRequest): Promise<IGetFeeEstimateExperimentalResponse>;
  unsubscribeFinalityConflict(): Promise<void>;
  /**
   * Submits an RBF transaction to the Kaspa network.
   * Returned information: Submitted Transaction Id, Transaction that was replaced.
   * @see {@link ISubmitTransactionReplacementRequest}, {@link ISubmitTransactionReplacementResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  submitTransactionReplacement(request: ISubmitTransactionReplacementRequest): Promise<ISubmitTransactionReplacementResponse>;
  unsubscribeNewBlockTemplate(): Promise<void>;
  /**
   * Retrieves the virtual chain corresponding to a specified block hash.
   * Returned information: Virtual chain information. (Version 2)
   * May be used to get fully populated transactions
   * @see {@link IGetVirtualChainFromBlockV2Request}, {@link IGetVirtualChainFromBlockV2Response}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getVirtualChainFromBlockV2(request: IGetVirtualChainFromBlockV2Request): Promise<IGetVirtualChainFromBlockV2Response>;
  /**
   * Manage subscription for a virtual chain changed notification event.
   * Virtual chain changed notification event is produced when the virtual
   * chain changes in the Kaspa BlockDAG.
   */
  subscribeVirtualChainChanged(include_accepted_transaction_ids: boolean): Promise<void>;
  /**
   * Retrieves the estimated DAA (Difficulty Adjustment Algorithm)
   * score timestamp estimate.
   * Returned information: DAA score timestamp estimate.
   * @see {@link IGetDaaScoreTimestampEstimateRequest}, {@link IGetDaaScoreTimestampEstimateResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getDaaScoreTimestampEstimate(request: IGetDaaScoreTimestampEstimateRequest): Promise<IGetDaaScoreTimestampEstimateResponse>;
  /**
   * Retrieves mempool entries associated with specific addresses.
   * Returned information: List of mempool entries.
   * @see {@link IGetMempoolEntriesByAddressesRequest}, {@link IGetMempoolEntriesByAddressesResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getMempoolEntriesByAddresses(request: IGetMempoolEntriesByAddressesRequest): Promise<IGetMempoolEntriesByAddressesResponse>;
  /**
   * Manage subscription for a sink blue score changed notification event.
   * Sink blue score changed notification event is produced when the blue
   * score of the sink block changes in the Kaspa BlockDAG.
   */
  subscribeSinkBlueScoreChanged(): Promise<void>;
  /**
   * Manage subscription for a virtual chain changed notification event.
   * Virtual chain changed notification event is produced when the virtual
   * chain changes in the Kaspa BlockDAG.
   */
  unsubscribeVirtualChainChanged(include_accepted_transaction_ids: boolean): Promise<void>;
  /**
   * Estimates the network's current hash rate in hashes per second.
   * Returned information: Estimated network hashes per second.
   * @see {@link IEstimateNetworkHashesPerSecondRequest}, {@link IEstimateNetworkHashesPerSecondResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  estimateNetworkHashesPerSecond(request: IEstimateNetworkHashesPerSecondRequest): Promise<IEstimateNetworkHashesPerSecondResponse>;
  unsubscribeSinkBlueScoreChanged(): Promise<void>;
  /**
   * Manage subscription for a finality conflict resolved notification event.
   * Finality conflict resolved notification event is produced when a finality
   * conflict in the Kaspa BlockDAG is resolved.
   */
  subscribeFinalityConflictResolved(): Promise<void>;
  unsubscribeFinalityConflictResolved(): Promise<void>;
  /**
   * Bans a peer from connecting to the Kaspa node for a specified duration.
   * Returned information: None.
   * @see {@link IBanRequest}, {@link IBanResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  ban(request: IBanRequest): Promise<IBanResponse>;
  /**
   * Manage subscription for a pruning point UTXO set override notification event.
   * Pruning point UTXO set override notification event is produced when the
   * UTXO set override for the pruning point changes in the Kaspa BlockDAG.
   */
  subscribePruningPointUtxoSetOverride(): Promise<void>;
  unsubscribePruningPointUtxoSetOverride(): Promise<void>;
  /**
   *
   * Create a new RPC client with optional {@link Encoding} and a `url`.
   *
   * @see {@link IRpcConfig} interface for more details.
   */
  constructor(config?: IRpcConfig | null);
  /**
   * Tests the connection and responsiveness of a Kaspa node.
   * Returned information: None.
   * @see {@link IPingRequest}, {@link IPingResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  ping(request?: IPingRequest | null): Promise<IPingResponse>;
  /**
   * Stop background RPC services (automatically stopped when invoking {@link RpcClient.disconnect}).
   */
  stop(): Promise<void>;
  /**
   * Start background RPC services (automatically started when invoking {@link RpcClient.connect}).
   */
  start(): Promise<void>;
  /**
   * Unbans a previously banned peer, allowing it to connect
   * to the Kaspa node again.
   * Returned information: None.
   * @see {@link IUnbanRequest}, {@link IUnbanResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  unban(request: IUnbanRequest): Promise<IUnbanResponse>;
  /**
   * Connect to the Kaspa RPC server. This function starts a background
   * task that connects and reconnects to the server if the connection
   * is terminated.  Use [`disconnect()`](Self::disconnect()) to
   * terminate the connection.
   * @see {@link IConnectOptions} interface for more details.
   */
  connect(args?: IConnectOptions | undefined | null): Promise<void>;
  /**
   * Adds a peer to the Kaspa node's list of known peers.
   * Returned information: None.
   * @see {@link IAddPeerRequest}, {@link IAddPeerResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  addPeer(request: IAddPeerRequest): Promise<IAddPeerResponse>;
  /**
   * Retrieves general information about the Kaspa node.
   * Returned information: Version of the Kaspa node, protocol
   * version, network identifier.
   * This call is primarily used by gRPC clients.
   * For wRPC clients, use {@link RpcClient.getServerInfo}.
   * @see {@link IGetInfoRequest}, {@link IGetInfoResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getInfo(request?: IGetInfoRequest | null): Promise<IGetInfoResponse>;
  /**
   * Retrieves the current sink block, which is the block with
   * the highest cumulative difficulty in the Kaspa BlockDAG.
   * Returned information: Sink block hash, sink block height.
   * @see {@link IGetSinkRequest}, {@link IGetSinkResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  getSink(request?: IGetSinkRequest | null): Promise<IGetSinkResponse>;
  /**
   * Gracefully shuts down the Kaspa node.
   * Returned information: None.
   * @see {@link IShutdownRequest}, {@link IShutdownResponse}
   * @throws `string` on an RPC error or a server-side error.
   */
  shutdown(request?: IShutdownRequest | null): Promise<IShutdownResponse>;
  /**
   * Retrieves a specific block from the Kaspa BlockDAG.
   * Returned information: Block information.
   * @see {@link IGetBlockRequest}, {@link IGetBlockResponse}
   * @throws `string` on an RPC error, a server-side error or when supplying incorrect arguments.
   */
  getBlock(request: IGetBlockRequest): Promise<IGetBlockResponse>;
  /**
   * Constructs an WebSocket RPC URL given the partial URL or an IP, RPC encoding
   * and a network type.
   *
   * # Arguments
   *
   * * `url` - Partial URL or an IP address
   * * `encoding` - RPC encoding
   * * `network_type` - Network type
   */
  static parseUrl(url: string, encoding: Encoding, network: NetworkId): string;
  /**
   * Current nerwork id
   */
  readonly networkId: NetworkId | undefined;
  /**
   * The current connection status of the RPC client.
   */
  readonly isConnected: boolean;
  /**
   * Optional: Resolver node id.
   */
  readonly nodeId: string | undefined;
  /**
   * The current URL of the RPC client.
   */
  readonly url: string | undefined;
  /**
   * The current protocol encoding.
   */
  readonly encoding: string;
  /**
   * Current rpc resolver
   */
  readonly resolver: Resolver | undefined;
}
/**
 * ScriptBuilder provides a facility for building custom scripts. It allows
 * you to push opcodes, ints, and data while respecting canonical encoding. In
 * general it does not ensure the script will execute correctly, however any
 * data pushes which would exceed the maximum allowed script engine limits and
 * are therefore guaranteed not to execute will not be pushed and will result in
 * the Script function returning an error.
 * @category Consensus
 */
export class ScriptBuilder {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  /**
   * Creates a new ScriptBuilder over an existing script.
   * Supplied script can be represented as an `Uint8Array` or a `HexString`.
   */
  static fromScript(script: HexString | Uint8Array, options?: ScriptBuilderOptions | null): ScriptBuilder;
  addSequence(sequence: bigint): ScriptBuilder;
  /**
   * Get script bytes represented by a hex string.
   */
  toString(): HexString;
  addLockTime(lock_time: bigint): ScriptBuilder;
  static canonicalDataSize(data: HexString | Uint8Array): number;
  /**
   * Creates an equivalent pay-to-script-hash script.
   * Can be used to create an P2SH address.
   * @see {@link addressFromScriptPublicKey}
   */
  createPayToScriptHashScript(): ScriptPublicKey;
  /**
   * Generates a signature script that fits a pay-to-script-hash script.
   */
  encodePayToScriptHashSignatureScript(signature: HexString | Uint8Array): HexString;
  constructor(options?: ScriptBuilderOptions | null);
  /**
   * Drains (empties) the script builder, returning the
   * script bytes represented by a hex string.
   */
  drain(): HexString;
  /**
   * Pushes the passed opcode to the end of the script. The script will not
   * be modified if pushing the opcode would cause the script to exceed the
   * maximum allowed script engine size.
   */
  addOp(op: number): ScriptBuilder;
  addI64(value: bigint): ScriptBuilder;
  /**
   * Adds the passed opcodes to the end of the script.
   * Supplied opcodes can be represented as an `Uint8Array` or a `HexString`.
   */
  addOps(opcodes: HexString | Uint8Array): ScriptBuilder;
  /**
   * AddData pushes the passed data to the end of the script. It automatically
   * chooses canonical opcodes depending on the length of the data.
   *
   * A zero length buffer will lead to a push of empty data onto the stack (Op0 = OpFalse)
   * and any push of data greater than the maximum script element size will not modify
   * the script since that is not allowed by the script engine.
   *
   * Also, the script will not be modified if pushing the data would cause the script to
   * exceed the maximum allowed script engine size.
   */
  addData(data: HexString | Uint8Array): ScriptBuilder;
  hexView(args?: IHexViewConfig | null): string;
}
/**
 * Represents a Kaspad ScriptPublicKey
 * @category Consensus
 */
export class ScriptPublicKey {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  constructor(version: number, script: any);
  readonly script: string;
  version: number;
}
export class SetAadOptions {
  free(): void;
  constructor(flush: Function, plaintext_length: number, transform: Function);
  transform: Function;
  readonly plaintextLength: number;
  set plaintext_length(value: number);
  flush: Function;
}
export class SigHashType {
  private constructor();
  free(): void;
}
/**
 * Wallet file storage interface
 * @category Wallet SDK
 */
export class Storage {
  private constructor();
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  readonly filename: string;
}
export class StreamTransformOptions {
  free(): void;
  constructor(flush: Function, transform: Function);
  transform: Function;
  flush: Function;
}
/**
 * Represents a Kaspa transaction.
 * This is an artificial construct that includes additional
 * transaction-related data such as additional data from UTXOs
 * used by transaction inputs.
 * @category Consensus
 */
export class Transaction {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  constructor(js_value: ITransaction | Transaction);
  /**
   * Determines whether or not a transaction is a coinbase transaction. A coinbase
   * transaction is a special transaction created by miners that distributes fees and block subsidy
   * to the previous blocks' miners, and specifies the script_pub_key that will be used to pay the current
   * miner in future blocks.
   */
  is_coinbase(): boolean;
  /**
   * Serializes the transaction to a JSON string.
   * The schema of the JSON is defined by {@link ISerializableTransaction}.
   */
  serializeToJSON(): string;
  /**
   * Serializes the transaction to a pure JavaScript Object.
   * The schema of the JavaScript object is defined by {@link ISerializableTransaction}.
   * @see {@link ISerializableTransaction}
   */
  serializeToObject(): ISerializableTransaction;
  /**
   * Deserialize the {@link Transaction} Object from a JSON string.
   */
  static deserializeFromJSON(json: string): Transaction;
  /**
   * Serializes the transaction to a "Safe" JSON schema where it converts all `bigint` values to `string` to avoid potential client-side precision loss.
   */
  serializeToSafeJSON(): string;
  /**
   * Deserialize the {@link Transaction} Object from a pure JavaScript Object.
   */
  static deserializeFromObject(js_value: any): Transaction;
  /**
   * Deserialize the {@link Transaction} Object from a "Safe" JSON schema where all `bigint` values are represented as `string`.
   */
  static deserializeFromSafeJSON(json: string): Transaction;
  populateGenesisCovenants(groups: (IGenesisCovenantGroup | GenesisCovenantGroup)[]): void;
  /**
   * Recompute and finalize the tx id based on updated tx fields
   */
  finalize(): Hash;
  /**
   * Returns a list of unique addresses used by transaction inputs.
   * This method can be used to determine addresses used by transaction inputs
   * in order to select private keys needed for transaction signing.
   */
  addresses(network_type: NetworkType | NetworkId | string): Address[];
  version: number;
  lockTime: bigint;
  storageMass: bigint;
  get inputs(): TransactionInput[];
  set inputs(value: (ITransactionInput | TransactionInput)[]);
  get outputs(): TransactionOutput[];
  set outputs(value: (ITransactionOutput | TransactionOutput)[]);
  get subnetworkId(): string;
  set subnetworkId(value: any);
  get payload(): string;
  set payload(value: any);
  gas: bigint;
  /**
   * @deprecated Use `storageMass` instead
   */
  mass: bigint;
  /**
   * Returns the transaction ID
   */
  readonly id: string;
}
/**
 * Represents a Kaspa transaction input
 * @category Consensus
 */
export class TransactionInput {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  constructor(value: ITransactionInput | TransactionInput);
  sequence: bigint;
  sigOpCount: number;
  computeBudget: number;
  get previousOutpoint(): TransactionOutpoint;
  set previousOutpoint(value: any);
  get signatureScript(): string | undefined;
  set signatureScript(value: any);
  readonly utxo: UtxoEntryReference | undefined;
}
/**
 * Represents a Kaspa transaction outpoint.
 * NOTE: This struct is immutable - to create a custom outpoint
 * use the `TransactionOutpoint::new` constructor. (in JavaScript
 * use `new TransactionOutpoint(transactionId, index)`).
 * @category Consensus
 */
export class TransactionOutpoint {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  constructor(transaction_id: Hash, index: number);
  getId(): string;
  readonly transactionId: string;
  readonly index: number;
}
/**
 * Represents a Kaspad transaction output
 * @category Consensus
 */
export class TransactionOutput {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  /**
   * TransactionOutput constructor
   */
  constructor(value: bigint, script_public_key: ScriptPublicKey, covenant?: CovenantBinding | null);
  get covenant(): CovenantBinding | undefined;
  set covenant(value: CovenantBinding);
  scriptPublicKey: ScriptPublicKey;
  value: bigint;
}
/**
 * @category Wallet SDK
 */
export class TransactionRecord {
  private constructor();
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  /**
   * Check if the transaction record has the given address within the associated UTXO set.
   */
  hasAddress(address: Address): boolean;
  maturityProgress(currentDaaScore: bigint): string;
  /**
   * Serialize the transaction record to a JavaScript object.
   */
  serialize(): any;
  readonly data: ITransactionData;
  readonly value: bigint;
  readonly binding: IBinding;
  readonly blockDaaScore: bigint;
  readonly type: string;
  id: Hash;
  /**
   * Unix time in milliseconds
   */
  get unixtimeMsec(): bigint | undefined;
  /**
   * Unix time in milliseconds
   */
  set unixtimeMsec(value: bigint | null | undefined);
  network: NetworkId;
  get note(): string | undefined;
  set note(value: string | null | undefined);
  get metadata(): string | undefined;
  set metadata(value: string | null | undefined);
}
export class TransactionRecordNotification {
  private constructor();
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  type: string;
  data: TransactionRecord;
}
/**
 * @category Wallet SDK
 */
export class TransactionSigningHash {
  free(): void;
  constructor();
  update(data: HexString | Uint8Array): void;
  finalize(): string;
}
/**
 * @category Wallet SDK
 */
export class TransactionSigningHashECDSA {
  free(): void;
  constructor();
  update(data: HexString | Uint8Array): void;
  finalize(): string;
}
/**
 * Holds details about an individual transaction output in a utxo
 * set such as whether or not it was contained in a coinbase tx, the daa
 * score of the block that accepts the tx, its public key script, and how
 * much it pays.
 * @category Consensus
 */
export class TransactionUtxoEntry {
  private constructor();
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  amount: bigint;
  scriptPublicKey: ScriptPublicKey;
  blockDaaScore: bigint;
  isCoinbase: boolean;
  get covenantId(): Hash | undefined;
  set covenantId(value: Hash | null | undefined);
}
export class UserInfoOptions {
  free(): void;
  constructor(encoding?: string | null);
  static new(): UserInfoOptions;
  get encoding(): string | undefined;
  set encoding(value: string | null | undefined);
}
/**
 *
 * UtxoContext is a class that provides a way to track addresses activity
 * on the Kaspa network.  When an address is registered with UtxoContext
 * it aggregates all UTXO entries for that address and emits events when
 * any activity against these addresses occurs.
 *
 * UtxoContext constructor accepts {@link IUtxoContextArgs} interface that
 * can contain an optional id parameter.  If supplied, this `id` parameter
 * will be included in all notifications emitted by the UtxoContext as
 * well as included as a part of {@link ITransactionRecord} emitted when
 * transactions occur. If not provided, a random id will be generated. This id
 * typically represents an account id in the context of a wallet application.
 * The integrated Wallet API uses UtxoContext to represent wallet accounts.
 *
 * **Exchanges:** if you are building an exchange wallet, it is recommended
 * to use UtxoContext for each user account.  This way you can track and isolate
 * each user activity (use address set, balances, transaction records).
 *
 * UtxoContext maintains a real-time cumulative balance of all addresses
 * registered against it and provides balance update notification events
 * when the balance changes.
 *
 * The UtxoContext balance is comprised of 3 values:
 * - `mature`: amount of funds available for spending.
 * - `pending`: amount of funds that are being received.
 * - `outgoing`: amount of funds that are being sent but are not yet accepted by the network.
 *
 * Please see {@link IBalance} interface for more details.
 *
 * UtxoContext can be supplied as a UTXO source to the transaction {@link Generator}
 * allowing the {@link Generator} to create transactions using the
 * UTXO entries it manages.
 *
 * **IMPORTANT:** UtxoContext is meant to represent a single account.  It is not
 * designed to be used as a global UTXO manager for all addresses in a very large
 * wallet (such as an exchange wallet). For such use cases, it is recommended to
 * perform manual UTXO management by subscribing to UTXO notifications using
 * {@link RpcClient.subscribeUtxosChanged} and {@link RpcClient.getUtxosByAddresses}.
 *
 * @see {@link IUtxoContextArgs},
 * {@link UtxoProcessor},
 * {@link Generator},
 * {@link createTransactions},
 * {@link IBalance},
 * {@link IBalanceEvent},
 * {@link IPendingEvent},
 * {@link IReorgEvent},
 * {@link IStasisEvent},
 * {@link IMaturityEvent},
 * {@link IDiscoveryEvent},
 * {@link IBalanceEvent},
 * {@link ITransactionRecord}
 *
 * @category Wallet SDK
 */
export class UtxoContext {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  /**
   *
   * Returns a range of mature UTXO entries that are currently
   * managed by the UtxoContext and are available for spending.
   *
   * NOTE: This function is provided for informational purposes only.
   * **You should not manage UTXO entries manually if they are owned by UtxoContext.**
   *
   * The resulting range may be less than requested if UTXO entries
   * have been spent asynchronously by UtxoContext or by other means
   * (i.e. UtxoContext has received notification from the network that
   * UtxoEntries have been spent externally).
   *
   * UtxoEntries are kept in in the ascending sorted order by their amount.
   */
  getMatureRange(from: number, to: number): UtxoEntryReference[];
  /**
   * Performs a scan of the given addresses and registers them in the context for event notifications.
   */
  trackAddresses(addresses: (Address | string)[], optional_current_daa_score?: bigint | null): Promise<void>;
  /**
   * Unregister a list of addresses from the context. This will stop tracking of these addresses.
   */
  unregisterAddresses(addresses: (Address | string)[]): Promise<void>;
  constructor(js_value: IUtxoContextArgs);
  /**
   * Clear the UtxoContext.  Unregister all addresses and clear all UTXO entries.
   * IMPORTANT: This function must be manually called when disconnecting or re-connecting to the node
   * (followed by address re-registration).  
   */
  clear(): Promise<void>;
  /**
   * Returns pending UTXO entries that are currently managed by the UtxoContext.
   */
  getPending(): UtxoEntryReference[];
  /**
   * Obtain the length of the mature UTXO entries that are currently
   * managed by the UtxoContext.
   */
  readonly matureLength: number;
  /**
   * Current {@link BalanceStrings} of the UtxoContext.
   */
  readonly balanceStrings: BalanceStrings | undefined;
  readonly isActive: boolean;
  /**
   * Current {@link Balance} of the UtxoContext.
   */
  readonly balance: Balance | undefined;
}
/**
 * A simple collection of UTXO entries. This struct is used to
 * retain a set of UTXO entries in the WASM memory for faster
 * processing. This struct keeps a list of entries represented
 * by `UtxoEntryReference` struct. This data structure is used
 * internally by the framework, but is exposed for convenience.
 * Please consider using `UtxoContext` instead.
 * @category Wallet SDK
 */
export class UtxoEntries {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  /**
   * Sort the contained entries by amount. Please note that
   * this function is not intended for use with large UTXO sets
   * as it duplicates the whole contained UTXO set while sorting.
   */
  sort(): void;
  amount(): bigint;
  /**
   * Create a new `UtxoEntries` struct with a set of entries.
   */
  constructor(js_value: any);
  items: any;
}
/**
 * [`UtxoEntry`] struct represents a client-side UTXO entry.
 *
 * @category Wallet SDK
 */
export class UtxoEntry {
  private constructor();
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  toString(): string;
  get address(): Address | undefined;
  set address(value: Address | null | undefined);
  outpoint: TransactionOutpoint;
  amount: bigint;
  scriptPublicKey: ScriptPublicKey;
  blockDaaScore: bigint;
  isCoinbase: boolean;
  get covenantId(): Hash | undefined;
  set covenantId(value: Hash | null | undefined);
}
/**
 * [`Arc`] reference to a [`UtxoEntry`] used by the wallet subsystems.
 *
 * @category Wallet SDK
 */
export class UtxoEntryReference {
  private constructor();
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  toString(): string;
  readonly isCoinbase: boolean;
  readonly blockDaaScore: bigint;
  readonly scriptPublicKey: ScriptPublicKey;
  readonly entry: UtxoEntry;
  readonly amount: bigint;
  readonly address: Address | undefined;
  readonly outpoint: TransactionOutpoint;
}
/**
 *
 * UtxoProcessor class is the main coordinator that manages UTXO processing
 * between multiple UtxoContext instances. It acts as a bridge between the
 * Kaspa node RPC connection, address subscriptions and UtxoContext instances.
 *
 * @see {@link IUtxoProcessorArgs},
 * {@link UtxoContext},
 * {@link RpcClient},
 * {@link NetworkId},
 * {@link IConnectEvent}
 * {@link IDisconnectEvent}
 * @category Wallet SDK
 */
export class UtxoProcessor {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  setNetworkId(network_id: NetworkId | string): void;
  removeEventListener(event: UtxoProcessorEventType | UtxoProcessorEventType[] | string | string[], callback?: UtxoProcessorNotificationCallback | null): void;
  /**
   *
   * Set the user transaction maturity period DAA score for a given network.
   * This controls the DAA period after which the user transactions are considered mature
   * and the wallet subsystem emits the transaction maturity event.
   *
   * @see {@link TransactionRecord}
   * @see {@link IUtxoProcessorEvent}
   *
   * @category Wallet SDK
   */
  static setUserTransactionMaturityDAA(network_id: NetworkId | string, value: bigint): void;
  /**
   *
   * Set the coinbase transaction maturity period DAA score for a given network.
   * This controls the DAA period after which the user transactions are considered mature
   * and the wallet subsystem emits the transaction maturity event.
   *
   * @see {@link TransactionRecord}
   * @see {@link IUtxoProcessorEvent}
   *
   * @category Wallet SDK
   */
  static setCoinbaseTransactionMaturityDAA(network_id: NetworkId | string, value: bigint): void;
  /**
   * UtxoProcessor constructor.
   *
   *
   *
   * @see {@link IUtxoProcessorArgs}
   */
  constructor(js_value: IUtxoProcessorArgs);
  /**
   * Stops the UtxoProcessor and ends processing UTXO and other notifications.
   */
  stop(): Promise<void>;
  /**
   * Starts the UtxoProcessor and begins processing UTXO and other notifications.
   */
  start(): Promise<void>;
  readonly networkId: string | undefined;
  readonly rpc: RpcClient;
  readonly isActive: boolean;
}
/**
 *
 * Wallet class is the main coordinator that manages integrated wallet operations.
 *
 * The Wallet class encapsulates {@link UtxoProcessor} and provides internal
 * account management using {@link UtxoContext} instances. It acts as a bridge
 * between the integrated Wallet subsystem providing a high-level interface
 * for wallet key and account management.
 *
 * The Rusty Kaspa is developed in Rust, and the Wallet class is a Rust implementation
 * exposed to the JavaScript/TypeScript environment using the WebAssembly (WASM32) interface.
 * As such, the Wallet implementation can be powered up using native Rust or built
 * as a WebAssembly module and used in the browser or Node.js environment.
 *
 * When using Rust native or NodeJS environment, all wallet data is stored on the local
 * filesystem.  When using WASM32 build in the web browser, the wallet data is stored
 * in the browser's `localStorage` and transaction records are stored in the `IndexedDB`.
 *
 * The Wallet API can create multiple wallet instances, however, only one wallet instance
 * can be active at a time.
 *
 * The wallet implementation is designed to be efficient and support a large number
 * of accounts. Accounts reside in storage and can be loaded and activated as needed.
 * A `loaded` account contains all account information loaded from the permanent storage
 * whereas an `active` account monitors the UTXO set and provides notifications for
 * incoming and outgoing transactions as well as balance updates.
 *
 * The Wallet API communicates with the client using resource identifiers. These include
 * account IDs, private key IDs, transaction IDs, etc. It is the responsibility of the
 * client to track these resource identifiers at runtime.
 *
 * @see {@link IWalletConfig},
 *
 * @category Wallet API
 */
export class Wallet {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  disconnect(): Promise<void>;
  constructor(config: IWalletConfig);
  setNetworkId(network_id: NetworkId | string): void;
  removeEventListener(event: WalletEventType | WalletEventType[] | string | string[], callback?: WalletNotificationCallback | null): void;
  stop(): Promise<void>;
  start(): Promise<void>;
  /**
   * Check if a wallet with a given name exists.
   */
  exists(name?: string | null): Promise<boolean>;
  connect(args?: IConnectOptions | undefined | null): Promise<void>;
  /**
   * @see {@link IGetStatusRequest} {@link IGetStatusResponse}
   * @throws `string` in case of an error.
   */
  getStatus(request: IGetStatusRequest): Promise<IGetStatusResponse>;
  /**
   * @see {@link IWalletOpenRequest} {@link IWalletOpenResponse}
   * @throws `string` in case of an error.
   */
  walletOpen(request: IWalletOpenRequest): Promise<IWalletOpenResponse>;
  /**
   * @see {@link IAccountsGetRequest} {@link IAccountsGetResponse}
   * @throws `string` in case of an error.
   */
  accountsGet(request: IAccountsGetRequest): Promise<IAccountsGetResponse>;
  /**
   * @see {@link IWalletCloseRequest} {@link IWalletCloseResponse}
   * @throws `string` in case of an error.
   */
  walletClose(request: IWalletCloseRequest): Promise<IWalletCloseResponse>;
  /**
   * @see {@link IAccountsSendRequest} {@link IAccountsSendResponse}
   * @throws `string` in case of an error.
   */
  accountsSend(request: IAccountsSendRequest): Promise<IAccountsSendResponse>;
  /**
   * @see {@link IWalletCreateRequest} {@link IWalletCreateResponse}
   * @throws `string` in case of an error.
   */
  walletCreate(request: IWalletCreateRequest): Promise<IWalletCreateResponse>;
  /**
   * @see {@link IWalletExportRequest} {@link IWalletExportResponse}
   * @throws `string` in case of an error.
   */
  walletExport(request: IWalletExportRequest): Promise<IWalletExportResponse>;
  /**
   * @see {@link IWalletImportRequest} {@link IWalletImportResponse}
   * @throws `string` in case of an error.
   */
  walletImport(request: IWalletImportRequest): Promise<IWalletImportResponse>;
  /**
   * @see {@link IWalletReloadRequest} {@link IWalletReloadResponse}
   * @throws `string` in case of an error.
   */
  walletReload(request: IWalletReloadRequest): Promise<IWalletReloadResponse>;
  /**
   * @see {@link IRetainContextRequest} {@link IRetainContextResponse}
   * @throws `string` in case of an error.
   */
  retainContext(request: IRetainContextRequest): Promise<IRetainContextResponse>;
  /**
   * @see {@link IAccountsCreateRequest} {@link IAccountsCreateResponse}
   * @throws `string` in case of an error.
   */
  accountsCreate(request: IAccountsCreateRequest): Promise<IAccountsCreateResponse>;
  /**
   * @see {@link IAccountsImportRequest} {@link IAccountsImportResponse}
   * @throws `string` in case of an error.
   */
  accountsImport(request: IAccountsImportRequest): Promise<IAccountsImportResponse>;
  /**
   * @see {@link IAccountsRenameRequest} {@link IAccountsRenameResponse}
   * @throws `string` in case of an error.
   */
  accountsRename(request: IAccountsRenameRequest): Promise<IAccountsRenameResponse>;
  /**
   * @see {@link IPrvKeyDataGetRequest} {@link IPrvKeyDataGetResponse}
   * @throws `string` in case of an error.
   */
  prvKeyDataGet(request: IPrvKeyDataGetRequest): Promise<IPrvKeyDataGetResponse>;
  /**
   * @see {@link IWalletEnumerateRequest} {@link IWalletEnumerateResponse}
   * @throws `string` in case of an error.
   */
  walletEnumerate(request: IWalletEnumerateRequest): Promise<IWalletEnumerateResponse>;
  /**
   * @see {@link IAccountsActivateRequest} {@link IAccountsActivateResponse}
   * @throws `string` in case of an error.
   */
  accountsActivate(request: IAccountsActivateRequest): Promise<IAccountsActivateResponse>;
  /**
   * @see {@link IAccountsEstimateRequest} {@link IAccountsEstimateResponse}
   * @throws `string` in case of an error.
   */
  accountsEstimate(request: IAccountsEstimateRequest): Promise<IAccountsEstimateResponse>;
  /**
   * @see {@link IAccountsTransferRequest} {@link IAccountsTransferResponse}
   * @throws `string` in case of an error.
   */
  accountsTransfer(request: IAccountsTransferRequest): Promise<IAccountsTransferResponse>;
  /**
   * @see {@link IFeeRateEstimateRequest} {@link IFeeRateEstimateResponse}
   * @throws `string` in case of an error.
   */
  feeRateEstimate(request: IFeeRateEstimateRequest): Promise<IFeeRateEstimateResponse>;
  /**
   * @see {@link IAccountsDiscoveryRequest} {@link IAccountsDiscoveryResponse}
   * @throws `string` in case of an error.
   */
  accountsDiscovery(request: IAccountsDiscoveryRequest): Promise<IAccountsDiscoveryResponse>;
  /**
   * @see {@link IAccountsEnumerateRequest} {@link IAccountsEnumerateResponse}
   * @throws `string` in case of an error.
   */
  accountsEnumerate(request: IAccountsEnumerateRequest): Promise<IAccountsEnumerateResponse>;
  /**
   * @see {@link IAccountsGetUtxosRequest} {@link IAccountsGetUtxosResponse}
   * @throws `string` in case of an error.
   */
  accountsGetUtxos(request: IAccountsGetUtxosRequest): Promise<IAccountsGetUtxosResponse>;
  /**
   * @see {@link IAccountsPskbSendRequest} {@link IAccountsPskbSendResponse}
   * @throws `string` in case of an error.
   */
  accountsPskbSend(request: IAccountsPskbSendRequest): Promise<IAccountsPskbSendResponse>;
  /**
   * @see {@link IAccountsPskbSignRequest} {@link IAccountsPskbSignResponse}
   * @throws `string` in case of an error.
   */
  accountsPskbSign(request: IAccountsPskbSignRequest): Promise<IAccountsPskbSignResponse>;
  /**
   * @see {@link IAccountsDeactivateRequest} {@link IAccountsDeactivateResponse}
   * @throws `string` in case of an error.
   */
  accountsDeactivate(request: IAccountsDeactivateRequest): Promise<IAccountsDeactivateResponse>;
  /**
   * @see {@link IPrvKeyDataCreateRequest} {@link IPrvKeyDataCreateResponse}
   * @throws `string` in case of an error.
   */
  prvKeyDataCreate(request: IPrvKeyDataCreateRequest): Promise<IPrvKeyDataCreateResponse>;
  /**
   * @see {@link IPrvKeyDataRemoveRequest} {@link IPrvKeyDataRemoveResponse}
   * @throws `string` in case of an error.
   */
  prvKeyDataRemove(request: IPrvKeyDataRemoveRequest): Promise<IPrvKeyDataRemoveResponse>;
  /**
   * @see {@link IWalletChangeSecretRequest} {@link IWalletChangeSecretResponse}
   * @throws `string` in case of an error.
   */
  walletChangeSecret(request: IWalletChangeSecretRequest): Promise<IWalletChangeSecretResponse>;
  /**
   * @see {@link ITransactionsDataGetRequest} {@link ITransactionsDataGetResponse}
   * @throws `string` in case of an error.
   */
  transactionsDataGet(request: ITransactionsDataGetRequest): Promise<ITransactionsDataGetResponse>;
  /**
   * @see {@link IAccountsCommitRevealRequest} {@link IAccountsCommitRevealResponse}
   * @throws `string` in case of an error.
   */
  accountsCommitReveal(request: IAccountsCommitRevealRequest): Promise<IAccountsCommitRevealResponse>;
  /**
   * @see {@link IAddressBookEnumerateRequest} {@link IAddressBookEnumerateResponse}
   * @throws `string` in case of an error.
   */
  addressBookEnumerate(request: IAddressBookEnumerateRequest): Promise<IAddressBookEnumerateResponse>;
  /**
   * @see {@link IFeeRatePollerEnableRequest} {@link IFeeRatePollerEnableResponse}
   * @throws `string` in case of an error.
   */
  feeRatePollerEnable(request: IFeeRatePollerEnableRequest): Promise<IFeeRatePollerEnableResponse>;
  /**
   * @see {@link IPrvKeyDataEnumerateRequest} {@link IPrvKeyDataEnumerateResponse}
   * @throws `string` in case of an error.
   */
  prvKeyDataEnumerate(request: IPrvKeyDataEnumerateRequest): Promise<IPrvKeyDataEnumerateResponse>;
  /**
   * @see {@link IAccountsEnsureDefaultRequest} {@link IAccountsEnsureDefaultResponse}
   * @throws `string` in case of an error.
   */
  accountsEnsureDefault(request: IAccountsEnsureDefaultRequest): Promise<IAccountsEnsureDefaultResponse>;
  /**
   * @see {@link IAccountsPskbBroadcastRequest} {@link IAccountsPskbBroadcastResponse}
   * @throws `string` in case of an error.
   */
  accountsPskbBroadcast(request: IAccountsPskbBroadcastRequest): Promise<IAccountsPskbBroadcastResponse>;
  /**
   * @see {@link IFeeRatePollerDisableRequest} {@link IFeeRatePollerDisableResponse}
   * @throws `string` in case of an error.
   */
  feeRatePollerDisable(request: IFeeRatePollerDisableRequest): Promise<IFeeRatePollerDisableResponse>;
  /**
   * @see {@link ITransactionsReplaceNoteRequest} {@link ITransactionsReplaceNoteResponse}
   * @throws `string` in case of an error.
   */
  transactionsReplaceNote(request: ITransactionsReplaceNoteRequest): Promise<ITransactionsReplaceNoteResponse>;
  /**
   * @see {@link IAccountsCreateNewAddressRequest} {@link IAccountsCreateNewAddressResponse}
   * @throws `string` in case of an error.
   */
  accountsCreateNewAddress(request: IAccountsCreateNewAddressRequest): Promise<IAccountsCreateNewAddressResponse>;
  /**
   * @see {@link IAccountsCommitRevealManualRequest} {@link IAccountsCommitRevealManualResponse}
   * @throws `string` in case of an error.
   */
  accountsCommitRevealManual(request: IAccountsCommitRevealManualRequest): Promise<IAccountsCommitRevealManualResponse>;
  /**
   * @see {@link ITransactionsReplaceMetadataRequest} {@link ITransactionsReplaceMetadataResponse}
   * @throws `string` in case of an error.
   */
  transactionsReplaceMetadata(request: ITransactionsReplaceMetadataRequest): Promise<ITransactionsReplaceMetadataResponse>;
  /**
   * Ping backend
   * @see {@link IBatchRequest} {@link IBatchResponse}
   * @throws `string` in case of an error.
   */
  batch(request: IBatchRequest): Promise<IBatchResponse>;
  /**
   * @see {@link IFlushRequest} {@link IFlushResponse}
   * @throws `string` in case of an error.
   */
  flush(request: IFlushRequest): Promise<IFlushResponse>;
  readonly descriptor: WalletDescriptor | undefined;
  readonly rpc: RpcClient;
  /**
   * @remarks This is a local property indicating
   * if the wallet is currently open.
   */
  readonly isOpen: boolean;
  /**
   * @remarks This is a local property indicating
   * if the node is currently synced.
   */
  readonly isSynced: boolean;
}
/**
 * @category Wallet API
 */
export class WalletDescriptor {
  private constructor();
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  get title(): string | undefined;
  set title(value: string | null | undefined);
  filename: string;
}
export class WasiOptions {
  free(): void;
  constructor(args: any[] | null | undefined, env: object | null | undefined, preopens: object);
  static new(preopens: object): WasiOptions;
  preopens: object;
  get env(): object | undefined;
  set env(value: object | null | undefined);
  get args(): any[] | undefined;
  set args(value: any[] | null | undefined);
}
export class WriteFileSyncOptions {
  free(): void;
  constructor(encoding?: string | null, flag?: string | null, mode?: number | null);
  get encoding(): string | undefined;
  set encoding(value: string | null | undefined);
  get flag(): string | undefined;
  set flag(value: string | null | undefined);
  get mode(): number | undefined;
  set mode(value: number | null | undefined);
}
/**
 *
 * Data structure that envelopes a XOnlyPublicKey.
 *
 * XOnlyPublicKey is used as a payload part of the {@link Address}.
 *
 * @see {@link PublicKey}
 * @category Wallet SDK
 */
export class XOnlyPublicKey {
  free(): void;
  /**
   * Get the [`Address`] of this XOnlyPublicKey.
   * Receives a [`NetworkType`] to determine the prefix of the address.
   * JavaScript: `let address = xOnlyPublicKey.toAddress(NetworkType.MAINNET);`.
   */
  toAddress(network: NetworkType | NetworkId | string): Address;
  static fromAddress(address: Address): XOnlyPublicKey;
  toString(): string;
  /**
   * Get `ECDSA` [`Address`] of this XOnlyPublicKey.
   * Receives a [`NetworkType`] to determine the prefix of the address.
   * JavaScript: `let address = xOnlyPublicKey.toAddress(NetworkType.MAINNET);`.
   */
  toAddressECDSA(network: NetworkType | NetworkId | string): Address;
  constructor(key: string);
}
/**
 *
 * Extended private key (XPrv).
 *
 * This class allows accepts a master seed and provides
 * functions for derivation of dependent child private keys.
 *
 * Please note that Kaspa extended private keys use `kprv` prefix.
 *
 * @see {@link PrivateKeyGenerator}, {@link PublicKeyGenerator}, {@link XPub}, {@link Mnemonic}
 * @category Wallet SDK
 */
export class XPrv {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  derivePath(path: any): XPrv;
  intoString(prefix: string): string;
  deriveChild(child_number: number, hardened?: boolean | null): XPrv;
  /**
   * Create {@link XPrv} from `xprvxxxx..` string
   */
  static fromXPrv(xprv: string): XPrv;
  toPrivateKey(): PrivateKey;
  toXPub(): XPub;
  constructor(seed: HexString);
  toString(): string;
  readonly childNumber: number;
  readonly chainCode: string;
  readonly privateKey: string;
  readonly parentFingerprint: string;
  readonly xprv: string;
  readonly depth: number;
}
/**
 *
 * Extended public key (XPub).
 *
 * This class allows accepts another XPub and and provides
 * functions for derivation of dependent child public keys.
 *
 * Please note that Kaspa extended public keys use `kpub` prefix.
 *
 * @see {@link PrivateKeyGenerator}, {@link PublicKeyGenerator}, {@link XPrv}, {@link Mnemonic}
 * @category Wallet SDK
 */
export class XPub {
/**
** Return copy of self without private attributes.
*/
  toJSON(): Object;
/**
* Return stringified version of self.
*/
  toString(): string;
  free(): void;
  toPublicKey(): PublicKey;
  derivePath(path: any): XPub;
  deriveChild(child_number: number, hardened?: boolean | null): XPub;
  intoString(prefix: string): string;
  constructor(xpub: string);
  readonly childNumber: number;
  readonly chainCode: string;
  readonly parentFingerprint: string;
  readonly xpub: string;
  readonly depth: number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_address_free: (a: number, b: number) => void;
  readonly address_constructor: (a: number, b: number) => number;
  readonly address_payload: (a: number, b: number) => void;
  readonly address_prefix: (a: number, b: number) => void;
  readonly address_set_setPrefix: (a: number, b: number, c: number) => void;
  readonly address_toString: (a: number, b: number) => void;
  readonly address_validate: (a: number, b: number) => number;
  readonly address_version: (a: number, b: number) => void;
  readonly __wbg_mnemonic_free: (a: number, b: number) => void;
  readonly mnemonic_constructor: (a: number, b: number, c: number, d: number) => void;
  readonly mnemonic_entropy: (a: number, b: number) => void;
  readonly mnemonic_phrase: (a: number, b: number) => void;
  readonly mnemonic_random: (a: number, b: number) => void;
  readonly mnemonic_set_entropy: (a: number, b: number, c: number) => void;
  readonly mnemonic_set_phrase: (a: number, b: number, c: number) => void;
  readonly mnemonic_toSeed: (a: number, b: number, c: number, d: number) => void;
  readonly mnemonic_validate: (a: number, b: number, c: number) => number;
  readonly __wbg_compressedparents_free: (a: number, b: number) => void;
  readonly __wbg_transaction_free: (a: number, b: number) => void;
  readonly compressedparents_expandedLen: (a: number) => number;
  readonly compressedparents_get: (a: number, b: number, c: number) => void;
  readonly compressedparents_new: (a: number, b: number) => void;
  readonly compressedparents_toExpanded: (a: number, b: number) => void;
  readonly transaction_addresses: (a: number, b: number, c: number) => void;
  readonly transaction_constructor: (a: number, b: number) => void;
  readonly transaction_deserializeFromJSON: (a: number, b: number, c: number) => void;
  readonly transaction_deserializeFromObject: (a: number, b: number) => void;
  readonly transaction_deserializeFromSafeJSON: (a: number, b: number, c: number) => void;
  readonly transaction_finalize: (a: number, b: number) => void;
  readonly transaction_gas: (a: number) => bigint;
  readonly transaction_get_inputs_as_js_array: (a: number) => number;
  readonly transaction_get_mass: (a: number) => bigint;
  readonly transaction_get_outputs_as_js_array: (a: number) => number;
  readonly transaction_get_payload_as_hex_string: (a: number, b: number) => void;
  readonly transaction_get_subnetwork_id_as_hex: (a: number, b: number) => void;
  readonly transaction_id: (a: number, b: number) => void;
  readonly transaction_is_coinbase: (a: number) => number;
  readonly transaction_lockTime: (a: number) => bigint;
  readonly transaction_populateGenesisCovenants: (a: number, b: number, c: number) => void;
  readonly transaction_serializeToJSON: (a: number, b: number) => void;
  readonly transaction_serializeToObject: (a: number, b: number) => void;
  readonly transaction_serializeToSafeJSON: (a: number, b: number) => void;
  readonly transaction_set_gas: (a: number, b: bigint) => void;
  readonly transaction_set_inputs_from_js_array: (a: number, b: number) => void;
  readonly transaction_set_lockTime: (a: number, b: bigint) => void;
  readonly transaction_set_mass: (a: number, b: bigint) => void;
  readonly transaction_set_outputs_from_js_array: (a: number, b: number) => void;
  readonly transaction_set_payload_from_js_value: (a: number, b: number) => void;
  readonly transaction_set_subnetwork_id_from_js_value: (a: number, b: number) => void;
  readonly transaction_set_version: (a: number, b: number) => void;
  readonly transaction_version: (a: number) => number;
  readonly transaction_get_storage_mass: (a: number) => bigint;
  readonly transaction_set_storage_mass: (a: number, b: bigint) => void;
  readonly __wbg_transactionoutput_free: (a: number, b: number) => void;
  readonly transactionoutput_covenant: (a: number) => number;
  readonly transactionoutput_ctor: (a: bigint, b: number, c: number) => number;
  readonly transactionoutput_scriptPublicKey: (a: number) => number;
  readonly transactionoutput_set_covenant: (a: number, b: number) => void;
  readonly transactionoutput_set_scriptPublicKey: (a: number, b: number) => void;
  readonly transactionoutput_set_value: (a: number, b: bigint) => void;
  readonly transactionoutput_value: (a: number) => bigint;
  readonly addressFromScriptPublicKey: (a: number, b: number, c: number) => void;
  readonly isScriptPayToPubkey: (a: number, b: number) => void;
  readonly isScriptPayToPubkeyECDSA: (a: number, b: number) => void;
  readonly isScriptPayToScriptHash: (a: number, b: number) => void;
  readonly payToAddressScript: (a: number, b: number) => void;
  readonly payToScriptHashScript: (a: number, b: number) => void;
  readonly payToScriptHashSignatureScript: (a: number, b: number, c: number) => void;
  readonly __wbg_get_utxoentry_address: (a: number) => number;
  readonly __wbg_get_utxoentry_amount: (a: number) => bigint;
  readonly __wbg_get_utxoentry_blockDaaScore: (a: number) => bigint;
  readonly __wbg_get_utxoentry_covenantId: (a: number) => number;
  readonly __wbg_get_utxoentry_isCoinbase: (a: number) => number;
  readonly __wbg_get_utxoentry_outpoint: (a: number) => number;
  readonly __wbg_get_utxoentry_scriptPublicKey: (a: number) => number;
  readonly __wbg_set_utxoentry_address: (a: number, b: number) => void;
  readonly __wbg_set_utxoentry_amount: (a: number, b: bigint) => void;
  readonly __wbg_set_utxoentry_blockDaaScore: (a: number, b: bigint) => void;
  readonly __wbg_set_utxoentry_covenantId: (a: number, b: number) => void;
  readonly __wbg_set_utxoentry_isCoinbase: (a: number, b: number) => void;
  readonly __wbg_set_utxoentry_outpoint: (a: number, b: number) => void;
  readonly __wbg_set_utxoentry_scriptPublicKey: (a: number, b: number) => void;
  readonly __wbg_utxoentries_free: (a: number, b: number) => void;
  readonly __wbg_utxoentry_free: (a: number, b: number) => void;
  readonly __wbg_utxoentryreference_free: (a: number, b: number) => void;
  readonly utxoentries_amount: (a: number) => bigint;
  readonly utxoentries_get_items_as_js_array: (a: number) => number;
  readonly utxoentries_js_ctor: (a: number, b: number) => void;
  readonly utxoentries_set_items_from_js_array: (a: number, b: number) => void;
  readonly utxoentries_sort: (a: number) => void;
  readonly utxoentry_toString: (a: number, b: number) => void;
  readonly utxoentryreference_address: (a: number) => number;
  readonly utxoentryreference_amount: (a: number) => bigint;
  readonly utxoentryreference_blockDaaScore: (a: number) => bigint;
  readonly utxoentryreference_entry: (a: number) => number;
  readonly utxoentryreference_isCoinbase: (a: number) => number;
  readonly utxoentryreference_outpoint: (a: number) => number;
  readonly utxoentryreference_scriptPublicKey: (a: number) => number;
  readonly utxoentryreference_toString: (a: number, b: number) => void;
  readonly __wbg_transactioninput_free: (a: number, b: number) => void;
  readonly transactioninput_constructor: (a: number, b: number) => void;
  readonly transactioninput_get_compute_budget: (a: number) => number;
  readonly transactioninput_get_previous_outpoint: (a: number) => number;
  readonly transactioninput_get_sequence: (a: number) => bigint;
  readonly transactioninput_get_sig_op_count: (a: number) => number;
  readonly transactioninput_get_signature_script_as_hex: (a: number, b: number) => void;
  readonly transactioninput_get_utxo: (a: number) => number;
  readonly transactioninput_set_compute_budget: (a: number, b: number) => void;
  readonly transactioninput_set_previous_outpoint: (a: number, b: number, c: number) => void;
  readonly transactioninput_set_sequence: (a: number, b: bigint) => void;
  readonly transactioninput_set_sig_op_count: (a: number, b: number) => void;
  readonly transactioninput_set_signature_script_from_js_value: (a: number, b: number, c: number) => void;
  readonly __wbg_covenantbinding_free: (a: number, b: number) => void;
  readonly __wbg_genesiscovenantgroup_free: (a: number, b: number) => void;
  readonly __wbg_header_free: (a: number, b: number) => void;
  readonly covenantbinding_authorizingInput: (a: number) => number;
  readonly covenantbinding_covenantId: (a: number) => number;
  readonly covenantbinding_new: (a: number, b: number) => number;
  readonly covenantbinding_set_authorizingInput: (a: number, b: number) => void;
  readonly covenantbinding_set_covenantId: (a: number, b: number) => void;
  readonly covenantbinding_toJSON: (a: number, b: number) => void;
  readonly genesiscovenantgroup_authorizingInput: (a: number) => number;
  readonly genesiscovenantgroup_ctor: (a: number, b: number, c: number) => void;
  readonly genesiscovenantgroup_outputs: (a: number) => number;
  readonly genesiscovenantgroup_set_authorizingInput: (a: number, b: number) => void;
  readonly genesiscovenantgroup_set_outputs: (a: number, b: number, c: number) => void;
  readonly genesiscovenantgroup_toJSON: (a: number, b: number) => void;
  readonly genesiscovenantgroup_toString: (a: number, b: number) => void;
  readonly header_asJSON: (a: number, b: number) => void;
  readonly header_bits: (a: number) => number;
  readonly header_blue_score: (a: number) => bigint;
  readonly header_blue_work: (a: number) => number;
  readonly header_constructor: (a: number, b: number) => void;
  readonly header_daa_score: (a: number) => bigint;
  readonly header_finalize: (a: number, b: number) => void;
  readonly header_getBlueWorkAsHex: (a: number, b: number) => void;
  readonly header_get_accepted_id_merkle_root_as_hex: (a: number, b: number) => void;
  readonly header_get_hash_as_hex: (a: number, b: number) => void;
  readonly header_get_hash_merkle_root_as_hex: (a: number, b: number) => void;
  readonly header_get_parents_by_level_as_js_value: (a: number) => number;
  readonly header_get_pruning_point_as_hex: (a: number, b: number) => void;
  readonly header_get_timestamp: (a: number) => bigint;
  readonly header_get_utxo_commitment_as_hex: (a: number, b: number) => void;
  readonly header_get_version: (a: number) => number;
  readonly header_nonce: (a: number) => bigint;
  readonly header_set_accepted_id_merkle_root_from_js_value: (a: number, b: number) => void;
  readonly header_set_bits: (a: number, b: number) => void;
  readonly header_set_blue_score: (a: number, b: bigint) => void;
  readonly header_set_blue_work_from_js_value: (a: number, b: number) => void;
  readonly header_set_daa_score: (a: number, b: bigint) => void;
  readonly header_set_hash_merkle_root_from_js_value: (a: number, b: number) => void;
  readonly header_set_nonce: (a: number, b: bigint) => void;
  readonly header_set_parents_by_level_from_js_value: (a: number, b: number) => void;
  readonly header_set_pruning_point_from_js_value: (a: number, b: number) => void;
  readonly header_set_timestamp: (a: number, b: bigint) => void;
  readonly header_set_utxo_commitment_from_js_value: (a: number, b: number) => void;
  readonly header_set_version: (a: number, b: number) => void;
  readonly __wbg_optionalheader_free: (a: number, b: number) => void;
  readonly __wbg_transactionoutpoint_free: (a: number, b: number) => void;
  readonly __wbg_transactionsigninghash_free: (a: number, b: number) => void;
  readonly __wbg_transactionsigninghashecdsa_free: (a: number, b: number) => void;
  readonly covenantId: (a: number, b: number, c: number) => void;
  readonly optionalheader_acceptedIdMerkleRoot: (a: number, b: number) => void;
  readonly optionalheader_bits: (a: number) => number;
  readonly optionalheader_blueScore: (a: number, b: number) => void;
  readonly optionalheader_blueWork: (a: number) => number;
  readonly optionalheader_daaScore: (a: number, b: number) => void;
  readonly optionalheader_hash: (a: number, b: number) => void;
  readonly optionalheader_hashMerkleRoot: (a: number, b: number) => void;
  readonly optionalheader_new: (a: number, b: number) => void;
  readonly optionalheader_nonce: (a: number, b: number) => void;
  readonly optionalheader_parentsByLevel: (a: number) => number;
  readonly optionalheader_pruningPoint: (a: number, b: number) => void;
  readonly optionalheader_timestamp: (a: number, b: number) => void;
  readonly optionalheader_utxoCommitment: (a: number, b: number) => void;
  readonly optionalheader_version: (a: number) => number;
  readonly transactionoutpoint_ctor: (a: number, b: number) => number;
  readonly transactionoutpoint_getId: (a: number, b: number) => void;
  readonly transactionoutpoint_index: (a: number) => number;
  readonly transactionoutpoint_transactionId: (a: number, b: number) => void;
  readonly transactionsigninghash_finalize: (a: number, b: number) => void;
  readonly transactionsigninghash_new: () => number;
  readonly transactionsigninghash_update: (a: number, b: number, c: number) => void;
  readonly transactionsigninghashecdsa_finalize: (a: number, b: number) => void;
  readonly transactionsigninghashecdsa_new: () => number;
  readonly transactionsigninghashecdsa_update: (a: number, b: number, c: number) => void;
  readonly __wbg_get_networkid_suffix: (a: number) => number;
  readonly __wbg_get_networkid_type: (a: number) => number;
  readonly __wbg_networkid_free: (a: number, b: number) => void;
  readonly __wbg_set_networkid_suffix: (a: number, b: number) => void;
  readonly __wbg_set_networkid_type: (a: number, b: number) => void;
  readonly networkid_addressPrefix: (a: number, b: number) => void;
  readonly networkid_ctor: (a: number, b: number) => void;
  readonly networkid_id: (a: number, b: number) => void;
  readonly networkid_toString: (a: number, b: number) => void;
  readonly __wbg_sighashtype_free: (a: number, b: number) => void;
  readonly __wbg_get_scriptpublickey_version: (a: number) => number;
  readonly __wbg_get_transactionutxoentry_amount: (a: number) => bigint;
  readonly __wbg_get_transactionutxoentry_blockDaaScore: (a: number) => bigint;
  readonly __wbg_get_transactionutxoentry_covenantId: (a: number) => number;
  readonly __wbg_get_transactionutxoentry_isCoinbase: (a: number) => number;
  readonly __wbg_get_transactionutxoentry_scriptPublicKey: (a: number) => number;
  readonly __wbg_scriptpublickey_free: (a: number, b: number) => void;
  readonly __wbg_set_scriptpublickey_version: (a: number, b: number) => void;
  readonly __wbg_set_transactionutxoentry_amount: (a: number, b: bigint) => void;
  readonly __wbg_set_transactionutxoentry_blockDaaScore: (a: number, b: bigint) => void;
  readonly __wbg_set_transactionutxoentry_covenantId: (a: number, b: number) => void;
  readonly __wbg_set_transactionutxoentry_isCoinbase: (a: number, b: number) => void;
  readonly __wbg_set_transactionutxoentry_scriptPublicKey: (a: number, b: number) => void;
  readonly __wbg_transactionutxoentry_free: (a: number, b: number) => void;
  readonly scriptpublickey_constructor: (a: number, b: number, c: number) => void;
  readonly scriptpublickey_script_as_hex: (a: number, b: number) => void;
  readonly __wbg_hash_free: (a: number, b: number) => void;
  readonly hash_constructor: (a: number, b: number) => number;
  readonly hash_toString: (a: number, b: number) => void;
  readonly __wbg_pow_free: (a: number, b: number) => void;
  readonly calculateTarget: (a: number, b: number) => void;
  readonly pow_checkWork: (a: number, b: number, c: bigint) => void;
  readonly pow_fromRaw: (a: number, b: number, c: number, d: bigint, e: number) => void;
  readonly pow_get_pre_pow_hash: (a: number, b: number) => void;
  readonly pow_new: (a: number, b: number, c: number, d: bigint) => void;
  readonly pow_target: (a: number, b: number) => void;
  readonly __wbg_scriptbuilder_free: (a: number, b: number) => void;
  readonly scriptbuilder_addData: (a: number, b: number, c: number) => void;
  readonly scriptbuilder_addI64: (a: number, b: number, c: bigint) => void;
  readonly scriptbuilder_addLockTime: (a: number, b: number, c: bigint) => void;
  readonly scriptbuilder_addOp: (a: number, b: number, c: number) => void;
  readonly scriptbuilder_addOps: (a: number, b: number, c: number) => void;
  readonly scriptbuilder_canonicalDataSize: (a: number, b: number) => void;
  readonly scriptbuilder_createPayToScriptHashScript: (a: number) => number;
  readonly scriptbuilder_drain: (a: number) => number;
  readonly scriptbuilder_encodePayToScriptHashSignatureScript: (a: number, b: number, c: number) => void;
  readonly scriptbuilder_fromScript: (a: number, b: number, c: number) => void;
  readonly scriptbuilder_hexView: (a: number, b: number, c: number) => void;
  readonly scriptbuilder_new: (a: number, b: number) => void;
  readonly scriptbuilder_toString: (a: number) => number;
  readonly scriptbuilder_addSequence: (a: number, b: number, c: bigint) => void;
  readonly signMessage: (a: number, b: number) => void;
  readonly verifyMessage: (a: number, b: number) => void;
  readonly __wbg_accountkind_free: (a: number, b: number) => void;
  readonly __wbg_balance_free: (a: number, b: number) => void;
  readonly __wbg_balancestrings_free: (a: number, b: number) => void;
  readonly accountkind_ctor: (a: number, b: number, c: number) => void;
  readonly accountkind_toString: (a: number, b: number) => void;
  readonly balance_mature: (a: number) => number;
  readonly balance_outgoing: (a: number) => number;
  readonly balance_pending: (a: number) => number;
  readonly balance_toBalanceStrings: (a: number, b: number, c: number) => void;
  readonly balancestrings_mature: (a: number, b: number) => void;
  readonly balancestrings_pending: (a: number, b: number) => void;
  readonly __wbg_get_paymentoutput_address: (a: number) => number;
  readonly __wbg_get_paymentoutput_amount: (a: number) => bigint;
  readonly __wbg_get_paymentoutput_covenant: (a: number) => number;
  readonly __wbg_paymentoutput_free: (a: number, b: number) => void;
  readonly __wbg_paymentoutputs_free: (a: number, b: number) => void;
  readonly __wbg_set_paymentoutput_address: (a: number, b: number) => void;
  readonly __wbg_set_paymentoutput_amount: (a: number, b: bigint) => void;
  readonly __wbg_set_paymentoutput_covenant: (a: number, b: number) => void;
  readonly calculateStorageMass: (a: number, b: number, c: number, d: number) => void;
  readonly calculateTransactionFee: (a: number, b: number, c: number, d: number) => void;
  readonly calculateTransactionMass: (a: number, b: number, c: number, d: number) => void;
  readonly maximumStandardTransactionMass: () => bigint;
  readonly paymentoutput_new: (a: number, b: bigint) => number;
  readonly paymentoutput_withCovenant: (a: number, b: bigint, c: number) => number;
  readonly paymentoutputs_constructor: (a: number, b: number) => void;
  readonly updateTransactionMass: (a: number, b: number, c: number, d: number) => void;
  readonly __wbg_generatorsummary_free: (a: number, b: number) => void;
  readonly __wbg_pendingtransaction_free: (a: number, b: number) => void;
  readonly __wbg_storage_free: (a: number, b: number) => void;
  readonly __wbg_utxoprocessor_free: (a: number, b: number) => void;
  readonly createInputSignature: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly generatorsummary_fees: (a: number) => number;
  readonly generatorsummary_finalAmount: (a: number) => number;
  readonly generatorsummary_finalTransactionId: (a: number, b: number) => void;
  readonly generatorsummary_mass: (a: number) => number;
  readonly generatorsummary_networkType: (a: number) => number;
  readonly generatorsummary_transactions: (a: number) => number;
  readonly generatorsummary_utxos: (a: number) => number;
  readonly getNetworkParams: (a: number, b: number) => void;
  readonly getTransactionMaturityProgress: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly kaspaToSompi: (a: number, b: number) => number;
  readonly pendingtransaction_addresses: (a: number) => number;
  readonly pendingtransaction_aggregateInputAmount: (a: number) => number;
  readonly pendingtransaction_aggregateOutputAmount: (a: number) => number;
  readonly pendingtransaction_changeAmount: (a: number) => number;
  readonly pendingtransaction_createInputSignature: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly pendingtransaction_feeAmount: (a: number) => number;
  readonly pendingtransaction_fillInput: (a: number, b: number, c: number, d: number) => void;
  readonly pendingtransaction_getUtxoEntries: (a: number) => number;
  readonly pendingtransaction_id: (a: number, b: number) => void;
  readonly pendingtransaction_mass: (a: number) => number;
  readonly pendingtransaction_minimumSignatures: (a: number) => number;
  readonly pendingtransaction_paymentAmount: (a: number) => number;
  readonly pendingtransaction_serializeToJSON: (a: number, b: number) => void;
  readonly pendingtransaction_serializeToObject: (a: number, b: number) => void;
  readonly pendingtransaction_serializeToSafeJSON: (a: number, b: number) => void;
  readonly pendingtransaction_sign: (a: number, b: number, c: number, d: number) => void;
  readonly pendingtransaction_signInput: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly pendingtransaction_submit: (a: number, b: number) => number;
  readonly pendingtransaction_transaction: (a: number, b: number) => void;
  readonly pendingtransaction_type: (a: number, b: number) => void;
  readonly setDefaultStorageFolder: (a: number, b: number, c: number) => void;
  readonly setDefaultWalletFile: (a: number, b: number, c: number) => void;
  readonly signScriptHash: (a: number, b: number, c: number) => void;
  readonly signTransaction: (a: number, b: number, c: number, d: number) => void;
  readonly sompiToKaspaString: (a: number, b: number) => void;
  readonly sompiToKaspaStringWithSuffix: (a: number, b: number, c: number) => void;
  readonly storage_filename: (a: number, b: number) => void;
  readonly utxoprocessor_addEventListener: (a: number, b: number, c: number, d: number) => void;
  readonly utxoprocessor_ctor: (a: number, b: number) => void;
  readonly utxoprocessor_isActive: (a: number) => number;
  readonly utxoprocessor_networkId: (a: number, b: number) => void;
  readonly utxoprocessor_removeEventListener: (a: number, b: number, c: number, d: number) => void;
  readonly utxoprocessor_rpc: (a: number) => number;
  readonly utxoprocessor_setCoinbaseTransactionMaturityDAA: (a: number, b: number, c: bigint) => void;
  readonly utxoprocessor_setNetworkId: (a: number, b: number, c: number) => void;
  readonly utxoprocessor_setUserTransactionMaturityDAA: (a: number, b: number, c: bigint) => void;
  readonly utxoprocessor_start: (a: number) => number;
  readonly utxoprocessor_stop: (a: number) => number;
  readonly __wbg_cryptobox_free: (a: number, b: number) => void;
  readonly __wbg_cryptoboxprivatekey_free: (a: number, b: number) => void;
  readonly __wbg_cryptoboxpublickey_free: (a: number, b: number) => void;
  readonly createAddress: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly createMultisigAddress: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly cryptobox_ctor: (a: number, b: number, c: number) => void;
  readonly cryptobox_decrypt: (a: number, b: number, c: number, d: number) => void;
  readonly cryptobox_encrypt: (a: number, b: number, c: number, d: number) => void;
  readonly cryptobox_publicKey: (a: number, b: number) => void;
  readonly cryptoboxprivatekey_ctor: (a: number, b: number) => void;
  readonly cryptoboxprivatekey_to_public_key: (a: number) => number;
  readonly cryptoboxpublickey_ctor: (a: number, b: number) => void;
  readonly cryptoboxpublickey_toString: (a: number, b: number) => void;
  readonly __wbg_generator_free: (a: number, b: number) => void;
  readonly __wbg_utxocontext_free: (a: number, b: number) => void;
  readonly generator_ctor: (a: number, b: number) => void;
  readonly generator_estimate: (a: number) => number;
  readonly generator_next: (a: number) => number;
  readonly generator_summary: (a: number) => number;
  readonly utxocontext_balance: (a: number) => number;
  readonly utxocontext_balanceStrings: (a: number, b: number) => void;
  readonly utxocontext_clear: (a: number) => number;
  readonly utxocontext_ctor: (a: number, b: number) => void;
  readonly utxocontext_getMatureRange: (a: number, b: number, c: number, d: number) => void;
  readonly utxocontext_getPending: (a: number, b: number) => void;
  readonly utxocontext_isActive: (a: number) => number;
  readonly utxocontext_matureLength: (a: number) => number;
  readonly utxocontext_trackAddresses: (a: number, b: number, c: number) => number;
  readonly utxocontext_unregisterAddresses: (a: number, b: number) => number;
  readonly argon2sha256ivFromBinary: (a: number, b: number, c: number) => void;
  readonly argon2sha256ivFromText: (a: number, b: number, c: number, d: number) => void;
  readonly decryptXChaCha20Poly1305: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly encryptXChaCha20Poly1305: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly sha256FromBinary: (a: number, b: number) => void;
  readonly sha256FromText: (a: number, b: number, c: number) => void;
  readonly sha256dFromBinary: (a: number, b: number) => void;
  readonly sha256dFromText: (a: number, b: number, c: number) => void;
  readonly __wbg_get_transactionrecord_id: (a: number) => number;
  readonly __wbg_get_transactionrecord_metadata: (a: number, b: number) => void;
  readonly __wbg_get_transactionrecord_network: (a: number) => number;
  readonly __wbg_get_transactionrecord_note: (a: number, b: number) => void;
  readonly __wbg_get_transactionrecord_unixtimeMsec: (a: number, b: number) => void;
  readonly __wbg_get_transactionrecordnotification_data: (a: number) => number;
  readonly __wbg_get_transactionrecordnotification_type: (a: number, b: number) => void;
  readonly __wbg_get_walletdescriptor_filename: (a: number, b: number) => void;
  readonly __wbg_get_walletdescriptor_title: (a: number, b: number) => void;
  readonly __wbg_set_transactionrecord_id: (a: number, b: number) => void;
  readonly __wbg_set_transactionrecord_metadata: (a: number, b: number, c: number) => void;
  readonly __wbg_set_transactionrecord_network: (a: number, b: number) => void;
  readonly __wbg_set_transactionrecord_note: (a: number, b: number, c: number) => void;
  readonly __wbg_set_transactionrecord_unixtimeMsec: (a: number, b: number, c: bigint) => void;
  readonly __wbg_set_transactionrecordnotification_data: (a: number, b: number) => void;
  readonly __wbg_set_transactionrecordnotification_type: (a: number, b: number, c: number) => void;
  readonly __wbg_set_walletdescriptor_filename: (a: number, b: number, c: number) => void;
  readonly __wbg_set_walletdescriptor_title: (a: number, b: number, c: number) => void;
  readonly __wbg_transactionrecord_free: (a: number, b: number) => void;
  readonly __wbg_transactionrecordnotification_free: (a: number, b: number) => void;
  readonly __wbg_walletdescriptor_free: (a: number, b: number) => void;
  readonly transactionrecord_binding: (a: number) => number;
  readonly transactionrecord_blockDaaScore: (a: number) => number;
  readonly transactionrecord_data: (a: number) => number;
  readonly transactionrecord_hasAddress: (a: number, b: number) => number;
  readonly transactionrecord_maturityProgress: (a: number, b: number, c: number) => void;
  readonly transactionrecord_serialize: (a: number) => number;
  readonly transactionrecord_type: (a: number, b: number) => void;
  readonly transactionrecord_value: (a: number) => number;
  readonly __wbg_prvkeydatainfo_free: (a: number, b: number) => void;
  readonly __wbg_wallet_free: (a: number, b: number) => void;
  readonly prvkeydatainfo_id: (a: number, b: number) => void;
  readonly prvkeydatainfo_isEncrypted: (a: number) => number;
  readonly prvkeydatainfo_name: (a: number) => number;
  readonly prvkeydatainfo_setName: (a: number, b: number, c: number, d: number) => void;
  readonly wallet_addEventListener: (a: number, b: number, c: number, d: number) => void;
  readonly wallet_connect: (a: number, b: number) => number;
  readonly wallet_constructor: (a: number, b: number) => void;
  readonly wallet_descriptor: (a: number) => number;
  readonly wallet_disconnect: (a: number) => number;
  readonly wallet_exists: (a: number, b: number, c: number) => number;
  readonly wallet_isOpen: (a: number) => number;
  readonly wallet_isSynced: (a: number) => number;
  readonly wallet_removeEventListener: (a: number, b: number, c: number, d: number) => void;
  readonly wallet_rpc: (a: number) => number;
  readonly wallet_setNetworkId: (a: number, b: number, c: number) => void;
  readonly wallet_start: (a: number) => number;
  readonly wallet_stop: (a: number) => number;
  readonly createTransaction: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly createTransactions: (a: number) => number;
  readonly estimateTransactions: (a: number) => number;
  readonly wallet_accountsActivate: (a: number, b: number) => number;
  readonly wallet_accountsCommitReveal: (a: number, b: number) => number;
  readonly wallet_accountsCommitRevealManual: (a: number, b: number) => number;
  readonly wallet_accountsCreate: (a: number, b: number) => number;
  readonly wallet_accountsCreateNewAddress: (a: number, b: number) => number;
  readonly wallet_accountsDeactivate: (a: number, b: number) => number;
  readonly wallet_accountsDiscovery: (a: number, b: number) => number;
  readonly wallet_accountsEnsureDefault: (a: number, b: number) => number;
  readonly wallet_accountsEnumerate: (a: number, b: number) => number;
  readonly wallet_accountsEstimate: (a: number, b: number) => number;
  readonly wallet_accountsGet: (a: number, b: number) => number;
  readonly wallet_accountsGetUtxos: (a: number, b: number) => number;
  readonly wallet_accountsImport: (a: number, b: number) => number;
  readonly wallet_accountsPskbBroadcast: (a: number, b: number) => number;
  readonly wallet_accountsPskbSend: (a: number, b: number) => number;
  readonly wallet_accountsPskbSign: (a: number, b: number) => number;
  readonly wallet_accountsRename: (a: number, b: number) => number;
  readonly wallet_accountsSend: (a: number, b: number) => number;
  readonly wallet_accountsTransfer: (a: number, b: number) => number;
  readonly wallet_addressBookEnumerate: (a: number, b: number) => number;
  readonly wallet_batch: (a: number, b: number) => number;
  readonly wallet_feeRateEstimate: (a: number, b: number) => number;
  readonly wallet_feeRatePollerDisable: (a: number, b: number) => number;
  readonly wallet_feeRatePollerEnable: (a: number, b: number) => number;
  readonly wallet_flush: (a: number, b: number) => number;
  readonly wallet_getStatus: (a: number, b: number) => number;
  readonly wallet_prvKeyDataCreate: (a: number, b: number) => number;
  readonly wallet_prvKeyDataEnumerate: (a: number, b: number) => number;
  readonly wallet_prvKeyDataGet: (a: number, b: number) => number;
  readonly wallet_prvKeyDataRemove: (a: number, b: number) => number;
  readonly wallet_retainContext: (a: number, b: number) => number;
  readonly wallet_transactionsDataGet: (a: number, b: number) => number;
  readonly wallet_transactionsReplaceMetadata: (a: number, b: number) => number;
  readonly wallet_transactionsReplaceNote: (a: number, b: number) => number;
  readonly wallet_walletChangeSecret: (a: number, b: number) => number;
  readonly wallet_walletClose: (a: number, b: number) => number;
  readonly wallet_walletCreate: (a: number, b: number) => number;
  readonly wallet_walletEnumerate: (a: number, b: number) => number;
  readonly wallet_walletExport: (a: number, b: number) => number;
  readonly wallet_walletImport: (a: number, b: number) => number;
  readonly wallet_walletOpen: (a: number, b: number) => number;
  readonly wallet_walletReload: (a: number, b: number) => number;
  readonly __wbg_publickey_free: (a: number, b: number) => void;
  readonly __wbg_xonlypublickey_free: (a: number, b: number) => void;
  readonly publickey_fingerprint: (a: number) => number;
  readonly publickey_toAddress: (a: number, b: number, c: number) => void;
  readonly publickey_toAddressECDSA: (a: number, b: number, c: number) => void;
  readonly publickey_toString: (a: number, b: number) => void;
  readonly publickey_toXOnlyPublicKey: (a: number) => number;
  readonly publickey_try_new: (a: number, b: number, c: number) => void;
  readonly xonlypublickey_fromAddress: (a: number, b: number) => void;
  readonly xonlypublickey_toAddress: (a: number, b: number, c: number) => void;
  readonly xonlypublickey_toAddressECDSA: (a: number, b: number, c: number) => void;
  readonly xonlypublickey_toString: (a: number, b: number) => void;
  readonly xonlypublickey_try_new: (a: number, b: number, c: number) => void;
  readonly __wbg_derivationpath_free: (a: number, b: number) => void;
  readonly __wbg_xpub_free: (a: number, b: number) => void;
  readonly derivationpath_isEmpty: (a: number) => number;
  readonly derivationpath_length: (a: number) => number;
  readonly derivationpath_new: (a: number, b: number, c: number) => void;
  readonly derivationpath_parent: (a: number) => number;
  readonly derivationpath_push: (a: number, b: number, c: number, d: number) => void;
  readonly derivationpath_toString: (a: number, b: number) => void;
  readonly xpub_chainCode: (a: number, b: number) => void;
  readonly xpub_childNumber: (a: number) => number;
  readonly xpub_depth: (a: number) => number;
  readonly xpub_deriveChild: (a: number, b: number, c: number, d: number) => void;
  readonly xpub_derivePath: (a: number, b: number, c: number) => void;
  readonly xpub_intoString: (a: number, b: number, c: number, d: number) => void;
  readonly xpub_parentFingerprint: (a: number, b: number) => void;
  readonly xpub_toPublicKey: (a: number) => number;
  readonly xpub_try_new: (a: number, b: number, c: number) => void;
  readonly xpub_xpub: (a: number, b: number) => void;
  readonly __wbg_publickeygenerator_free: (a: number, b: number) => void;
  readonly publickeygenerator_changeAddress: (a: number, b: number, c: number, d: number) => void;
  readonly publickeygenerator_changeAddressAsString: (a: number, b: number, c: number, d: number) => void;
  readonly publickeygenerator_changeAddressAsStrings: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly publickeygenerator_changeAddresses: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly publickeygenerator_changePubkey: (a: number, b: number, c: number) => void;
  readonly publickeygenerator_changePubkeyAsString: (a: number, b: number, c: number) => void;
  readonly publickeygenerator_changePubkeys: (a: number, b: number, c: number, d: number) => void;
  readonly publickeygenerator_changePubkeysAsStrings: (a: number, b: number, c: number, d: number) => void;
  readonly publickeygenerator_fromMasterXPrv: (a: number, b: number, c: number, d: bigint, e: number) => void;
  readonly publickeygenerator_fromXPub: (a: number, b: number, c: number) => void;
  readonly publickeygenerator_receiveAddress: (a: number, b: number, c: number, d: number) => void;
  readonly publickeygenerator_receiveAddressAsString: (a: number, b: number, c: number, d: number) => void;
  readonly publickeygenerator_receiveAddressAsStrings: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly publickeygenerator_receiveAddresses: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly publickeygenerator_receivePubkey: (a: number, b: number, c: number) => void;
  readonly publickeygenerator_receivePubkeyAsString: (a: number, b: number, c: number) => void;
  readonly publickeygenerator_receivePubkeys: (a: number, b: number, c: number, d: number) => void;
  readonly publickeygenerator_receivePubkeysAsStrings: (a: number, b: number, c: number, d: number) => void;
  readonly publickeygenerator_toString: (a: number, b: number) => void;
  readonly __wbg_privatekey_free: (a: number, b: number) => void;
  readonly privatekey_toAddress: (a: number, b: number, c: number) => void;
  readonly privatekey_toAddressECDSA: (a: number, b: number, c: number) => void;
  readonly privatekey_toKeypair: (a: number, b: number) => void;
  readonly privatekey_toPublicKey: (a: number, b: number) => void;
  readonly privatekey_toString: (a: number, b: number) => void;
  readonly privatekey_try_new: (a: number, b: number, c: number) => void;
  readonly __wbg_privatekeygenerator_free: (a: number, b: number) => void;
  readonly __wbg_xprv_free: (a: number, b: number) => void;
  readonly privatekeygenerator_changeKey: (a: number, b: number, c: number) => void;
  readonly privatekeygenerator_new: (a: number, b: number, c: number, d: bigint, e: number) => void;
  readonly privatekeygenerator_receiveKey: (a: number, b: number, c: number) => void;
  readonly xprv_chainCode: (a: number, b: number) => void;
  readonly xprv_childNumber: (a: number) => number;
  readonly xprv_depth: (a: number) => number;
  readonly xprv_deriveChild: (a: number, b: number, c: number, d: number) => void;
  readonly xprv_derivePath: (a: number, b: number, c: number) => void;
  readonly xprv_fromXPrv: (a: number, b: number, c: number) => void;
  readonly xprv_intoString: (a: number, b: number, c: number, d: number) => void;
  readonly xprv_parentFingerprint: (a: number, b: number) => void;
  readonly xprv_privateKey: (a: number, b: number) => void;
  readonly xprv_toPrivateKey: (a: number, b: number) => void;
  readonly xprv_toString: (a: number, b: number) => void;
  readonly xprv_toXPub: (a: number, b: number) => void;
  readonly xprv_try_new: (a: number, b: number) => void;
  readonly xprv_xprv: (a: number, b: number) => void;
  readonly __wbg_keypair_free: (a: number, b: number) => void;
  readonly keypair_fromPrivateKey: (a: number, b: number) => void;
  readonly keypair_get_private_key: (a: number, b: number) => void;
  readonly keypair_get_public_key: (a: number, b: number) => void;
  readonly keypair_get_xonly_public_key: (a: number) => number;
  readonly keypair_random: (a: number) => void;
  readonly keypair_toAddress: (a: number, b: number, c: number) => void;
  readonly keypair_toAddressECDSA: (a: number, b: number, c: number) => void;
  readonly __wbg_pskb_free: (a: number, b: number) => void;
  readonly pskb_add: (a: number, b: number, c: number) => void;
  readonly pskb_deserialize: (a: number, b: number, c: number) => void;
  readonly pskb_displayFormat: (a: number, b: number, c: number) => void;
  readonly pskb_length: (a: number) => number;
  readonly pskb_merge: (a: number, b: number) => void;
  readonly pskb_new: (a: number) => void;
  readonly pskb_serialize: (a: number, b: number) => void;
  readonly __wbg_pskt_free: (a: number, b: number) => void;
  readonly pskt_calculateId: (a: number, b: number) => void;
  readonly pskt_calculateMass: (a: number, b: number, c: number) => void;
  readonly pskt_creator: (a: number, b: number) => void;
  readonly pskt_fallbackLockTime: (a: number, b: number, c: bigint) => void;
  readonly pskt_input: (a: number, b: number, c: number) => void;
  readonly pskt_inputAndRedeemScript: (a: number, b: number, c: number, d: number) => void;
  readonly pskt_inputsModifiable: (a: number, b: number) => void;
  readonly pskt_new: (a: number, b: number) => void;
  readonly pskt_noMoreInputs: (a: number, b: number) => void;
  readonly pskt_noMoreOutputs: (a: number, b: number) => void;
  readonly pskt_output: (a: number, b: number, c: number) => void;
  readonly pskt_outputsModifiable: (a: number, b: number) => void;
  readonly pskt_payload: (a: number) => number;
  readonly pskt_role: (a: number, b: number) => void;
  readonly pskt_serialize: (a: number, b: number) => void;
  readonly pskt_setSequence: (a: number, b: number, c: bigint, d: number) => void;
  readonly pskt_toCombiner: (a: number, b: number) => void;
  readonly pskt_toConstructor: (a: number, b: number) => void;
  readonly pskt_toExtractor: (a: number, b: number) => void;
  readonly pskt_toFinalizer: (a: number, b: number) => void;
  readonly pskt_toSigner: (a: number, b: number) => void;
  readonly pskt_toUpdater: (a: number, b: number) => void;
  readonly version: (a: number) => void;
  readonly __wbg_get_nodedescriptor_uid: (a: number, b: number) => void;
  readonly __wbg_get_nodedescriptor_url: (a: number, b: number) => void;
  readonly __wbg_nodedescriptor_free: (a: number, b: number) => void;
  readonly __wbg_set_nodedescriptor_uid: (a: number, b: number, c: number) => void;
  readonly __wbg_set_nodedescriptor_url: (a: number, b: number, c: number) => void;
  readonly __wbg_resolver_free: (a: number, b: number) => void;
  readonly resolver_connect: (a: number, b: number) => number;
  readonly resolver_ctor: (a: number, b: number) => void;
  readonly resolver_getNode: (a: number, b: number, c: number) => number;
  readonly resolver_getUrl: (a: number, b: number, c: number) => number;
  readonly resolver_urls: (a: number) => number;
  readonly __wbg_rpcclient_free: (a: number, b: number) => void;
  readonly rpcclient_addEventListener: (a: number, b: number, c: number, d: number) => void;
  readonly rpcclient_addPeer: (a: number, b: number) => number;
  readonly rpcclient_ban: (a: number, b: number) => number;
  readonly rpcclient_clearEventListener: (a: number, b: number, c: number) => void;
  readonly rpcclient_connect: (a: number, b: number) => number;
  readonly rpcclient_ctor: (a: number, b: number) => void;
  readonly rpcclient_defaultPort: (a: number, b: number, c: number) => void;
  readonly rpcclient_disconnect: (a: number) => number;
  readonly rpcclient_encoding: (a: number, b: number) => void;
  readonly rpcclient_estimateNetworkHashesPerSecond: (a: number, b: number) => number;
  readonly rpcclient_getBalanceByAddress: (a: number, b: number) => number;
  readonly rpcclient_getBalancesByAddresses: (a: number, b: number) => number;
  readonly rpcclient_getBlock: (a: number, b: number) => number;
  readonly rpcclient_getBlockCount: (a: number, b: number) => number;
  readonly rpcclient_getBlockDagInfo: (a: number, b: number) => number;
  readonly rpcclient_getBlockRewardInfo: (a: number, b: number) => number;
  readonly rpcclient_getBlockTemplate: (a: number, b: number) => number;
  readonly rpcclient_getBlocks: (a: number, b: number) => number;
  readonly rpcclient_getCoinSupply: (a: number, b: number) => number;
  readonly rpcclient_getConnectedPeerInfo: (a: number, b: number) => number;
  readonly rpcclient_getConnections: (a: number, b: number) => number;
  readonly rpcclient_getCurrentBlockColor: (a: number, b: number) => number;
  readonly rpcclient_getCurrentNetwork: (a: number, b: number) => number;
  readonly rpcclient_getDaaScoreTimestampEstimate: (a: number, b: number) => number;
  readonly rpcclient_getFeeEstimate: (a: number, b: number) => number;
  readonly rpcclient_getFeeEstimateExperimental: (a: number, b: number) => number;
  readonly rpcclient_getHeaders: (a: number, b: number) => number;
  readonly rpcclient_getInfo: (a: number, b: number) => number;
  readonly rpcclient_getMempoolEntries: (a: number, b: number) => number;
  readonly rpcclient_getMempoolEntriesByAddresses: (a: number, b: number) => number;
  readonly rpcclient_getMempoolEntry: (a: number, b: number) => number;
  readonly rpcclient_getMetrics: (a: number, b: number) => number;
  readonly rpcclient_getPeerAddresses: (a: number, b: number) => number;
  readonly rpcclient_getServerInfo: (a: number, b: number) => number;
  readonly rpcclient_getSink: (a: number, b: number) => number;
  readonly rpcclient_getSinkBlueScore: (a: number, b: number) => number;
  readonly rpcclient_getSubnetwork: (a: number, b: number) => number;
  readonly rpcclient_getSyncStatus: (a: number, b: number) => number;
  readonly rpcclient_getUtxoReturnAddress: (a: number, b: number) => number;
  readonly rpcclient_getUtxosByAddresses: (a: number, b: number) => number;
  readonly rpcclient_getVirtualChainFromBlock: (a: number, b: number) => number;
  readonly rpcclient_getVirtualChainFromBlockV2: (a: number, b: number) => number;
  readonly rpcclient_isConnected: (a: number) => number;
  readonly rpcclient_networkId: (a: number) => number;
  readonly rpcclient_nodeId: (a: number, b: number) => void;
  readonly rpcclient_parseUrl: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly rpcclient_ping: (a: number, b: number) => number;
  readonly rpcclient_removeAllEventListeners: (a: number, b: number) => void;
  readonly rpcclient_removeEventListener: (a: number, b: number, c: number, d: number) => void;
  readonly rpcclient_resolveFinalityConflict: (a: number, b: number) => number;
  readonly rpcclient_resolver: (a: number) => number;
  readonly rpcclient_setNetworkId: (a: number, b: number, c: number) => void;
  readonly rpcclient_setResolver: (a: number, b: number, c: number) => void;
  readonly rpcclient_shutdown: (a: number, b: number) => number;
  readonly rpcclient_start: (a: number) => number;
  readonly rpcclient_stop: (a: number) => number;
  readonly rpcclient_submitBlock: (a: number, b: number) => number;
  readonly rpcclient_submitTransaction: (a: number, b: number) => number;
  readonly rpcclient_submitTransactionReplacement: (a: number, b: number) => number;
  readonly rpcclient_subscribeBlockAdded: (a: number) => number;
  readonly rpcclient_subscribeFinalityConflict: (a: number) => number;
  readonly rpcclient_subscribeFinalityConflictResolved: (a: number) => number;
  readonly rpcclient_subscribeNewBlockTemplate: (a: number) => number;
  readonly rpcclient_subscribePruningPointUtxoSetOverride: (a: number) => number;
  readonly rpcclient_subscribeSinkBlueScoreChanged: (a: number) => number;
  readonly rpcclient_subscribeUtxosChanged: (a: number, b: number) => number;
  readonly rpcclient_subscribeVirtualChainChanged: (a: number, b: number) => number;
  readonly rpcclient_subscribeVirtualDaaScoreChanged: (a: number) => number;
  readonly rpcclient_triggerAbort: (a: number) => void;
  readonly rpcclient_unban: (a: number, b: number) => number;
  readonly rpcclient_unsubscribeBlockAdded: (a: number) => number;
  readonly rpcclient_unsubscribeFinalityConflict: (a: number) => number;
  readonly rpcclient_unsubscribeFinalityConflictResolved: (a: number) => number;
  readonly rpcclient_unsubscribeNewBlockTemplate: (a: number) => number;
  readonly rpcclient_unsubscribePruningPointUtxoSetOverride: (a: number) => number;
  readonly rpcclient_unsubscribeSinkBlueScoreChanged: (a: number) => number;
  readonly rpcclient_unsubscribeUtxosChanged: (a: number, b: number) => number;
  readonly rpcclient_unsubscribeVirtualChainChanged: (a: number, b: number) => number;
  readonly rpcclient_unsubscribeVirtualDaaScoreChanged: (a: number) => number;
  readonly rpcclient_url: (a: number, b: number) => void;
  readonly __wbg_createwritestreamoptions_free: (a: number, b: number) => void;
  readonly __wbg_formatinputpathobject_free: (a: number, b: number) => void;
  readonly __wbg_mkdtempsyncoptions_free: (a: number, b: number) => void;
  readonly __wbg_pipeoptions_free: (a: number, b: number) => void;
  readonly createwritestreamoptions_auto_close: (a: number) => number;
  readonly createwritestreamoptions_emit_close: (a: number) => number;
  readonly createwritestreamoptions_encoding: (a: number) => number;
  readonly createwritestreamoptions_fd: (a: number) => number;
  readonly createwritestreamoptions_flags: (a: number) => number;
  readonly createwritestreamoptions_mode: (a: number) => number;
  readonly createwritestreamoptions_new_with_values: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly createwritestreamoptions_set_auto_close: (a: number, b: number) => void;
  readonly createwritestreamoptions_set_emit_close: (a: number, b: number) => void;
  readonly createwritestreamoptions_set_encoding: (a: number, b: number) => void;
  readonly createwritestreamoptions_set_fd: (a: number, b: number) => void;
  readonly createwritestreamoptions_set_flags: (a: number, b: number) => void;
  readonly createwritestreamoptions_set_mode: (a: number, b: number) => void;
  readonly createwritestreamoptions_set_start: (a: number, b: number, c: number) => void;
  readonly createwritestreamoptions_start: (a: number, b: number) => void;
  readonly formatinputpathobject_base: (a: number) => number;
  readonly formatinputpathobject_dir: (a: number) => number;
  readonly formatinputpathobject_ext: (a: number) => number;
  readonly formatinputpathobject_name: (a: number) => number;
  readonly formatinputpathobject_new: () => number;
  readonly formatinputpathobject_new_with_values: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly formatinputpathobject_root: (a: number) => number;
  readonly formatinputpathobject_set_base: (a: number, b: number) => void;
  readonly formatinputpathobject_set_dir: (a: number, b: number) => void;
  readonly formatinputpathobject_set_ext: (a: number, b: number) => void;
  readonly formatinputpathobject_set_name: (a: number, b: number) => void;
  readonly formatinputpathobject_set_root: (a: number, b: number) => void;
  readonly mkdtempsyncoptions_encoding: (a: number) => number;
  readonly mkdtempsyncoptions_new: () => number;
  readonly mkdtempsyncoptions_new_with_values: (a: number) => number;
  readonly mkdtempsyncoptions_set_encoding: (a: number, b: number) => void;
  readonly pipeoptions_end: (a: number) => number;
  readonly pipeoptions_new: (a: number) => number;
  readonly pipeoptions_set_end: (a: number, b: number) => void;
  readonly __wbg_appendfileoptions_free: (a: number, b: number) => void;
  readonly __wbg_assertionerroroptions_free: (a: number, b: number) => void;
  readonly __wbg_createreadstreamoptions_free: (a: number, b: number) => void;
  readonly appendfileoptions_encoding: (a: number) => number;
  readonly appendfileoptions_flag: (a: number) => number;
  readonly appendfileoptions_mode: (a: number) => number;
  readonly appendfileoptions_new: () => number;
  readonly appendfileoptions_new_with_values: (a: number, b: number, c: number) => number;
  readonly appendfileoptions_set_encoding: (a: number, b: number) => void;
  readonly appendfileoptions_set_flag: (a: number, b: number) => void;
  readonly appendfileoptions_set_mode: (a: number, b: number) => void;
  readonly assertionerroroptions_actual: (a: number) => number;
  readonly assertionerroroptions_expected: (a: number) => number;
  readonly assertionerroroptions_message: (a: number) => number;
  readonly assertionerroroptions_new: (a: number, b: number, c: number, d: number) => number;
  readonly assertionerroroptions_operator: (a: number) => number;
  readonly assertionerroroptions_set_actual: (a: number, b: number) => void;
  readonly assertionerroroptions_set_expected: (a: number, b: number) => void;
  readonly assertionerroroptions_set_message: (a: number, b: number) => void;
  readonly assertionerroroptions_set_operator: (a: number, b: number) => void;
  readonly createreadstreamoptions_auto_close: (a: number) => number;
  readonly createreadstreamoptions_emit_close: (a: number) => number;
  readonly createreadstreamoptions_encoding: (a: number) => number;
  readonly createreadstreamoptions_end: (a: number, b: number) => void;
  readonly createreadstreamoptions_fd: (a: number) => number;
  readonly createreadstreamoptions_flags: (a: number) => number;
  readonly createreadstreamoptions_high_water_mark: (a: number, b: number) => void;
  readonly createreadstreamoptions_mode: (a: number) => number;
  readonly createreadstreamoptions_new_with_values: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number) => number;
  readonly createreadstreamoptions_set_auto_close: (a: number, b: number) => void;
  readonly createreadstreamoptions_set_emit_close: (a: number, b: number) => void;
  readonly createreadstreamoptions_set_encoding: (a: number, b: number) => void;
  readonly createreadstreamoptions_set_end: (a: number, b: number, c: number) => void;
  readonly createreadstreamoptions_set_fd: (a: number, b: number) => void;
  readonly createreadstreamoptions_set_flags: (a: number, b: number) => void;
  readonly createreadstreamoptions_set_high_water_mark: (a: number, b: number, c: number) => void;
  readonly createreadstreamoptions_set_mode: (a: number, b: number) => void;
  readonly createreadstreamoptions_set_start: (a: number, b: number, c: number) => void;
  readonly createreadstreamoptions_start: (a: number, b: number) => void;
  readonly __wbg_getnameoptions_free: (a: number, b: number) => void;
  readonly getnameoptions_family: (a: number) => number;
  readonly getnameoptions_host: (a: number) => number;
  readonly getnameoptions_local_address: (a: number) => number;
  readonly getnameoptions_new: (a: number, b: number, c: number, d: number) => number;
  readonly getnameoptions_port: (a: number) => number;
  readonly getnameoptions_set_family: (a: number, b: number) => void;
  readonly getnameoptions_set_host: (a: number, b: number) => void;
  readonly getnameoptions_set_local_address: (a: number, b: number) => void;
  readonly getnameoptions_set_port: (a: number, b: number) => void;
  readonly writestream_add_listener_with_close: (a: number, b: number) => number;
  readonly writestream_add_listener_with_open: (a: number, b: number) => number;
  readonly writestream_on_with_close: (a: number, b: number) => number;
  readonly writestream_on_with_open: (a: number, b: number) => number;
  readonly writestream_once_with_close: (a: number, b: number) => number;
  readonly writestream_once_with_open: (a: number, b: number) => number;
  readonly writestream_prepend_listener_with_close: (a: number, b: number) => number;
  readonly writestream_prepend_listener_with_open: (a: number, b: number) => number;
  readonly writestream_prepend_once_listener_with_close: (a: number, b: number) => number;
  readonly writestream_prepend_once_listener_with_open: (a: number, b: number) => number;
  readonly __wbg_processsendoptions_free: (a: number, b: number) => void;
  readonly __wbg_wasioptions_free: (a: number, b: number) => void;
  readonly processsendoptions_new: (a: number) => number;
  readonly processsendoptions_set_swallow_errors: (a: number, b: number) => void;
  readonly processsendoptions_swallow_errors: (a: number) => number;
  readonly wasioptions_args: (a: number, b: number) => void;
  readonly wasioptions_env: (a: number) => number;
  readonly wasioptions_new: (a: number) => number;
  readonly wasioptions_new_with_values: (a: number, b: number, c: number, d: number) => number;
  readonly wasioptions_preopens: (a: number) => number;
  readonly wasioptions_set_args: (a: number, b: number, c: number) => void;
  readonly wasioptions_set_env: (a: number, b: number) => void;
  readonly wasioptions_set_preopens: (a: number, b: number) => void;
  readonly __wbg_netserveroptions_free: (a: number, b: number) => void;
  readonly netserveroptions_allow_half_open: (a: number) => number;
  readonly netserveroptions_pause_on_connect: (a: number) => number;
  readonly netserveroptions_set_allow_half_open: (a: number, b: number) => void;
  readonly netserveroptions_set_pause_on_connect: (a: number, b: number) => void;
  readonly __wbg_userinfooptions_free: (a: number, b: number) => void;
  readonly userinfooptions_encoding: (a: number) => number;
  readonly userinfooptions_new: () => number;
  readonly userinfooptions_new_with_values: (a: number) => number;
  readonly userinfooptions_set_encoding: (a: number, b: number) => void;
  readonly __wbg_agentconstructoroptions_free: (a: number, b: number) => void;
  readonly __wbg_createhookcallbacks_free: (a: number, b: number) => void;
  readonly __wbg_setaadoptions_free: (a: number, b: number) => void;
  readonly __wbg_streamtransformoptions_free: (a: number, b: number) => void;
  readonly agentconstructoroptions_keep_alive: (a: number) => number;
  readonly agentconstructoroptions_keep_alive_msecs: (a: number) => number;
  readonly agentconstructoroptions_max_free_sockets: (a: number) => number;
  readonly agentconstructoroptions_max_sockets: (a: number) => number;
  readonly agentconstructoroptions_set_keep_alive: (a: number, b: number) => void;
  readonly agentconstructoroptions_set_keep_alive_msecs: (a: number, b: number) => void;
  readonly agentconstructoroptions_set_max_free_sockets: (a: number, b: number) => void;
  readonly agentconstructoroptions_set_max_sockets: (a: number, b: number) => void;
  readonly agentconstructoroptions_set_timeout: (a: number, b: number) => void;
  readonly agentconstructoroptions_timeout: (a: number) => number;
  readonly createhookcallbacks_after: (a: number) => number;
  readonly createhookcallbacks_before: (a: number) => number;
  readonly createhookcallbacks_destroy: (a: number) => number;
  readonly createhookcallbacks_init: (a: number) => number;
  readonly createhookcallbacks_new: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly createhookcallbacks_promise_resolve: (a: number) => number;
  readonly createhookcallbacks_set_after: (a: number, b: number) => void;
  readonly createhookcallbacks_set_before: (a: number, b: number) => void;
  readonly createhookcallbacks_set_destroy: (a: number, b: number) => void;
  readonly createhookcallbacks_set_init: (a: number, b: number) => void;
  readonly createhookcallbacks_set_promise_resolve: (a: number, b: number) => void;
  readonly setaadoptions_flush: (a: number) => number;
  readonly setaadoptions_new: (a: number, b: number, c: number) => number;
  readonly setaadoptions_set_flush: (a: number, b: number) => void;
  readonly setaadoptions_set_transform: (a: number, b: number) => void;
  readonly setaadoptions_transform: (a: number) => number;
  readonly streamtransformoptions_flush: (a: number) => number;
  readonly streamtransformoptions_new: (a: number, b: number) => number;
  readonly streamtransformoptions_set_flush: (a: number, b: number) => void;
  readonly streamtransformoptions_set_transform: (a: number, b: number) => void;
  readonly streamtransformoptions_transform: (a: number) => number;
  readonly setaadoptions_set_plaintext_length: (a: number, b: number) => void;
  readonly setaadoptions_plaintextLength: (a: number) => number;
  readonly __wbg_writefilesyncoptions_free: (a: number, b: number) => void;
  readonly writefilesyncoptions_encoding: (a: number) => number;
  readonly writefilesyncoptions_flag: (a: number) => number;
  readonly writefilesyncoptions_mode: (a: number) => number;
  readonly writefilesyncoptions_new: (a: number, b: number, c: number) => number;
  readonly writefilesyncoptions_set_encoding: (a: number, b: number) => void;
  readonly writefilesyncoptions_set_flag: (a: number, b: number) => void;
  readonly writefilesyncoptions_set_mode: (a: number, b: number) => void;
  readonly readstream_add_listener_with_close: (a: number, b: number) => number;
  readonly readstream_add_listener_with_open: (a: number, b: number) => number;
  readonly readstream_on_with_close: (a: number, b: number) => number;
  readonly readstream_on_with_open: (a: number, b: number) => number;
  readonly readstream_once_with_close: (a: number, b: number) => number;
  readonly readstream_once_with_open: (a: number, b: number) => number;
  readonly readstream_prepend_listener_with_close: (a: number, b: number) => number;
  readonly readstream_prepend_listener_with_open: (a: number, b: number) => number;
  readonly readstream_prepend_once_listener_with_close: (a: number, b: number) => number;
  readonly readstream_prepend_once_listener_with_open: (a: number, b: number) => number;
  readonly __wbg_consoleconstructoroptions_free: (a: number, b: number) => void;
  readonly consoleconstructoroptions_color_mod: (a: number) => number;
  readonly consoleconstructoroptions_ignore_errors: (a: number) => number;
  readonly consoleconstructoroptions_inspect_options: (a: number) => number;
  readonly consoleconstructoroptions_new: (a: number, b: number) => number;
  readonly consoleconstructoroptions_new_with_values: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly consoleconstructoroptions_set_color_mod: (a: number, b: number) => void;
  readonly consoleconstructoroptions_set_ignore_errors: (a: number, b: number) => void;
  readonly consoleconstructoroptions_set_inspect_options: (a: number, b: number) => void;
  readonly consoleconstructoroptions_set_stderr: (a: number, b: number) => void;
  readonly consoleconstructoroptions_set_stdout: (a: number, b: number) => void;
  readonly consoleconstructoroptions_stderr: (a: number) => number;
  readonly consoleconstructoroptions_stdout: (a: number) => number;
  readonly rustsecp256k1_v0_10_0_context_create: (a: number) => number;
  readonly rustsecp256k1_v0_10_0_context_destroy: (a: number) => void;
  readonly rustsecp256k1_v0_10_0_default_error_callback_fn: (a: number, b: number) => void;
  readonly rustsecp256k1_v0_10_0_default_illegal_callback_fn: (a: number, b: number) => void;
  readonly __wbg_abortable_free: (a: number, b: number) => void;
  readonly __wbg_aborted_free: (a: number, b: number) => void;
  readonly abortable_abort: (a: number) => void;
  readonly abortable_check: (a: number, b: number) => void;
  readonly abortable_isAborted: (a: number) => number;
  readonly abortable_new: () => number;
  readonly abortable_reset: (a: number) => void;
  readonly setLogLevel: (a: number) => void;
  readonly initWASM32Bindings: (a: number, b: number) => void;
  readonly initBrowserPanicHook: () => void;
  readonly initConsolePanicHook: () => void;
  readonly presentPanicHookLogs: () => void;
  readonly defer: () => number;
  readonly __wbindgen_export_0: (a: number) => void;
  readonly __wbindgen_export_1: (a: number, b: number) => number;
  readonly __wbindgen_export_2: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_3: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_4: WebAssembly.Table;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_export_5: (a: number, b: number) => void;
  readonly __wbindgen_export_6: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_7: (a: number, b: number) => void;
  readonly __wbindgen_export_8: (a: number, b: number, c: number, d: number) => void;
  readonly __wbindgen_export_9: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_10: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_11: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_12: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_13: (a: number, b: number, c: number, d: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
