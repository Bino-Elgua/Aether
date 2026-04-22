/**
 * AIO Bridge — Connects Aether agents to AIO on-chain escrow (SUI Move)
 * 
 * AIO contract addresses (testnet): 
 *   Package: 0x07d136c49616578e447a3ca693bdb4f84f40b14d
 * 
 * On-chain modules:
 *   - escrow.move: create<T>, release<T>, refund<T>
 *   - receipts.move: submit_root (elder-gated Merkle anchoring)
 *   - events.move: WorkReceiptEvent
 *   - config.move: elder registry
 *   - mode.move: system circuit breaker (Normal/Degraded/Halted)
 */

const crypto = require('crypto');
const EventEmitter = require('events');

const AIO_DEFAULTS = {
  packageId: process.env.AIO_PACKAGE_ID || '0x07d136c49616578e447a3ca693bdb4f84f40b14d',
  network: process.env.SUI_NETWORK || 'testnet',
  rpcUrl: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443',
};

const SYSTEM_MODE = Object.freeze({
  NORMAL: 0,
  DEGRADED: 1,
  HALTED: 2,
});

class AIOBridge extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = { ...AIO_DEFAULTS, ...config };
    this.receipts = [];
    this.pendingRoots = [];
    this.mode = SYSTEM_MODE.NORMAL;
  }

  /**
   * Build a transaction payload for creating an on-chain escrow.
   * Returns the tx data to be signed and submitted by the client wallet.
   */
  buildCreateEscrow(clientAddress, workerAddress, coinObjectId, amount, requestId) {
    if (this.mode === SYSTEM_MODE.HALTED) {
      throw new Error('AIO system is halted — no new escrows');
    }
    const rid = Buffer.from(requestId, 'utf-8');
    return {
      module: 'escrow',
      function: 'create',
      typeArgs: ['0x2::sui::SUI'],
      args: [clientAddress, workerAddress, coinObjectId, Array.from(rid)],
      package: this.config.packageId,
      network: this.config.network,
    };
  }

  /**
   * Build a transaction payload for releasing an escrow to the worker.
   */
  buildReleaseEscrow(escrowObjectId) {
    return {
      module: 'escrow',
      function: 'release',
      typeArgs: ['0x2::sui::SUI'],
      args: [escrowObjectId],
      package: this.config.packageId,
    };
  }

  /**
   * Build a transaction payload for refunding an escrow to the client.
   */
  buildRefundEscrow(escrowObjectId) {
    return {
      module: 'escrow',
      function: 'refund',
      typeArgs: ['0x2::sui::SUI'],
      args: [escrowObjectId],
      package: this.config.packageId,
    };
  }

  /**
   * Build a Merkle root submission for off-chain work attestation.
   * Elder-gated — only authorized addresses can submit.
   */
  buildSubmitRoot(configObjectId, merkleRoot, count, epoch) {
    return {
      module: 'receipts',
      function: 'submit_root',
      args: [configObjectId, Array.from(Buffer.from(merkleRoot, 'hex')), count, epoch],
      package: this.config.packageId,
    };
  }

  /**
   * Compute a Merkle root from an array of receipt hashes.
   */
  computeMerkleRoot(receiptHashes) {
    if (receiptHashes.length === 0) return null;
    let level = receiptHashes.map(h => 
      typeof h === 'string' ? Buffer.from(h, 'hex') : h
    );
    while (level.length > 1) {
      const next = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = level[i + 1] || left;
        const combined = Buffer.concat([left, right]);
        next.push(crypto.createHash('sha256').update(combined).digest());
      }
      level = next;
    }
    return level[0].toString('hex');
  }

  /**
   * Record a local receipt and batch for Merkle anchoring.
   */
  recordReceipt(agentId, jobId, resultHash, amount) {
    const receipt = {
      agentId,
      jobId,
      resultHash,
      amount,
      timestamp: Date.now(),
      hash: crypto.createHash('sha256')
        .update(`${agentId}:${jobId}:${resultHash}:${amount}:${Date.now()}`)
        .digest('hex'),
    };
    this.receipts.push(receipt);
    this.emit('receipt', receipt);
    return receipt;
  }

  /**
   * Batch current receipts into a Merkle root for on-chain submission.
   */
  batchReceipts() {
    if (this.receipts.length === 0) return null;
    const hashes = this.receipts.map(r => r.hash);
    const root = this.computeMerkleRoot(hashes);
    const batch = {
      root,
      count: this.receipts.length,
      epoch: Math.floor(Date.now() / (24 * 60 * 60 * 1000)),
      receipts: [...this.receipts],
    };
    this.pendingRoots.push(batch);
    this.receipts = [];
    this.emit('batch', batch);
    return batch;
  }

  setMode(mode) {
    this.mode = mode;
    this.emit('mode_change', { mode });
  }
}

module.exports = { AIOBridge, AIO_DEFAULTS, SYSTEM_MODE };
