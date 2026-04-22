'use strict';

/**
 * Elixir Backend for Aether
 * Maps primitives to Elixir/OTP structures suitable for distributed swarms.
 */

function genElixir(node, indent = "") {
  if (!node) return '';

  switch (node.type) {
    case 'Program': {
      let code = "defmodule AetherAgent do\n  use GenServer\n\n";
      code += "  def start_link(opts) do\n    GenServer.start_link(__MODULE__, opts, name: __MODULE__)\n  end\n\n";
      code += "  def init(state) do\n    {:ok, state}\n  end\n\n";
      code += "  def run() do\n";
      code += node.body.map(s => genElixir(s, "    ")).join("\n");
      code += "\n  end\n";
      
      // Map primitives to handlers
      node.body.forEach(s => {
        if (s.type === 'PrimitiveCall') {
          code += `\n  def handle_cast({:${s.name}, args}, state) do\n`;
          code += `    IO.puts("Executing ${s.name} in Elixir swarm...")\n`;
          code += `    {:noreply, state}\n`;
          code += `  end\n`;
        }
      });

      code += "end\n";
      return code;
    }

    case 'PrimitiveCall': {
      const args = JSON.stringify(node.arguments)
        .replace(/{/g, "%{")
        .replace(/:/g, " => ")
        .replace(/\"([^(\")]+)\" => /g, "$1: ");
      return `${indent}GenServer.cast(__MODULE__, {:${node.name}, ${args}})`;
    }

    default:
      return `${indent}# Unhandled: ${node.type}`;
  }
}

module.exports = { genElixir };
