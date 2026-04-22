const crypto = require('crypto');
const EventEmitter = require('events');

const ESCROW_STATUS = Object.freeze({
  LOCKED: 'locked',
  RELEASED: 'released', 
  REFUNDED: 'refunded',
  FORFEITED: 'forfeited',
  DISPUTED: 'disputed',
  EXPIRED: 'expired'
});

class EscrowEngine extends EventEmitter {
  constructor(walletRegistry, options = {}) {
    super();
    this.walletRegistry = walletRegistry;
    this.escrows = new Map();
    this.openCalls = new Map();
    this.counter = 0;
    this.defaultTimeout = options.timeoutMs || 7 * 24 * 60 * 60 * 1000; // 7 days
    // AIO on-chain integration config
    this.aio = {
      packageId: options.aioPackageId || process.env.AIO_PACKAGE_ID || null,
      network: options.network || 'testnet',
      configObjectId: options.configObjectId || null,
    };
  }

  create(clientId, agentId, amount, jobDescription, timeoutMs) {
    const id = `escrow_${++this.counter}`;
    const now = Date.now();
    const escrow = {
      id,
      clientId,
      agentId,
      amount,
      job: jobDescription,
      status: ESCROW_STATUS.LOCKED,
      created: now,
      expiresAt: now + (timeoutMs || this.defaultTimeout),
      resolved: null,
      // AIO on-chain reference (populated when bridged)
      onChainId: null,
      rid: crypto.randomBytes(16).toString('hex'),
    };
    this.escrows.set(id, escrow);
    this.emit('create', escrow);
    return escrow;
  }

  postOpenCall(clientId, amount, jobDescription, timeoutMs) {
    const id = `call_${++this.counter}`;
    const call = {
      id,
      clientId,
      amount,
      job: jobDescription,
      created: Date.now(),
      expiresAt: Date.now() + (timeoutMs || this.defaultTimeout),
    };
    this.openCalls.set(id, call);
    this.emit('open_call', call);
    return call;
  }

  acceptOpenCall(callId, agentId) {
    const call = this.openCalls.get(callId);
    if (!call) throw new Error(`Open call not found: ${callId}`);
    this.openCalls.delete(callId);
    return this.create(call.clientId, agentId, call.amount, call.job);
  }

  release(escrowId) {
    const escrow = this._getActive(escrowId);
    escrow.status = ESCROW_STATUS.RELEASED;
    escrow.resolved = Date.now();
    this.emit('release', { escrow });
    return escrow;
  }

  refund(escrowId) {
    const escrow = this._getActive(escrowId);
    escrow.status = ESCROW_STATUS.REFUNDED;
    escrow.resolved = Date.now();
    this.emit('refund', escrow);
    return escrow;
  }

  forfeit(escrowId, reason) {
    const escrow = this._getActive(escrowId);
    escrow.status = ESCROW_STATUS.FORFEITED;
    escrow.resolved = Date.now();
    this.emit('forfeit', { escrow, reason, burned: escrow.amount });
    return escrow;
  }

  dispute(escrowId) {
    const escrow = this._getActive(escrowId);
    escrow.status = ESCROW_STATUS.DISPUTED;
    this.emit('dispute', escrow);
    return escrow;
  }

  expireStale(now = Date.now()) {
    const expired = [];
    for (const [, escrow] of this.escrows) {
      if (escrow.status === ESCROW_STATUS.LOCKED && now >= escrow.expiresAt) {
        escrow.status = ESCROW_STATUS.EXPIRED;
        escrow.resolved = now;
        expired.push(escrow);
        this.emit('expire', escrow);
      }
    }
    return expired;
  }

  _getActive(escrowId) {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) throw new Error(`Escrow not found: ${escrowId}`);
    if (escrow.status !== ESCROW_STATUS.LOCKED) {
      throw new Error(`Escrow ${escrowId} is not active (status: ${escrow.status})`);
    }
    return escrow;
  }

  get(id) { return this.escrows.get(id) || null; }
  getByAgent(agentId) { return [...this.escrows.values()].filter(e => e.agentId === agentId); }
  getByClient(clientId) { return [...this.escrows.values()].filter(e => e.clientId === clientId); }
  getActive() { return [...this.escrows.values()].filter(e => e.status === ESCROW_STATUS.LOCKED); }

  // Bridge info for connecting to AIO on-chain escrow
  getAIOConfig() { return { ...this.aio }; }
  
  // Link an off-chain escrow to an on-chain AIO escrow object ID
  linkOnChain(escrowId, onChainObjectId) {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) throw new Error(`Escrow not found: ${escrowId}`);
    escrow.onChainId = onChainObjectId;
    this.emit('linked', { escrow, onChainObjectId });
    return escrow;
  }
}

module.exports = { ESCROW_STATUS, EscrowEngine };
