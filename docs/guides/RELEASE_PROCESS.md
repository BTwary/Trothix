# Release Process Checklist

Every release must follow this checklist:

---

## 1. Local Verification
- [ ] Run `npm run verify` locally and verify all checks pass.
- [ ] Ensure all 15 regression cases pass.
- [ ] Verify F1 score exceeds 90.0% and latency is within limits.

## 2. Release Artifacts Archiving
Every release archives:
- Current evaluation JSON report.
- Current baseline benchmark outputs.
- Current active rule diagnostics list.

## 3. Changelog and Version Bump
- [ ] Document all updates in `CHANGELOG.md`.
- [ ] Bump version in `package.json`.
