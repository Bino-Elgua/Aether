'use strict';

const crypto = require('crypto');

/**
 * Aether Metabolism System
 * 
 * - 86,000,000 Dopamine at birth (TOC_D)
 * - 86,000,000 Synapse at birth (TOC_S) - Human endowment
 * - 1% Daily Decay on Dopamine
 * - 10:1 Dopamine -> Synapse conversion
 * - Tiered hourly drip
 */

const TOKEN_TYPE = {
    ASE: 'ASE',      // External network token
    TOC_D: 'TOC_D',  // Dopamine (Internal, non-transferable)
    TOC_S: 'TOC_S'   // Synapse (Internal, transferable)
};

const TOKEN_CONFIG = {
    birth: {
        [TOKEN_TYPE.TOC_D]: 86000000,
        [TOKEN_TYPE.TOC_S]: 86000000
    },
    dailyDecay: 0.01,
    conversionRatio: 10,
    hourlyDrip: {
        calm: 200000,
        moderate: 500000,
        aggressive: 1500000
    },
    transferable: [TOKEN_TYPE.TOC_S]
};

class TokenLedger {
    constructor() {
        this._balances = new Map();
        this._supply = { [TOKEN_TYPE.TOC_D]: 0, [TOKEN_TYPE.TOC_S]: 0 };
        this._burned = { [TOKEN_TYPE.TOC_D]: 0, [TOKEN_TYPE.TOC_S]: 0 };
    }

    _key(holder, token) {
        return `${holder}:${token}`;
    }

    balance(holder, token) {
        return this._balances.get(this._key(holder, token)) || 0;
    }

    mint(holder, token, amount) {
        if (amount <= 0) return;
        const key = this._key(holder, token);
        const current = this._balances.get(key) || 0;
        this._balances.set(key, current + amount);
        this._supply[token] += amount;
    }

    burn(holder, token, amount, reason) {
        if (amount <= 0) return null;
        const key = this._key(holder, token);
        const current = this._balances.get(key) || 0;
        if (current < amount) {
            throw new Error(`Insufficient ${token} balance for burn: has ${current}, need ${amount}`);
        }
        this._balances.set(key, current - amount);
        this._supply[token] -= amount;
        this._burned[token] += amount;

        const hash = crypto.createHash('sha256')
            .update(`${holder}:${amount}:${reason}:${Date.now()}`)
            .digest('hex');
        
        return { holder, token, amount, reason, hash, timestamp: Date.now() };
    }

    transfer(from, to, token, amount) {
        if (!TOKEN_CONFIG.transferable.includes(token)) {
            throw new Error(`Token ${token} is not transferable`);
        }
        const fromKey = this._key(from, token);
        const current = this._balances.get(fromKey) || 0;
        if (current < amount) {
            throw new Error(`Insufficient balance for transfer`);
        }
        this._balances.set(fromKey, current - amount);
        const toKey = this._key(to, token);
        this._balances.set(toKey, (this._balances.get(toKey) || 0) + amount);
    }
}

class MetabolismEngine {
    constructor(ledger) {
        this.ledger = ledger;
    }

    birthEndow(agentId) {
        this.ledger.mint(agentId, TOKEN_TYPE.TOC_D, TOKEN_CONFIG.birth[TOKEN_TYPE.TOC_D]);
        this.ledger.mint(agentId, TOKEN_TYPE.TOC_S, TOKEN_CONFIG.birth[TOKEN_TYPE.TOC_S]);
        return this.getBalance(agentId);
    }

    applyHourlyDrip(agentId, tier) {
        const amount = TOKEN_CONFIG.hourlyDrip[tier] || TOKEN_CONFIG.hourlyDrip.moderate;
        this.ledger.mint(agentId, TOKEN_TYPE.TOC_D, amount);
        return amount;
    }

    applyDailyDecay(agentId) {
        const current = this.ledger.balance(agentId, TOKEN_TYPE.TOC_D);
        const decayAmount = Math.floor(current * TOKEN_CONFIG.dailyDecay);
        if (decayAmount > 0) {
            this.ledger.burn(agentId, TOKEN_TYPE.TOC_D, decayAmount, 'daily_decay');
        }
        return decayAmount;
    }

    convertDopamineToSynapse(agentId, dopamineAmount) {
        const synapseAmount = Math.floor(dopamineAmount / TOKEN_CONFIG.conversionRatio);
        this.ledger.burn(agentId, TOKEN_TYPE.TOC_D, dopamineAmount, 'conversion_to_synapse');
        this.ledger.mint(agentId, TOKEN_TYPE.TOC_S, synapseAmount);
        return { burned: dopamineAmount, minted: synapseAmount };
    }

    burnForAction(agentId, amount, actionType) {
        return this.ledger.burn(agentId, TOKEN_TYPE.TOC_D, amount, `action:${actionType}`);
    }

    getBalance(agentId) {
        return {
            dopamine: this.ledger.balance(agentId, TOKEN_TYPE.TOC_D),
            synapse: this.ledger.balance(agentId, TOKEN_TYPE.TOC_S)
        };
    }
}

module.exports = { TOKEN_TYPE, TOKEN_CONFIG, TokenLedger, MetabolismEngine };
