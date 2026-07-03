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
