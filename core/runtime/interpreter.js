const Lexer = require('./lexer');
const Parser = require('./parser');
const Gateway = require('./gateway');
const { MetabolismEngine, TokenLedger, TOKEN_TYPE } = require('../../stdlib/metabolism');
const { WitnessEngine } = require('../../stdlib/witness');
const { generateAgentIdentity, deriveCapabilities, agentAddress } = require('../../stdlib/identity');
const { MemoryEngine, MemoryTier } = require('../../stdlib/memory');
const { EscrowEngine } = require('../../stdlib/hire');
const { SwarmCoordinator } = require('../../stdlib/swarm');
const { EvolutionEngine } = require('../../stdlib/evolve');

class Interpreter {
    constructor(config = {}) {
        this.agent = null;
        this.ethics = {};
        this.permissions = {};
        this.ledger = new TokenLedger();
        this.metabolism = new MetabolismEngine(this.ledger);
        this.witness = new WitnessEngine();
        this.memory = new MemoryEngine({ vault_path: require('path').join(require('os').homedir(), '.aether', 'memory') });
        this.escrow = null;
        this.swarm = null;
        this.evolution = new EvolutionEngine();
        this._thinkConfig = config.think || {};

        // Gateway gets a reference to this interpreter so the Think Engine
        // can read agent state, ethics, permissions, and call stdlib directly.
        this.gateway = new Gateway(this);
    }

    async run(code) {
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const program = parser.parse();

        for (const statement of program.body) {
            await this.execute(statement);
        }
    }

