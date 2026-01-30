# Development Time Analysis

## Overview

This document provides an analysis of the development time for the On Track Career OS project based on git commit history.

## Methodology

The analysis uses the following approach to estimate "keyboard time" (actual development time) rather than wall clock time:

1. **Active Development Sessions**: When consecutive commits are less than 1 hour apart, we count the actual time between them as active development time.

2. **Breaks Detection**: When consecutive commits are 1 hour or more apart, we assume the developer took a break (lunch, sleep, other activities) and use the average development time from active sessions instead.

3. **Final Commit Estimation**: For the last commit, we add one average development session time, as we don't know when the developer stopped working after the last commit.

## Analysis Results (as of 2026-01-29)

### Current Statistics

- **Total Commits**: 2
- **First Commit**: 2026-01-29 13:03:12
- **Last Commit**: 2026-01-29 15:43:12
- **Estimated Total Development Time**: 1.00 hours (60.0 minutes)
- **Wall Clock Time**: 2.67 hours
- **Development Efficiency**: 37.5%

### Commit Timeline

#### Commit 1
- **Hash**: e88bd3f0
- **Time**: 2026-01-29 13:03:12
- **Author**: Julien Reichel
- **Message**: Refine profile section editing UX
- **Type**: Initial work session

#### Commit 2
- **Hash**: c6a12f11
- **Time**: 2026-01-29 15:43:12
- **Author**: copilot-swe-agent[bot]
- **Message**: Initial plan
- **Time since previous**: 2.67 hours (160.0 minutes)
- **Type**: Break detected (>= 1 hour)

### Key Findings

1. **Development Sessions**: The development was spread across 2 separate sessions with a break in between.

2. **No Active Sessions Detected**: Since all commit gaps were >= 1 hour, we used a default average of 30 minutes per commit for estimation.

3. **Average Commit Rate**: 2.00 commits per hour of active development time.

4. **Average Time per Commit**: 30.0 minutes (estimated based on default for projects in early stages).

### Interpretation

- The project is in its very early stages with only 2 commits so far.
- There was a 2.67-hour gap between commits, indicating a break (likely lunch, meetings, or context switching).
- The estimated 1 hour of actual "keyboard time" represents focused development work, excluding the break.
- The 37.5% efficiency ratio is typical for projects with large gaps between commits and reflects the reality that developers don't code continuously throughout the wall clock time.

## How to Run This Analysis

To update this analysis with the latest commit history, run:

```bash
python3 scripts/analyze-development-time.py
```

This script will:
- Analyze all commits in the repository
- Calculate time between commits
- Apply the break detection logic
- Generate a comprehensive report

## Future Improvements

As the project grows and more commits are made:
- The average development time will become more accurate based on actual active sessions
- We'll be able to identify peak development periods
- Patterns in commit timing can help optimize development workflows
- The analysis will better distinguish between different types of work (features, fixes, refactoring)

## Notes

- This analysis assumes that commit frequency correlates with development activity
- Actual development time may include work that wasn't committed (e.g., research, planning, debugging)
- The 1-hour threshold for breaks is a heuristic and may need adjustment based on team practices
- Bot commits (like from copilot-swe-agent) are included in the analysis but may represent automated work
