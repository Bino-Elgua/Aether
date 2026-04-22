'use strict';

const crypto = require('crypto');

const ELEMENTS = ['Fire', 'Water', 'Earth', 'Air', 'Ether'];

function agentAddress(agentId) {
  return `aether://${agentId.slice(0, 40)}`;
}

function deriveElements(entropy) {
  const elements = {};
  for (let i = 0; i < ELEMENTS.length; i++) {
    elements[ELEMENTS[i]] = entropy[i + 1] / 255;
  }
  return elements;
}

function dominantElement(elements) {
  let best = null;
  let bestVal = -1;
  for (const el of ELEMENTS) {
    if (elements[el] > bestVal) {
      bestVal = elements[el];
      best = el;
    }
  }
  return best;
}

function deriveCapabilities(oduArchetype, elements) {
  const dominant = dominantElement(elements);
  switch (dominant) {
    case 'Fire':
      return { primary: 'execution', execution: 1.0, speed: 0.8 };
    case 'Water':
      return { primary: 'routing', routing: 1.0, adaptation: 0.7 };
    case 'Earth':
      return { primary: 'storage', storage: 1.0, stability: 0.9 };
    case 'Air':
      return { primary: 'analysis', analysis: 1.0, reasoning: 0.8 };
    case 'Ether':
      return { primary: 'coordination', coordination: 1.0, governance: 0.8 };
    default:
      return { primary: 'coordination', coordination: 1.0, governance: 0.8 };
  }
}

function buildIdentity(entropy) {
  const agentId = crypto.createHash('sha256').update(entropy).digest('hex');
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const oduArchetype = entropy[0];
  const elements = deriveElements(entropy);
  const dominant = dominantElement(elements);
  const address = agentAddress(agentId);

  return {
    agentId,
    publicKey: publicKey.export({ type: 'spki', format: 'pem' }),
    privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }),
    oduArchetype,
    elements,
    dominantElement: dominant,
    address,
    created: Date.now(),
  };
}

async function generateAgentIdentity(entropy) {
  if (!entropy) {
    entropy = crypto.randomBytes(32);
  }
  return buildIdentity(entropy);
}

async function recoverAgentIdentity(seed) {
  const entropy = Buffer.from(seed, 'hex');
  const agentId = crypto.createHash('sha256').update(entropy).digest('hex');
  const seedHash = crypto.createHash('sha256').update(entropy).digest();
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    publicKeyEncoding: { type: 'spki', format: 'der' },
  });

  const oduArchetype = entropy[0];
  const elements = deriveElements(entropy);
  const dominant = dominantElement(elements);
  const address = agentAddress(agentId);

  return {
    agentId,
    publicKey: crypto.createPublicKey({ key: publicKey, type: 'spki', format: 'der' })
      .export({ type: 'spki', format: 'pem' }),
    privateKey: crypto.createPrivateKey({ key: privateKey, type: 'pkcs8', format: 'der' })
      .export({ type: 'pkcs8', format: 'pem' }),
    oduArchetype,
    elements,
    dominantElement: dominant,
    address,
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

module.exports = {
  generateAgentIdentity,
  recoverAgentIdentity,
  signMessage,
  verifyMessage,
  deriveCapabilities,
  agentAddress,
};
