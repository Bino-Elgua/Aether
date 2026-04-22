const crypto = require('crypto');

const TOKEN_TYPE = {
    ASE: 'ASE',
    TOC_D: 'TOC_D',
    TOC_S: 'TOC_S'
};

const TOKEN_CONFIG = {
    birth: {
        [TOKEN_TYPE.TOC_D]: 86_000_000_000,
        [TOKEN_TYPE.TOC_S]: 86_000_000
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

const VALID_MINT_SOURCES = ['vm_birth', 'vm_conversion'];

class TokenLedger {
    constructor() {
        this._balances = new Map();
        this._supply = { [TOKEN_TYPE.TOC_D]: 0, [TOKEN_TYPE.TOC_S]: 0 };
        this._burned = { [TOKEN_TYPE.TOC_D]: 0, [TOKEN_TYPE.TOC_S]: 0 };
        this._burnReceipts = [];
    }

    _key(holder, token) {
        return `${holder}:${token}`;
    }

    balance(holder, token) {
        return this._balances.get(this._key(holder, token)) || 0;
    }

    mint(holder, token, amount, source) {
        if (!VALID_MINT_SOURCES.includes(source)) {
            throw new Error(`Invalid mint source: ${source}. Must be one of: ${VALID_MINT_SOURCES.join(', ')}`);
        }
        if (amount <= 0) {
            throw new Error('Mint amount must be positive');
        }
        const key = this._key(holder, token);
        const current = this._balances.get(key) || 0;
        this._balances.set(key, current + amount);
        this._supply[token] = (this._supply[token] || 0) + amount;
    }

    burn(holder, token, amount, reason, receiptHash) {
        if (amount <= 0) {
            throw new Error('Burn amount must be positive');
        }
        const key = this._key(holder, token);
        const current = this._balances.get(key) || 0;
        if (current < amount) {
            throw new Error(`Insufficient ${token} balance: has ${current}, tried to burn ${amount}`);
        }
        this._balances.set(key, current - amount);
        this._supply[token] -= amount;
        this._burned[token] = (this._burned[token] || 0) + amount;

        if (token === TOKEN_TYPE.TOC_D) {
            const hash = receiptHash || crypto.createHash('sha256')
                .update(`${holder}:${amount}:${reason}:${Date.now()}`)
                .digest('hex');
            const receipt = { holder, token, amount, reason, hash, timestamp: Date.now() };
            this._burnReceipts.push(receipt);
            return receipt;
        }
    }

    transfer(from, to, token, amount) {
        if (!TOKEN_CONFIG.transferable.includes(token)) {
            throw new Error(`Token ${token} is not transferable`);
        }
        if (amount <= 0) {
            throw new Error('Transfer amount must be positive');
        }
        const fromKey = this._key(from, token);
        const current = this._balances.get(fromKey) || 0;
        if (current < amount) {
            throw new Error(`Insufficient ${token} balance: has ${current}, tried to transfer ${amount}`);
        }
        this._balances.set(fromKey, current - amount);
        const toKey = this._key(to, token);
        this._balances.set(toKey, (this._balances.get(toKey) || 0) + amount);
    }

    getSupply() {
        return { ...this._supply };
    }

    getBurned() {
        return { ...this._burned };
    }
}

class MetabolismEngine {
    constructor(ledger) {
        this.ledger = ledger;
    }

    birthEndow(agentId) {
        this.ledger.mint(agentId, TOKEN_TYPE.TOC_D, TOKEN_CONFIG.birth[TOKEN_TYPE.TOC_D], 'vm_birth');
        this.ledger.mint(agentId, TOKEN_TYPE.TOC_S, TOKEN_CONFIG.birth[TOKEN_TYPE.TOC_S], 'vm_birth');
        return this.getBalance(agentId);
    }

    applyHourlyDrip(agentId, tier) {
        const amount = TOKEN_CONFIG.hourlyDrip[tier];
        if (amount === undefined) {
            throw new Error(`Unknown drip tier: ${tier}. Must be one of: ${Object.keys(TOKEN_CONFIG.hourlyDrip).join(', ')}`);
        }
        this.ledger.mint(agentId, TOKEN_TYPE.TOC_D, amount, 'vm_conversion');
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
        if (dopamineAmount <= 0) {
            throw new Error('Conversion amount must be positive');
        }
        const synapseAmount = Math.floor(dopamineAmount / TOKEN_CONFIG.conversionRatio);
        if (synapseAmount <= 0) {
            throw new Error(`Dopamine amount ${dopamineAmount} too small for ${TOKEN_CONFIG.conversionRatio}:1 conversion`);
        }
        this.ledger.burn(agentId, TOKEN_TYPE.TOC_D, dopamineAmount, 'conversion_to_synapse');
        this.ledger.mint(agentId, TOKEN_TYPE.TOC_S, synapseAmount, 'vm_conversion');
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
