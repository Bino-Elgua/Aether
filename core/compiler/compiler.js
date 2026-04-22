'use strict';

const { genElixir } = require('./backends/elixir');
const { genGo } = require('./backends/go');
const { genRust } = require('./backends/rust');
const { genMove } = require('./backends/move');

class Compiler {
  constructor(targetLanguage = 'javascript') {
    this.targetLanguage = targetLanguage.toLowerCase();
  }

  async compile(ast) {
    if (!ast || ast.type !== 'Program') {
      throw new Error('Invalid AST provided to compiler');
    }

    switch (this.targetLanguage) {
      case 'elixir':
        return genElixir(ast);
      case 'go':
        return genGo(ast);
      case 'rust':
        return genRust(ast);
      case 'move':
        return genMove(ast);
      case 'javascript':
      case 'js':
        return this.genJavaScript(ast);
      default:
        throw new Error(`Unsupported target language: ${this.targetLanguage}`);
    }
  }

  genJavaScript(node) {
    if (!node) return '';
    
    switch (node.type) {
      case 'Program':
        return node.body.map(s => this.genJavaScript(s)).join('\n\n');
      
      case 'PrimitiveCall':
        const args = JSON.stringify(node.arguments, null, 2);
        return `await agent.${node.name}(${args});`;
      
      default:
        return `// Unknown node type: ${node.type}`;
    }
  }
}

module.exports = Compiler;
