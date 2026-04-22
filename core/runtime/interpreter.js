const Lexer = require('./lexer');
const Parser = require('./parser');
const Gateway = require('./gateway');

class Interpreter {
    constructor() {
        this.agent = null;
        this.ethics = {};
        this.permissions = {};
        this.gateway = new Gateway();
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
            case 'birth':
                this.agent = {
                    name: args.name,
                    tier: args.tier,
                    budget: args.budget,
                    dopamine: 86000000
                };
                console.log(`  Agent born: ${this.agent.name} (${this.agent.tier} tier)`);
                break;

            case 'ethics':
                this.ethics = args;
                console.log(`  Ethics set: ${JSON.stringify(this.ethics)}`);
                break;

            case 'permission':
                this.permissions = args;
                console.log(`  Permissions set: ${JSON.stringify(this.permissions)}`);
                break;

            case 'think':
                const nlPrompt = args.prompt;
                if (nlPrompt.length > 0) {
                    const translatedCode = await this.gateway.translate(nlPrompt);
                    if (translatedCode !== `think "${nlPrompt}"`) {
                        console.log(`  Gateway translated NL to code. Recursing...`);
                        await this.run(translatedCode);
                    } else {
                        console.log(`  Thought: ${nlPrompt}`);
                    }
                }
                break;

            case 'receipt':
                console.log(`  Receipt generated: [${args.type}] Proof: ${args.proof}`);
                break;

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
        console.log("Aether Interpreter v1.0");
        console.log("Usage: node interpreter.js <file.aether>");
    }
}
