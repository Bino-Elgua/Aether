const TIER_ORDER = Object.freeze({
  calm: 1,
  moderate: 2,
  aggressive: 3,
});

const TIER_THRESHOLDS = Object.freeze({
  moderate: { reputation: 0.7, completedJobs: 10 },
  aggressive: { reputation: 0.9, completedJobs: 50 },
});

class EvolutionEngine {
  constructor() {
    this.agents = new Map();
  }

  register(agentId, initialTier = 'calm') {
    this.agents.set(agentId, {
      agentId,
      tier: initialTier,
      reputation: 0.5,
      completedJobs: 0,
      failedJobs: 0,
      history: [],
    });
  }

  recordCompletion(agentId, success, jobDifficulty = 'simple') {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    if (success) {
      agent.completedJobs++;
      const bonus = jobDifficulty === 'hard' ? 0.03 : jobDifficulty === 'medium' ? 0.02 : 0.01;
      agent.reputation = Math.min(1, agent.reputation + bonus);
    } else {
      agent.failedJobs++;
      agent.reputation = Math.max(0, agent.reputation - 0.05);
    }

    agent.history.push({ success, jobDifficulty, timestamp: Date.now() });
    return this.checkEvolve(agentId);
  }

  checkEvolve(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    const nextTiers = ['moderate', 'aggressive'];
    for (const next of nextTiers) {
      if (TIER_ORDER[agent.tier] < TIER_ORDER[next]) {
        const threshold = TIER_THRESHOLDS[next];
        if (agent.reputation >= threshold.reputation && agent.completedJobs >= threshold.completedJobs) {
          const prev = agent.tier;
          agent.tier = next;
          return { agentId, evolved: true, from: prev, to: next };
        }
      }
    }
    return { agentId, evolved: false, tier: agent.tier };
  }

  getAgent(agentId) { return this.agents.get(agentId) || null; }
  getTier(agentId) { return this.agents.get(agentId)?.tier || null; }
}

module.exports = { TIER_ORDER, TIER_THRESHOLDS, EvolutionEngine };
