'use strict';

const crypto = require('crypto');

const WITNESS_CONFIG = {
  simple: 3,
  medium: 4,
  hard: 5,
  selection: 'random',
  tierRequirement: 'same_or_higher',
};

const TIER_RANK = { calm: 1, moderate: 2, aggressive: 3 };

class WitnessEngine {
  constructor() {
    this._agents = new Map();
    this._observations = [];
  }

  registerAgent(agentId, tier, reputation) {
    this._agents.set(agentId, {
      tier: tier || 'calm',
      reputation: reputation != null ? reputation : 100,
    });
  }

  unregisterAgent(agentId) {
    this._agents.delete(agentId);
  }

  selectWitnesses(jobDifficulty, excludeAgentId, requiredTier) {
    const count = WITNESS_CONFIG[jobDifficulty] || WITNESS_CONFIG.simple;

    const minRank = requiredTier
      ? TIER_RANK[requiredTier] || 1
      : TIER_RANK[this._agents.get(excludeAgentId)?.tier] || 1;

    const eligible = [];
    for (const [id, agent] of this._agents) {
      if (id === excludeAgentId) continue;
      if (
        WITNESS_CONFIG.tierRequirement === 'same_or_higher' &&
        (TIER_RANK[agent.tier] || 0) < minRank
      ) continue;
      eligible.push(id);
    }

    // Fisher-Yates shuffle for random selection
    for (let i = eligible.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
    }

    return eligible.slice(0, count);
  }

  submitValidation(witnessId, jobId, agentId, approved, notes) {
    const hash = crypto
      .createHash('sha256')
      .update(`${witnessId}:${jobId}:${agentId}:${Date.now()}`)
      .digest('hex');

    const record = {
      hash,
      witnessId,
      jobId,
      agentId,
      approved: !!approved,
      notes: notes || '',
      timestamp: Date.now(),
    };

    this._observations.push(record);
    return record;
  }

  tallyVotes(jobId) {
    const votes = this._observations.filter((o) => o.jobId === jobId);
    const votesFor = votes.filter((v) => v.approved).length;
    const votesAgainst = votes.length - votesFor;

    return {
      approved: votesFor > votesAgainst,
      votes: { for: votesFor, against: votesAgainst },
      total: votes.length,
    };
  }

  getReputation(agentId) {
    const agent = this._agents.get(agentId);
    return agent ? agent.reputation : null;
  }

  updateReputation(agentId, delta) {
    const agent = this._agents.get(agentId);
    if (!agent) return null;
    agent.reputation += delta;
    return agent.reputation;
  }

  getHistory() {
    return this._observations.slice();
  }
}

module.exports = { WITNESS_CONFIG, WitnessEngine };
