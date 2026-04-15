# AGENTS.md

## Cursor Cloud specific instructions

### Repository status

This is a greenfield repository for **PolicyPen** — an AI-powered legal document generator. As of initial setup, the repo contains only `README.md` and `LICENSE` (Apache 2.0). No application code, dependencies, build system, or tests exist yet.

### Available tooling on the VM

- **Node.js** v22 (via nvm), with `npm`, `pnpm`, and `yarn` available
- **Python** 3.12

### What to do when application code is added

Once code is committed, the update script (set via `SetupVmEnvironment`) should be updated to install dependencies (e.g. `npm install`, `pnpm install`, or `pip install -r requirements.txt`) matching the chosen package manager and lockfile. Until then the update script is a no-op `echo` command.

### Lint / Test / Build / Run

No commands are available yet — they will be defined in `package.json` (or equivalent) once application code is added. See `README.md` for the product concept.
