'use strict';

/**
 * Rust Backend for Aether
 * Maps primitives to safe, high-performance Rust code.
 */

function genRust(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = "struct Agent {\n    name: String,\n}\n\nimpl Agent {\n";
      
      const handled = new Set();
      node.body.forEach(s => {
        if (s.type === 'PrimitiveCall' && !handled.has(s.name)) {
          code += `    fn ${s.name}(&self) {\n`;
          code += `        println!("Executing ${s.name} in Rust...");\n`;
          code += "    }\n\n";
          handled.add(s.name);
        }
      });

      code += "}\n\nfn main() {\n    let agent = Agent { name: \"nexus\".to_string() };\n";
      code += node.body.map(s => genRust(s, "    ")).join("\n");
      code += "\n}\n";
      return code;
    }

    case 'PrimitiveCall': {
      return `${indent}agent.${node.name}();`;
    }

    default:
      return `${indent}// Unhandled: ${node.type}`;
  }
}

module.exports = { genRust };
