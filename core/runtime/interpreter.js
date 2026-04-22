'use strict';

const Lexer = require('./lexer');
const Parser = require('./parser');
const Gateway = require('./gateway');
const { MetabolismEngine, TokenLedger, TOKEN_TYPE } = require('../../stdlib/metabolism');
const { WitnessEngine } = require('../../stdlib/witness');
const { generateAgentIdentity, deriveCapabilities, signMessage } = require('../../stdlib/identity');
const { MemoryEngine } = require('../../stdlib/memory');
const { EscrowEngine } = require('../../stdlib/hire');
const { SwarmCoordinator } = require('../../stdlib/swarm');
const { EvolutionEngine } = require('../../stdlib/evolve');
const crypto = require('crypto');
const path = require('path');
const os = require('os');

class Interpreter {
    constructor(config = {}) {
        this.agent = null;
        this.ethics = {
            harm_none: true,
            accuracy: "high"
        };
        this.permissions = {
            spend: "ask",
            external: "ask",
            hire: "ask"
        };
        this.ledger = new TokenLedger();
        this.metabolism = new MetabolismEngine(this.ledger);
        this.witness = new WitnessEngine();
        this.memory = new MemoryEngine({ 
            vault_path: path.join(os.homedir(), '.aether', 'memory') 
        });
        this.escrow = new EscrowEngine(this.ledger);
        this.swarm = null;
        this.evolution = new EvolutionEngine();
        this._thinkConfig = config.think || {};

        this.gateway = new Gateway(this);
        this.executionHistory = [];
    }

    /**
     * Entry point for running Aether code strings.
     */
    async run(code) {
        try {
            const lexer = new Lexer(code);
            const tokens = lexer.tokenize();
            const parser = new Parser(tokens);
            const program = parser.parse();

            for (const statement of program.body) {
                await this.execute(statement);
            }
        } catch (err) {
            console.error(`[Runtime Error] ${err.message}`);
            throw err;
        }
    }

    /**
     * Executes a single Aether primitive or stdlib call.
     */
    async execute(node) {
        const { name, arguments: args } = node;

        // 1. Validation & Pre-execution Checks
        this._validateExecution(name, args);

        try {
            switch (name) {
                case 'birth': await this._handleBirth(args); break;
                case 'ethics': this._handleEthics(args); break;
                case 'permission': this._handlePermission(args); break;
                case 'think': await this._handleThink(args); break;
                case 'receipt': await this._handleReceipt(args); break;
                case 'metabolism': await this._handleMetabolism(args); break;
                case 'witness': await this._handleWitness(args); break;
                case 'identity': await this._handleIdentity(args); break;
                case 'memory': await this._handleMemory(args); break;
                case 'hire': await this._handleHire(args); break;
                case 'swarm': await this._handleSwarm(args); break;
                case 'evolve': await this._handleEvolve(args); break;
                default:
                    throw new Error(`Unknown primitive: ${name}`);
            }
        } catch (err) {
            console.log(`  ✗ ${name} failed: ${err.message}`);
            throw err;
        }
    }

    // ──────────────── INTERNAL HANDLERS ────────────────

    _validateExecution(name, args) {
        // Ethics Check: harm_none
        if (this.ethics.harm_none && (name === 'hire' || name === 'swarm')) {
            // Placeholder for deeper behavioral validation
        }

        // Permission Check: spend
        if (name === 'metabolism' && (args.action === 'burn' || args.action === 'convert')) {
            if (this.permissions.spend === 'deny') {
                throw new Error("Permission Denied: Spending is disabled.");
            }
        }

        // Agent Existence Check
        const requiresAgent = !['birth', 'ethics', 'permission', 'identity', 'receipt', 'think'].includes(name);
        if (requiresAgent && !this.agent) {
            throw new Error(`Execution Blocked: '${name}' requires a born agent. Call 'birth' first.`);
        }
    }

    async _handleBirth(args) {
        this.agent = {
            name: args.name,
            tier: args.tier || 'moderate',
            budget: args.budget || 86000000,
        };
        
        // Setup stdlib states
        this.metabolism.birthEndow(args.name);
        
        // BIPỌ̀N39 Identity Generation
        const identity = await generateAgentIdentity(args.passphrase || '');
        this.agent.identity = identity;
        this.agent.wallet = identity.address;
        this.agent.capabilities = deriveCapabilities(identity.oduArchetype, identity.elements);
        
        this.witness.registerAgent(args.name, args.tier || 'moderate', 100, 5000); // 5000 Synapse initial stake
        this.evolution.register(args.name, args.tier || 'calm');
        
        const bal = this.metabolism.getBalance(args.name);
        console.log(`[Executing] birth...`);
        console.log(`  Agent born: ${args.name} (${this.agent.tier} tier)`);
        console.log(`  Mnemonic: ${identity.mnemonic}`);
        console.log(`  Wallet: ${identity.address}`);
        console.log(`  Dominant Element: ${identity.dominantElement}`);
        console.log(`  Dopamine: ${bal.dopamine.toLocaleString()} (86M Birth Endowment)`);
    }

