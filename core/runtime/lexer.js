class Lexer {
    constructor(input) {
        this.input = input;
        this.tokens = [];
        this.cursor = 0;
    }

    tokenize() {
        const tokenSpecs = [
            [/^\s+/, null], // Whitespace
            [/^\{/, 'LBRACE'],
            [/^\}/, 'RBRACE'],
            [/^:/, 'COLON'],
            [/^,/, 'COMMA'],
            [/^\[/, 'LBRACKET'],
            [/^\]/, 'RBRACKET'],
            [/^"(?:[^"\\]|\\.)*"/, 'STRING'],
            [/^[0-9]+(?:\.[0-9]+)?/, 'NUMBER'],
            [/^(?:true|false)/, 'BOOLEAN'],
            [/^[a-zA-Z_][a-zA-Z0-9_]*/, 'IDENTIFIER']
        ];

        while (this.cursor < this.input.length) {
            let matched = false;
            const remainingInput = this.input.slice(this.cursor);

            for (const [regex, type] of tokenSpecs) {
                const match = regex.exec(remainingInput);
                if (match) {
                    if (type) {
                        let value = match[0];
                        if (type === 'STRING') value = value.slice(1, -1);
                        if (type === 'NUMBER') value = parseFloat(value);
                        if (type === 'BOOLEAN') value = value === 'true';
                        this.tokens.push({ type, value });
                    }
                    this.cursor += match[0].length;
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                throw new Error(`Unexpected character at position ${this.cursor}: ${this.input[this.cursor]}`);
            }
        }
        return this.tokens;
    }
}

module.exports = Lexer;
