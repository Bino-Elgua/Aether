class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.cursor = 0;
    }

    parse() {
        const statements = [];
        while (this.cursor < this.tokens.length) {
            statements.push(this.parseStatement());
        }
        return { type: 'Program', body: statements };
    }

    parseStatement() {
        const token = this.peek();
        if (token.type !== 'IDENTIFIER') {
            throw new Error(`Expected identifier, got ${token.type}`);
        }

        const primitive = token.value;
        this.advance();

        // Handle 'think' with direct string (NL gateway)
        if (primitive === 'think' && this.peek().type === 'STRING') {
            const prompt = this.advance().value;
            return { type: 'PrimitiveCall', name: 'think', arguments: { prompt } };
        }

        // Handle block-based primitives
        if (this.peek().type === 'LBRACE') {
            const args = this.parseObject();
            return { type: 'PrimitiveCall', name: primitive, arguments: args };
        }

        throw new Error(`Unexpected token after ${primitive}: ${this.peek().type}`);
    }

    parseObject() {
        this.expect('LBRACE');
        const obj = {};
        while (this.peek().type !== 'RBRACE') {
            const key = this.expect('IDENTIFIER').value;
            this.expect('COLON');
            const value = this.parseValue();
            obj[key] = value;
            if (this.peek().type === 'COMMA') this.advance();
        }
        this.expect('RBRACE');
        return obj;
    }

    parseValue() {
        const token = this.peek();
        if (token.type === 'LBRACE') {
            return this.parseObject();
        }
        if (token.type === 'LBRACKET') {
            return this.parseArray();
        }
        this.advance();
        if (['STRING', 'NUMBER', 'BOOLEAN'].includes(token.type)) {
            return token.value;
        }
        throw new Error(`Unexpected value type: ${token.type}`);
    }

    parseArray() {
        this.expect('LBRACKET');
        const arr = [];
        while (this.peek().type !== 'RBRACKET') {
            arr.push(this.parseValue());
            if (this.peek().type === 'COMMA') this.advance();
        }
        this.expect('RBRACKET');
        return arr;
    }

    peek() {
        return this.tokens[this.cursor] || { type: 'EOF' };
    }

    advance() {
        return this.tokens[this.cursor++];
    }

    expect(type) {
        const token = this.advance();
        if (token.type !== type) {
            throw new Error(`Expected ${type}, got ${token.type}`);
        }
        return token;
    }
}

module.exports = Parser;