    _handleEthics(args) {
        this.ethics = { ...this.ethics, ...args };
        console.log(`[Executing] ethics...`);
        console.log(`  Rules updated: ${Object.keys(args).join(', ')}`);
    }

    _handlePermission(args) {
        this.permissions = { ...this.permissions, ...args };
        console.log(`[Executing] permission...`);
        console.log(`  Access updated: ${Object.keys(args).join(', ')}`);
    }

    async _handleThink(args) {
        const nlPrompt = args.prompt;
        if (!nlPrompt) return;

        console.log(`[Executing] think: "${nlPrompt}"`);
        
        // Pass to Think Engine via Gateway
        const result = await this.gateway.process(nlPrompt);
        
        // Auto-Receipt generation for the entire think plan
        if (result && result.plan) {
            await this.execute({
                name: 'receipt',
                arguments: {
                    type: 'think_completion',
                    proof: true,
                    traceId: result.traceId,
                    steps: result.plan.steps.length,
                    results: result.results
                }
            });
        }
    }

    async _handleReceipt(args) {
        const receiptData = {
            agent: this.agent?.name || 'anonymous',
            type: args.type,
            traceId: args.traceId,
            timestamp: Date.now(),
            steps: args.steps || 0,
            merkleRoot: args.merkleRoot || crypto.randomBytes(32).toString('hex')
        };

        const dataStr = JSON.stringify(receiptData);
        let signature = 'unsigned';
        
        if (this.agent?.identity?.privateKey) {
            signature = signMessage(this.agent.identity.privateKey, dataStr).toString('hex');
        }

        const receiptHash = crypto.createHash('sha256').update(dataStr + signature).digest('hex');
        
        console.log(`[Executing] receipt...`);
        console.log(`  Seal: [${args.type}] ${receiptHash.slice(0, 16)}...`);
        if (signature !== 'unsigned') {
            console.log(`  Signed by Agent: ${this.agent.name}`);
            console.log(`  Signature: ${signature.slice(0, 24)}...`);
        }
        
        // Log receipt to history
        this.executionHistory.push({ ...receiptData, hash: receiptHash, signature });
        
        return { hash: receiptHash, signature };
    }

    async _handleMetabolism(args) {
        const { action, amount, reason } = args;
        const agentName = this.agent.name;

        console.log(`[Executing] metabolism.${action}...`);
        switch (action) {
            case 'birth_endow':
                this.metabolism.birthEndow(agentName);
                break;
            case 'burn':
                this.metabolism.burnForAction(agentName, amount || 1000, reason || 'execution');
                break;
            case 'convert':
                this.metabolism.convertDopamineToSynapse(agentName, amount || 100000);
                break;
            case 'drip':
                this.metabolism.applyHourlyDrip(agentName, this.agent.tier);
                break;
            case 'decay':
                this.metabolism.applyDailyDecay(agentName);
                break;
            case 'get_balance':
            case 'balance':
                break; // Just reporting below
            default:
                throw new Error(`Unknown metabolism action: ${action}`);
        }

        const bal = this.metabolism.getBalance(agentName);
        console.log(`  Balance: ${bal.dopamine.toLocaleString()} D | ${bal.synapse.toLocaleString()} S`);
        return bal;
    }

    async _handleWitness(args) {
        const { action, difficulty, jobId, witnessId, approved, notes } = args;
        console.log(`[Executing] witness.${action}...`);
        
        switch (action) {
            case 'select':
                const witnesses = this.witness.selectWitnesses(difficulty || 'medium', this.agent.name);
                console.log(`  Selected: ${witnesses.join(', ')}`);
                return witnesses;
            case 'validate':
                const record = this.witness.submitValidation(
                    witnessId || 'self',
                    jobId || `job_${Date.now()}`,
                    this.agent.name,
                    approved !== false,
                    notes || ''
                );
                console.log(`  Validation: ${record.hash.slice(0, 12)}...`);
                return record;
            case 'tally':
                const tally = this.witness.tallyVotes(jobId);
                console.log(`  Tally: ${tally.votes.for}/${tally.total} approved`);
                return tally;
            default:
                throw new Error(`Unknown witness action: ${action}`);
        }
    }

    async _handleIdentity(args) {
        console.log(`[Executing] identity.generate...`);
        const identity = await generateAgentIdentity(args.passphrase || '');
        console.log(`  New Identity: ${identity.address}`);
        console.log(`  Mnemonic: ${identity.mnemonic}`);
        return identity;
    }