    async execute(node) {
        const { name, arguments: args } = node;

        console.log(`[Executing] ${name}...`);

        switch (name) {
            case 'birth': {
                this.agent = {
                    name: args.name,
                    tier: args.tier || 'moderate',
                    budget: args.budget || 86000000,
                };
                this.metabolism.birthEndow(args.name);
                const identity = await generateAgentIdentity();
                this.agent.identity = identity;
                this.agent.wallet = identity.address;
                this.agent.capabilities = deriveCapabilities(identity.oduArchetype, identity.elements);
                this.witness.registerAgent(args.name, args.tier || 'moderate', 100);
                this.evolution.register(args.name, args.tier || 'calm');
                const bal = this.metabolism.getBalance(args.name);
                console.log(`  Agent born: ${args.name} (${args.tier || 'moderate'} tier)`);
                console.log(`  Wallet: ${identity.address}`);
                console.log(`  Element: ${identity.dominantElement} → ${this.agent.capabilities.primary}`);
                console.log(`  Dopamine: ${bal.dopamine.toLocaleString()} | Synapse: ${bal.synapse.toLocaleString()}`);
                break;
            }

            case 'ethics':
                this.ethics = args;
                console.log(`  Ethics set: ${JSON.stringify(this.ethics)}`);
                break;

            case 'permission':
                this.permissions = args;
                console.log(`  Permissions set: ${JSON.stringify(this.permissions)}`);
                break;

            case 'think': {
                const nlPrompt = args.prompt;
                if (!nlPrompt || nlPrompt.length === 0) break;

                // Try legacy translate first (for trivial pass-through)
                const translated = await this.gateway.translate(nlPrompt);
                if (translated === `think "${nlPrompt}"`) {
                    // Trivial echo — just log
                    console.log(`  Thought: ${nlPrompt}`);
                } else if (translated) {
                    // Legacy code generation (backwards compat)
                    console.log(`  Gateway translated NL to code. Recursing...`);
                    await this.run(translated);
                } else {
                    // Full Think Engine processing
                    await this.gateway.process(nlPrompt);
                }
                break;
            }

            case 'receipt': {
                const crypto = require('crypto');
                const hash = crypto.createHash('sha256')
                    .update(`${this.agent?.name || 'anon'}:${args.type}:${Date.now()}`)
                    .digest('hex');
                console.log(`  Receipt: [${args.type}] ${hash.slice(0, 16)}... (proof: ${args.proof})`);
                break;
            }

            case 'metabolism': {
                const action = args.action;
                if (action === 'decay' || action === 'applyDecay') {
                    this.metabolism.applyDailyDecay(this.agent.name);
                } else if (action === 'convert' || action === 'convertToSynapse') {
                    this.metabolism.convertDopamineToSynapse(this.agent.name, args.amount);
                } else if (action === 'burn') {
                    this.metabolism.burnForAction(this.agent.name, args.amount, args.reason || 'manual');
                } else if (action === 'drip') {
                    this.metabolism.applyHourlyDrip(this.agent.name, this.agent.tier);
                }
                const bal = this.metabolism.getBalance(this.agent.name);
                console.log(`  Metabolism [${action}]: D=${bal.dopamine.toLocaleString()} S=${bal.synapse.toLocaleString()}`);
                break;
            }

            case 'witness': {
                const action = args.action;
                if (action === 'select') {
                    const difficulty = args.difficulty || 'medium';
                    const witnesses = this.witness.selectWitnesses(difficulty, this.agent?.name);
                    console.log(`  Witnesses selected (${difficulty}): ${witnesses.length > 0 ? witnesses.join(', ') : 'none in pool'}`);
                } else if (action === 'validate') {
                    const record = this.witness.submitValidation(
                        args.witness_id || 'self',
                        args.job_id || `job_${Date.now()}`,
                        this.agent?.name,
                        args.approved !== false,
                        args.notes || '',
                    );
                    console.log(`  Witness validation: ${record.hash.slice(0, 12)}...`);
                }
                break;
            }

            case 'memory': {
                const action = args.action;
                if (action === 'store') {
                    this.memory.store(args.key, args.data || args.value, args.tier || 'working', {
                        importance: args.importance || 0.5,
                        source: 'aether_script',
                    });
                    console.log(`  Memory stored: ${args.key} (${args.tier || 'working'})`);
                } else if (action === 'recall') {
                    const entry = this.memory.recall(args.key);
                    console.log(`  Memory recall [${args.key}]: ${entry ? JSON.stringify(entry.data) : 'not found'}`);
                } else if (action === 'search') {
                    const results = this.memory.search(args.query, args.max || 10);
                    console.log(`  Memory search: ${results.length} results`);
                } else if (action === 'forget') {
                    this.memory.forget(args.key);
                    console.log(`  Memory forgotten: ${args.key}`);
                }
                break;
            }

            case 'hire': {
                if (!this.escrow) {
                    this.escrow = new EscrowEngine(this.ledger);
                }
                const escrow = this.escrow.create(
                    args.client || 'user_default',
                    this.agent?.name || 'agent_default',
                    args.amount || 50000,
                    args.job || 'unspecified',
                );
                console.log(`  Hire: escrow ${escrow.id} created (${escrow.amount} tokens) — ${escrow.job}`);
                break;
            }

            case 'swarm': {
                if (!this.swarm) {
                    this.swarm = new SwarmCoordinator(args.strategy || 'hierarchical');
                }
                if (args.tasks) {
                    await this.swarm.dispatch(args.tasks);
                    console.log(`  Swarm: dispatched tasks`);
                } else if (args.task) {
                    await this.swarm.dispatch(args.task);
                    console.log(`  Swarm: dispatched task`);
                }
                break;
            }

            case 'evolve': {
                const action = args.action || 'check';
                if (action === 'check') {
                    const result = this.evolution.checkEvolve(this.agent?.name);
                    if (result?.evolved) {
                        this.agent.tier = result.to;
                        console.log(`  ★ Evolved: ${result.from} → ${result.to}`);
                    } else {
                        console.log(`  Evolution: not ready (tier: ${result?.tier || 'unknown'})`);
                    }
                }
                break;
            }

            default:
                throw new Error(`Unknown primitive: ${name}`);
        }
    }
}

module.exports = Interpreter;

// CLI support
if (require.main === module) {
    const fs = require('fs');
    const path = require('path');
    const filePath = process.argv[2];

    if (filePath) {
        const code = fs.readFileSync(path.resolve(filePath), 'utf8');
        const interpreter = new Interpreter();
        interpreter.run(code).catch(console.error);
    } else {
        console.log("Aether Interpreter v2.0 — Think Engine Active");
        console.log("Usage: node interpreter.js <file.aether>");
    }
}
