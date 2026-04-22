'use strict';

/**
 * Go Backend for Aether
 * Maps primitives to high-performance Go structures.
 */

function genGo(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = "package main\n\nimport (\n\t\"fmt\"\n)\n\ntype Agent struct {\n\tName string\n}\n\n";
      
      // Handlers
      const handled = new Set();
      node.body.forEach(s => {
        if (s.type === 'PrimitiveCall' && !handled.has(s.name)) {
          code += `func (a *Agent) ${s.name.charAt(0).toUpperCase() + s.name.slice(1)}(args map[string]interface{}) {\n`;
          code += `\tfmt.Printf("Executing ${s.name} in Go...\\n")\n`;
          code += "}\n\n";
          handled.add(s.name);
        }
      });

      code += "func main() {\n\tagent := &Agent{Name: \"nexus\"}\n";
      code += node.body.map(s => genGo(s, "\t")).join("\n");
      code += "\n}\n";
      return code;
    }

    case 'PrimitiveCall': {
      return `${indent}agent.${node.name.charAt(0).toUpperCase() + node.name.slice(1)}(map[string]interface{}{})`;
    }

    default:
      return `${indent}// Unhandled: ${node.type}`;
  }
}

module.exports = { genGo };
