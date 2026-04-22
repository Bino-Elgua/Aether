'use strict';

const crypto = require('crypto');

/**
 * SecurityGuard: Centralized input validation and sandboxing utility.
 */
class SecurityGuard {
  static validate(input, schema) {
    if (!input || typeof input !== 'object') throw new Error('Invalid input');
    for (const [key, type] of Object.entries(schema)) {
      if (typeof input[key] !== type) {
        throw new Error(`Security Violation: Expected ${type} for ${key}`);
      }
    }
    return true;
  }

  static generatePolicy(agentId, operations) {
    return {
      agentId,
      operations,
      timestamp: Date.now(),
      hash: crypto.createHash('sha256').update(`${agentId}:${JSON.stringify(operations)}`).digest('hex')
    };
  }
}

module.exports = SecurityGuard;
