# Aether Deployment Checklist for Testnet

1. **Move Deployment**:
   - Install `sui` CLI: `cargo install --locked --git https://github.com/MystenLabs/sui sui`
   - Navigate to `contracts/sui/`
   - Deploy: `sui move publish`
   - Store `packageId` in `config.json`.

2. **Agent Deployment**:
   - Generate identity: `node core/runtime/interpreter.js --generate-identity`
   - Fund wallet: Send test SUI to the generated address.
   - Run Job: `node core/runtime/interpreter.js examples/research-report-job.aether`

3. **Verify Job Loop**:
   - Check Sui Explorer for the `Escrow` object creation.
   - Verify witness validation transactions.
   - Verify SUI payment release upon job completion.
