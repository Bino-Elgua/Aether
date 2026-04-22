# Deployment Guide for Aether Testnet

1. **Prerequisites**:
   - Install `sui` CLI
   - Set up an Aether-compatible wallet (BIPỌ̀N39)

2. **Deploy Move Contracts**:
   ```bash
   cd contracts/sui
   sui move publish
   ```
   *Note: Save the `packageId` and `configObjectId` from the output.*

3. **Configure Interpreter**:
   Update `config.json` with the published `packageId`.

4. **Launch Agent**:
   ```bash
   node core/runtime/interpreter.js examples/research-report-job.aether
   ```

5. **Security Audit**:
   - The system is audited against common injection patterns.
   - Run `npm test` before any deployment.
