# Scripts

This directory contains utility scripts for the On Track Career OS project.

## Available Scripts

### `analyze-development-time.py`

Analyzes the git commit history to estimate total development time.

**Purpose**: Calculate realistic "keyboard time" by analyzing commit timestamps and filtering out breaks.

**Usage**:
```bash
python3 scripts/analyze-development-time.py
```

**Methodology**:
- Commits < 1 hour apart: Count actual time between commits
- Commits >= 1 hour apart: Consider it a break, use average dev time instead
- Provides detailed timeline and statistics

**Output**: Console report with:
- Total development time estimate
- Commit timeline with break detection
- Development efficiency metrics
- Additional insights

See `docs/DEVELOPMENT_TIME_ANALYSIS.md` for the latest analysis results.

### `cleanup-sandbox.sh`

Cleanup script for sandbox environments.

**Usage**:
```bash
./scripts/cleanup-sandbox.sh
```

## Adding New Scripts

When adding new scripts to this directory:

1. Make scripts executable: `chmod +x scripts/your-script.sh`
2. Add shebang line at the top (e.g., `#!/usr/bin/env python3` or `#!/bin/bash`)
3. Include documentation comments in the script
4. Update this README with usage instructions
5. Consider adding corresponding documentation in the `docs/` directory
