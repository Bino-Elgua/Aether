'use strict';

const crypto = require('crypto');

const WITNESS_CONFIG = {
  simple: 3,
  medium: 4,
  hard: 5,
  selection: 'random',
  tierRequirement: 'same_or_higher',
  minReputation: 50,
  stakeRequirement: 1000, // Synapse
};

const TIER_RANK = { calm: 1, moderate: 2, aggressive: 3 };

class WitnessEngine {
  constructor() {
    this._agents = new Map();
    this._observations = [];
    this._stakes = new Map(); // agentId -> amount
  }

  registerAgent(agentId, tier, reputation, initialStake = 0) {
    this._agents.set(agentId, {
      tier: tier || 'calm',
      reputation: reputation != null ? reputation : 100,
    });
    this._stakes.set(agentId, initialStake);
  }

  unregisterAgent(agentId) {
    this._agents.delete(agentId);
    this._stakes.delete(agentId);
  }

  selectWitnesses(jobDifficulty, excludeAgentId, requiredTier) {
    const count = WITNESS_CONFIG[jobDifficulty] || WITNESS_CONFIG.simple;

    const minRank = requiredTier
      ? TIER_RANK[requiredTier] || 1
      : TIER_RANK[this._agents.get(excludeAgentId)?.tier] || 1;

    const eligible = [];
    for (const [id, agent] of this._agents) {
      if (id === excludeAgentId) continue;
      
      // Advanced criteria: Reputation and Stake
      if (agent.reputation < WITNESS_CONFIG.minReputation) continue;
      if ((this._stakes.get(id) || 0) < WITNESS_CONFIG.stakeRequirement) continue;

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

  rewardJobCompletion(agentId, amount) {
    if (!agentId || amount <= 0) return;
    this.updateReputation(agentId, Math.floor(amount / 100)); // 1 rep per 100 job value
    console.log(`[WITNESS] Rewarded ${agentId} with reputation for job completion.`);
  }

  submitValidation(witnessId, jobId, agentId, approved, notes) {
    if (!this._agents.has(witnessId)) {
        throw new Error(`Invalid witnessId: ${witnessId}`);
    }
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
    if (votes.length === 0) return { approved: false, votes: { for: 0, against: 0 }, total: 0 };

    const votesFor = votes.filter((v) => v.approved).length;
    const votesAgainst = votes.length - votesFor;
    const approved = votesFor > votesAgainst;

    // Advanced Reputation & Staking Impact
    const slashes = [];
    for (const vote of votes) {
      const isMajority = vote.approved === approved;
      
      if (isMajority) {
        // Reward consensus
        this.updateReputation(vote.witnessId, 5);
        // Small Dopamine reward simulation
      } else {
        // Penalize dissent (Slashing simulation)
        this.updateReputation(vote.witnessId, -15);
        const currentStake = this._stakes.get(vote.witnessId) || 0;
        const slashAmount = Math.floor(currentStake * 0.1); // Slash 10%
        this._stakes.set(vote.witnessId, currentStake - slashAmount);
        slashes.push({ agentId: vote.witnessId, amount: slashAmount, reason: 'dissent' });
      }
    }

    return {
      approved,
      votes: { for: votesFor, against: votesAgainst },
      total: votes.length,
      slashes
    };
  }

  getReputation(agentId) {
    const agent = this._agents.get(agentId);
    return agent ? agent.reputation : null;
  }

  updateReputation(agentId, delta) {
    const agent = this._agents.get(agentId);
    if (!agent) return null;
    agent.reputation = Math.max(0, Math.min(1000, agent.reputation + delta));
    return agent.reputation;
  }

  getStake(agentId) {
    return this._stakes.get(agentId) || 0;
  }

  addStake(agentId, amount) {
    const current = this._stakes.get(agentId) || 0;
    this._stakes.set(agentId, current + amount);
    return current + amount;
  }

  getHistory() {
    return this._observations.slice();
  }
}

module.exports = { WITNESS_CONFIG, WitnessEngine };
