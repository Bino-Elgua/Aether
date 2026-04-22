'use strict';

const crypto = require('crypto');

/**
 * BIPỌ̀N39 — Sovereign Identity System for Aether
 * 16 ROOTS × 16 AFFIXES → 256 tokens.
 */

const ROOTS = [
  'esu', 'sango', 'ogun', 'oya', 'yemoja', 'osun', 'obatala', 'orunmila',
  'egungun', 'ori', 'ile', 'omi', 'ina', 'afeefe', 'igi', 'irawo',
];

const AFFIXES = [
  'gate', 'volt', 'forge', 'stream', 'tide', 'veil', 'crown', 'mirror',
  'path', 'seal', 'code', 'sigil', 'drum', 'thunder', 'river', 'dawn',
];

const ELEMENTS = ['Fire', 'Water', 'Earth', 'Air', 'Ether'];

const AFFIX_META = {
  gate:    { element: 'Earth', ritual: 'crossroads' },
  volt:    { element: 'Fire',  ritual: 'thunder' },
  forge:   { element: 'Fire',  ritual: 'iron' },
  stream:  { element: 'Water', ritual: 'libation' },
  tide:    { element: 'Water', ritual: 'ocean' },
  veil:    { element: 'Air',   ritual: 'incense' },
  crown:   { element: 'Ether', ritual: 'prayer' },
  mirror:  { element: 'Air',   ritual: 'truth' },
  path:    { element: 'Earth', ritual: 'journey' },
  seal:    { element: 'Ether', ritual: 'binding' },
  code:    { element: 'Air',   ritual: 'syntax' },
  sigil:   { element: 'Ether', ritual: 'intent' },
  drum:    { element: 'Earth', ritual: 'rhythm' },
  thunder: { element: 'Fire',  ritual: 'justice' },
  river:   { element: 'Water', ritual: 'cleansing' },
  dawn:    { element: 'Ether', ritual: 'begin' },
};

const BASE256 = [];
for (const r of ROOTS) {
  for (const a of AFFIXES) {
    BASE256.push(`${r}-${a}`);
  }
}

/**
 * Generates an agent address (aether://)
 */
function agentAddress(publicKey) {
  const hash = crypto.createHash('sha256').update(publicKey).digest('hex');
  return `aether://${hash.slice(0, 40)}`;
}

/**
 * Derives a keypair from a mnemonic using PBKDF2
 */
function deriveKeypair(mnemonic, passphrase = '') {
  const salt = `BIPỌ̀N39 seed Ọ̀RÍ:${passphrase}`;
  const seed = crypto.pbkdf2Sync(mnemonic, salt, 20480, 64, 'sha512');
  const privateKeyRaw = seed.slice(0, 32);
  
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKey: privateKeyRaw
  });

  return { publicKey, privateKey, seed: privateKeyRaw.toString('hex') };
}

/**
 * Generates a random 12-word mnemonic from BASE256
 */
function generateMnemonic(entropy) {
  const ent = entropy || crypto.randomBytes(16); // 128 bits
  const words = [];
  for (const byte of ent) {
    words.push(BASE256[byte]);
  }
  return words.join(' ');
}

/**
 * Derives elemental signatures from mnemonic
 */
function deriveElements(mnemonic) {
  const counts = { Fire: 0, Water: 0, Earth: 0, Air: 0, Ether: 0 };
  const words = mnemonic.split(' ');
  for (const word of words) {
    const affix = word.split('-')[1];
    const meta = AFFIX_META[affix];
    if (meta) counts[meta.element]++;
  }
  return counts;
}

/**
 * Builds a complete identity object
 */
async function generateAgentIdentity(passphrase = '') {
  const entropy = crypto.randomBytes(16);
  const mnemonic = generateMnemonic(entropy);
  const { publicKey, privateKey, seed } = deriveKeypair(mnemonic, passphrase);
  const elements = deriveElements(mnemonic);
  const address = agentAddress(publicKey);

  // Find dominant element
  let dominant = 'Ether';
  let max = -1;
  for (const [el, count] of Object.entries(elements)) {
    if (count > max) {
      max = count;
      dominant = el;
    }
  }

  return {
    mnemonic,
    publicKey,
    privateKey,
    address,
    elements,
    dominantElement: dominant,
    oduArchetype: entropy[0], // Odù mapping from first entropy byte
    created: Date.now(),
  };
}

function signMessage(privateKey, message) {
  const key = typeof privateKey === 'string'
    ? crypto.createPrivateKey(privateKey)
    : privateKey;
  return crypto.sign(null, Buffer.from(message), key);
}

function verifyMessage(publicKey, message, signature) {
  const key = typeof publicKey === 'string'
    ? crypto.createPublicKey(publicKey)
    : publicKey;
  return crypto.verify(null, Buffer.from(message), key, signature);
}

function deriveCapabilities(oduArchetype, elements) {
  // Map elements to capabilities as before
  const dominant = Object.entries(elements).reduce((a, b) => b[1] > a[1] ? b : a)[0];
  switch (dominant) {
    case 'Fire':  return { primary: 'execution', bonus: 1.2 };
    case 'Water': return { primary: 'routing', bonus: 1.2 };
    case 'Earth': return { primary: 'storage', bonus: 1.2 };
    case 'Air':   return { primary: 'analysis', bonus: 1.2 };
    case 'Ether': return { primary: 'coordination', bonus: 1.5 };
    default:      return { primary: 'general', bonus: 1.0 };
  }
}

module.exports = {
  generateAgentIdentity,
  agentAddress,
  signMessage,
  verifyMessage,
  deriveCapabilities,
  BASE256
};