    async _handleMemory(args) {
        const { action, key, data, tier, query, max, text, source } = args;
        console.log(`[Executing] memory.${action}...`);

        switch (action) {
            case 'store':
            case 'store_result':
                const storageData = typeof data === 'string' ? data : JSON.stringify(data || {});
                this.memory.store(key, storageData, tier || 'short_term', { source: 'runtime' });
                console.log(`  Stored: ${key}`);
                break;
            case 'recall':
                const entry = this.memory.recall(key);
                console.log(`  Recall: ${entry ? 'hit' : 'miss'}`);
                return entry;
            case 'search':
                const results = this.memory.search(query, max || 5);
                console.log(`  Search: ${results.length} results`);
                return results;
            case 'forget':
                this.memory.forget(key);
                console.log(`  Forgotten: ${key}`);
                break;
            case 'extract_facts':
                const facts = this.memory.extractFacts(text, source || 'runtime');
                console.log(`  Extracted: ${facts.length} facts`);
                return facts;
            case 'stats':
                const stats = this.memory.stats();
                console.log(`  Stats: ${stats.working + stats.short_term + stats.long_term} entries`);
                return stats;
            default:
                throw new Error(`Unknown memory action: ${action}`);
        }
    }

    async _handleHire(args) {
        const { action, amount, job, escrowId, clientId, callId } = args;
        console.log(`[Executing] hire.${action}...`);

        switch (action) {
            case 'create_escrow':
                const escrow = this.escrow.create(
                    clientId || 'user',
                    this.agent.name,
                    amount || 50000,
                    job || 'task'
                );
                console.log(`  Escrow: ${escrow.id} (${escrow.amount} S)`);
                return escrow;
            case 'post_open_call':
                const call = this.escrow.postOpenCall(
                    clientId || 'user',
                    amount || 50000,
                    job || 'open task'
                );
                console.log(`  Open Call: ${call.id} posted`);
                return call;
            case 'accept_open_call':
                const newEscrow = this.escrow.acceptOpenCall(callId, this.agent.name);
                console.log(`  Accepted: ${callId} -> ${newEscrow.id}`);
                return newEscrow;
            case 'release':
                const released = this.escrow.release(escrowId);
                console.log(`  Released: ${escrowId}`);
                return released;
            default:
                throw new Error(`Unknown hire action: ${action}`);
        }
    }

    async _handleSwarm(args) {
        const { action, strategy, agentCount, task, taskId, agentId, result } = args;
        console.log(`[Executing] swarm.${action}...`);

        if (!this.swarm) this.swarm = new SwarmCoordinator(strategy || 'hierarchical', this);

        switch (action) {
            case 'setup':
                for (let i = 0; i < (agentCount || 2); i++) {
                    this.swarm.addAgent(`agent_${i}`, i === 0 ? 'lead' : 'worker');
                }
                console.log(`  Swarm ready: ${agentCount || 2} agents`);
                break;
            case 'dispatch':
            case 'coordinate':
                const record = await this.swarm.dispatch(task || 'coordinated task');
                console.log(`  Dispatched: ${record.id}`);
                return record;
            case 'submit_result':
                this.swarm.submitResult(taskId, agentId || this.agent.name, result);
                console.log(`  Submitted: ${taskId} by ${agentId || this.agent.name}`);
                break;
            case 'resolve':
                const resolution = this.swarm.resolve(taskId);
                console.log(`  Resolved: ${taskId}`);
                return resolution;
            default:
                throw new Error(`Unknown swarm action: ${action}`);
        }
    }

    async _handleEvolve(args) {
        const { action } = args;
        console.log(`[Executing] evolve.${action}...`);

        switch (action) {
            case 'check':
                const result = this.evolution.checkEvolve(this.agent.name);
                if (result?.evolved) {
                    this.agent.tier = result.to;
                    console.log(`  ★ EVOLVED: ${result.from} → ${result.to}`);
                } else {
                    console.log(`  Status: Not ready (Current: ${this.agent.tier})`);
                }
                return result;
            case 'get_status':
                const status = this.evolution.getAgent(this.agent.name);
                console.log(`  Reputation: ${status?.reputation.toFixed(2)}`);
                return status;
            default:
                throw new Error(`Unknown evolve action: ${action}`);
        }
    }
}

module.exports = Interpreter;

if (require.main === module) {
    const fs = require('fs');
    const filePath = process.argv[2];
    if (filePath) {
        const code = fs.readFileSync(path.resolve(filePath), 'utf8');
        const interpreter = new Interpreter();
        interpreter.run(code).catch(e => process.exit(1));
    } else {
        console.log("Aether Runtime v2.2 — Hardened BIPỌ̀N39 Identity & Metabolism");
        console.log("Usage: node interpreter.js <file.aether>");
    }
}
