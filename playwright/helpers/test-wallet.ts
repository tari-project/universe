// Known test wallet fixture for localnet only. Canonical source —
// imported by both global-setup.ts and the test specs.
export const TEST_WALLET = {
  walletId: 'test01',
  address: 'H27bCbHq55SZio4NcNQvTVdGKjMnVfeHPBfQ7N744iGyi34z5nv4zXKFzy8sug4VyWfndMCwjtpN9TXZUhVjeKFkJp9',
  seedWords: [
    'park',
    'visit',
    'october',
    'addict',
    'grocery',
    'suggest',
    'portion',
    'bus',
    'display',
    'island',
    'mother',
    'tiger',
    'mutual',
    'actress',
    'arrest',
    'buzz',
    'thing',
    'range',
    'final',
    'urban',
    'much',
    'noble',
    'this',
    'oxygen',
  ],
  spendKeyHex: '8ee08ece531fdf67ff574234e085bcd25e7d986ad60a4c1dee8147473a2ae543',
  viewKeyHex: 'bba72d1e62d91ef18bb55bd4260ed63ac7b2c54de0efa2765e555ae4a4d1c40f',
  cborHex:
    'a16e656e637279707465645f7365656498180218ff051821189f1867184718f5182f187518a1185218e818ce18d7185c18e918fc1850182c18ad18f4188e18c8',
};

// The generated Monero wallet that ships with the fixture profile, localnet
// only. `global-setup` writes `seedHex` into the Monero credential file as a
// PLAINTEXT 32-byte seed (that is what the app stores before any PIN exists)
// and records `address` in config_wallet.json with
// `monero_address_is_generated: true`. Generated once with the crate the app
// uses (`monero_address_creator::Seed::generate()`); `cborHex` is
// `serde_cbor::to_vec(Credential { encrypted_seed })` over those 32 bytes.
export const TEST_MONERO = {
  seedHex: '7fc54536ed6523873761cc6ee62339a3d6ac2163f793b7a244de81ff295fd57a',
  address: '49CtwhDX8KFHj5X5haVmLSXb2FudBzPWFXUG3CS1j1Uxi9ouVi8xLbPaj4KD7R94ugFVuc5xmc2TxcdJo9Z2SG3QLVLEJkX',
  seedWords: [
    'ozone',
    'either',
    'upon',
    'umbrella',
    'fidget',
    'inflamed',
    'nestle',
    'cousin',
    'candy',
    'rewind',
    'hull',
    'kept',
    'fever',
    'gone',
    'rowboat',
    'tonic',
    'innocent',
    'antics',
    'mystery',
    'vane',
    'vacation',
    'tossed',
    'onslaught',
    'physics',
    'gone',
  ],
  cborHex:
    'a16e656e637279707465645f736565649820187f18c51845183618ed1865182318871837186118cc186e18e61823183918a318d618ac1821186318f7189318b718a2184418de188118ff1829185f18d5187a',
};

// A second, unrelated Monero wallet. Valid seed words (they pass the
// mnemonic checksum) that derive a DIFFERENT address, so `forgot_pin`
// rejects them on the address comparison — the guard 96-pin-recovery
// exercises — rather than on decoding.
export const OTHER_MONERO_SEED_WORDS = [
  'rodent',
  'cistern',
  'juicy',
  'afoot',
  'fruit',
  'rebel',
  'utility',
  'inactive',
  'cistern',
  'legion',
  'knapsack',
  'axes',
  'serving',
  'lending',
  'oxygen',
  'water',
  'dabbing',
  'tycoon',
  'nanny',
  'lipstick',
  'innocent',
  'jaded',
  'soothe',
  'spiders',
  'inactive',
];

// A SECOND known localnet wallet, used only by the wallet-import test to
// prove importing replaces the active wallet. It is NOT pre-seeded — the
// import test types these seed words into the app and asserts the wallet
// address switches to `address`. Freshly generated (recent birthday →
// fast scan; no history, which is fine since import runs last and every
// history-dependent test has already run on TEST_WALLET). Derived with
// CipherSeed::random() through the same path as get_tari_wallet_details
// (SeedWordsWallet → KeyManager → TariAddress::new_dual_address on
// LocalNet), so `address` is exactly what the app derives on import.
export const SECOND_WALLET = {
  address: 'H2Eo6xLJaoR85T7cGjTVtwtxzcD6SyGiMEd4qswdmd8T8ucLS8QcbWiyAHWy7k88wu8rcqaK4qrEfshy5fZP9WDfa7m',
  seedWords: [
    'park',
    'left',
    'define',
    'reject',
    'airport',
    'forget',
    'teach',
    'hero',
    'inmate',
    'exhibit',
    'country',
    'order',
    'term',
    'curve',
    'picture',
    'music',
    'minor',
    'love',
    'page',
    'try',
    'parrot',
    'bundle',
    'chest',
    'donate',
  ],
};
