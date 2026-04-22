'use strict';

/**
 * Move Backend for Aether
 * Maps primitives to Move smart contracts (Sui-style).
 */

function genMove(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = "module aether::agent {\n    use sui::object::{Self, UID};\n    use sui::tx_context::{Self, TxContext};\n\n";
      code += "    struct Agent has key, store {\n        id: UID,\n        name: vector<u8>,\n    }\n\n";
      
      const handled = new Set();
      node.body.forEach(s => {
        if (s.type === 'PrimitiveCall' && !handled.has(s.name)) {
          code += `    public entry fun ${s.name}(_agent: &mut Agent, _ctx: &mut TxContext) {\n`;
          code += `        // ${s.name} implementation\n`;
          code += "    }\n\n";
          handled.add(s.name);
        }
      });

      code += "}\n";
      return code;
    }

    case 'PrimitiveCall': {
      return `${indent}// Call ${node.name}`;
    }

    default:
      return `${indent}// Unhandled: ${node.type}`;
  }
}

module.exports = { genMove };
