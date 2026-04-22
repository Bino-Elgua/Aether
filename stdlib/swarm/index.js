const crypto = require('crypto');
const EventEmitter = require('events');

const STRATEGY = Object.freeze({
  HIERARCHICAL: 'hierarchical',
  DEMOCRATIC: 'democratic',
  COMPETITIVE: 'competitive',
  PIPELINE: 'pipeline',
});

class SwarmCoordinator extends EventEmitter {
  constructor(strategy = STRATEGY.HIERARCHICAL) {
    super();
    this.strategy = strategy;
    this.agents = new Map();
    this.tasks = [];
    this.results = new Map();
  }

  addAgent(agentId, role = 'worker', capabilities = {}) {
    this.agents.set(agentId, { agentId, role, capabilities, joined: Date.now() });
    this.emit('agent_joined', { agentId, role });
  }

  removeAgent(agentId) {
    this.agents.delete(agentId);
    this.emit('agent_left', { agentId });
  }

  async dispatch(task) {
    const id = `task_${crypto.randomBytes(8).toString('hex')}`;
    const record = { id, task, assigned: [], status: 'pending', created: Date.now() };
    this.tasks.push(record);

    switch (this.strategy) {
      case STRATEGY.HIERARCHICAL: {
        const lead = [...this.agents.values()].find(a => a.role === 'lead');
        const workers = [...this.agents.values()].filter(a => a.role === 'worker');
        record.assigned = workers.map(w => w.agentId);
        record.lead = lead ? lead.agentId : null;
        break;
      }
      case STRATEGY.DEMOCRATIC: {
        record.assigned = [...this.agents.keys()];
        break;
      }
      case STRATEGY.COMPETITIVE: {
        record.assigned = [...this.agents.keys()];
        record.mode = 'race';
        break;
      }
      case STRATEGY.PIPELINE: {
        record.assigned = [...this.agents.keys()];
        record.mode = 'sequential';
        break;
      }
    }

    record.status = 'dispatched';
    this.emit('dispatched', record);
    return record;
  }

  submitResult(taskId, agentId, result) {
    if (!this.results.has(taskId)) this.results.set(taskId, []);
    this.results.get(taskId).push({ agentId, result, timestamp: Date.now() });
    this.emit('result', { taskId, agentId });
  }

  resolve(taskId) {
    const submissions = this.results.get(taskId) || [];
    const task = this.tasks.find(t => t.id === taskId);
    if (task) task.status = 'resolved';

    switch (this.strategy) {
      case STRATEGY.COMPETITIVE:
        return submissions[0] || null; // first wins
      case STRATEGY.DEMOCRATIC:
        return { votes: submissions, consensus: submissions.length > 0 };
      case STRATEGY.PIPELINE:
        return submissions[submissions.length - 1] || null; // last in chain
      default:
        return { submissions };
    }
  }

  getAgents() { return [...this.agents.values()]; }
  getTasks() { return this.tasks; }
}

module.exports = { STRATEGY, SwarmCoordinator };
