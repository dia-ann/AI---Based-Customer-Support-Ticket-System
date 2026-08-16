## Git hooks setup

This repo uses a versioned pre-push hook to block pushes to `main`. After cloning, run this once:
```bash
git config core.hooksPath .githooks
```