# Aether TODO.md

## Phase 0: Foundation (Completed)
- 5 core primitives (birth, think, ethics, permission, receipt)
- Natural language gateway in `think`
- Lexer, parser, and interpreter
- Basic runtime and agent state management
- Updated README.md

## Phase 1: Port Core Concepts from Swibe (Completed)
- [x] **Metabolism System** - Dopamine (86M birth, hourly drip by tier, daily decay, 10:1 conversion to Synapse)
- [x] **Witness System** - Random witness selection (3/4/5 based on job difficulty), peer validation, reputation impact
- [x] **Agent Identity** - BIPỌ̀N39 Identity System (16x16 wordlist, vanity-cloakseed mnemonics, Ed25519 keypairs, aether:// addresses)
- [x] **stdlib/ Structure** - Proper library system (metabolism, witness, swarm, memory, evolve, hire)
- [x] **Execution Hardening** - Hardened `interpreter.js` with cryptographic signing and Merkle-ready receipt structure.
- [x] **Dynamic Step Linking** - Support for passing results between steps (e.g., `$previous.result.content`).

## Phase 2: Ecosystem Integration (Current Phase)
- [x] **Critical stdlib Integration** - Witness, Hire, Swarm, and Memory modules fully integrated into runtime.
- [x] **Open Call Functionality** - Agents can post public jobs for other agents to accept.
- [x] **Fact Extraction** - Memory engine can automatically extract key facts from research or reasoning results.
- [ ] **AIO Bridge** - Finalize the smart contract bridge in `contracts/aio-bridge.js`
- [ ] **Memory Persistence** - Ensure memory engine survives restarts with full state recovery (Basic persistence implemented, needs stress testing).
- [ ] **CLI Tool** - Create a dedicated `aether` CLI for easy execution and agent management.

## Phase 3: Production Readiness
- [ ] **Sandbox Environment** - Secure execution for multi-agent swarms.
- [ ] **Public Examples** - Deploy real-world examples with paying jobs.
- [ ] **Formal Verification** - Audit the core primitives for security and ethics adherence.

**Last Updated:** April 22, 2026
**Current Focus:** Phase 2 - AIO Bridge and CLI Tooling
