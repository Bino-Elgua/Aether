'use strict';

const crypto = require('crypto');
const EventEmitter = require('events');

const STRATEGY = Object.freeze({
  HIERARCHICAL: 'hierarchical', // Lead agent delegates to workers
  DEMOCRATIC:   'democratic',   // All agents vote on solutions
  COMPETITIVE:  'competitive',  // First valid result wins
  PIPELINE:     'pipeline',     // Sequential transformations
});

class SwarmCoordinator extends EventEmitter {
  constructor(strategy = STRATEGY.HIERARCHICAL, interpreter = null) {
    super();
    this.strategy = strategy;
    this.interpreter = interpreter;
    this.agents = new Map(); // agentId -> agentDef
    this.tasks = [];
    this.results = new Map(); // taskId -> submissions[]
  }

  addAgent(agentId, role = 'worker', capabilities = {}) {
    const def = {
      agentId,
      role,
      capabilities,
      joined: Date.now(),
      metrics: { tasksCompleted: 0, errors: 0 },
      weight: role === 'lead' ? 2.0 : 1.0
    };
    this.agents.set(agentId, def);
    this.emit('agent_joined', { agentId, role });
  }

  removeAgent(agentId) {
    this.agents.delete(agentId);
    this.emit('agent_left', { agentId });
  }

  async dispatch(taskDescription) {
    const id = `task_${crypto.randomBytes(8).toString('hex')}`;
    const record = { 
      id, 
      task: taskDescription, 
      assigned: [], 
      status: 'pending', 
      created: Date.now(),
      strategy: this.strategy
    };
    this.tasks.push(record);

    const agentList = Array.from(this.agents.values());
    if (agentList.length === 0) {
      throw new Error("No agents in swarm to dispatch task");
    }

    switch (this.strategy) {
      case STRATEGY.HIERARCHICAL: {
        const lead = agentList.find(a => a.role === 'lead') || agentList[0];
        const workers = agentList.filter(a => a.agentId !== lead.agentId);
        record.lead = lead.agentId;
        record.assigned = workers.map(w => w.agentId);
        
        // Simulation: Lead plans, workers execute
        console.log(`[SWARM] Lead ${lead.agentId} delegating to ${workers.length} workers...`);
        break;
      }
      case STRATEGY.DEMOCRATIC: {
        record.assigned = agentList.map(a => a.agentId);
        console.log(`[SWARM] Democratic task dispatched to ${agentList.length} agents...`);
        break;
      }
      case STRATEGY.COMPETITIVE: {
        record.assigned = agentList.map(a => a.agentId);
        record.mode = 'race';
        console.log(`[SWARM] Competitive race started between ${agentList.length} agents...`);
        break;
      }
      case STRATEGY.PIPELINE: {
        record.assigned = agentList.map(a => a.agentId);
        record.mode = 'sequential';
        console.log(`[SWARM] Pipeline initialized through ${agentList.length} stages...`);
        break;
      }
    }

    record.status = 'dispatched';
    this.emit('dispatched', record);
    return record;
  }

  submitResult(taskId, agentId, result) {
    if (!this.results.has(taskId)) this.results.set(taskId, []);
    const submissions = this.results.get(taskId);
    submissions.push({ agentId, result, timestamp: Date.now() });
    
    const agent = this.agents.get(agentId);
    if (agent) agent.metrics.tasksCompleted++;

    this.emit('result', { taskId, agentId });
  }

  resolve(taskId) {
    const submissions = this.results.get(taskId) || [];
    const task = this.tasks.find(t => t.id === taskId);
    if (task) task.status = 'resolved';

    if (submissions.length === 0) return { error: "No results submitted" };

    switch (this.strategy) {
      case STRATEGY.COMPETITIVE:
        // First one to submit wins (naive race)
        return submissions[0];
      case STRATEGY.DEMOCRATIC:
        // Majority/weighted consensus simulation
        const consensus = submissions.length >= Math.ceil(this.agents.size / 2);
        return { consensus, votes: submissions.length, total: this.agents.size };
      case STRATEGY.PIPELINE:
        // The last result is the final product
        return submissions[submissions.length - 1];
      default:
        return { submissions };
    }
  }

  getAgents() { return [...this.agents.values()]; }
  getTasks() { return this.tasks; }
}

module.exports = { STRATEGY, SwarmCoordinator };
