#!/usr/bin/env python3
"""
Analyze git commit history to determine total development time.

Rules:
- If time between commits < 1 hour: count as actual dev time
- If time between commits >= 1 hour: consider it a break, use average dev time instead

Usage:
    python3 scripts/analyze-development-time.py

This script analyzes the git history of the current repository to estimate
the total development time, filtering out breaks and using statistical methods
to provide a realistic estimate of "keyboard time".
"""

import subprocess
import sys
from datetime import datetime
from typing import List, Tuple
import os

def get_git_commits(repo_path: str = '.') -> List[Tuple[str, datetime, str, str]]:
    """Get all commits with timestamp, hash, author, and message."""
    result = subprocess.run(
        ['git', 'log', '--all', '--pretty=format:%H|%ai|%an|%s', '--reverse'],
        capture_output=True,
        text=True,
        cwd=repo_path
    )
    
    commits = []
    for line in result.stdout.strip().split('\n'):
        if not line:
            continue
        parts = line.split('|', 3)
        commit_hash = parts[0]
        timestamp_str = parts[1]
        author = parts[2]
        message = parts[3]
        
        # Parse timestamp (format: 2026-01-29 13:03:12 +0100)
        timestamp = datetime.strptime(timestamp_str[:19], '%Y-%m-%d %H:%M:%S')
        commits.append((commit_hash, timestamp, author, message))
    
    return commits

def analyze_development_time(commits: List[Tuple[str, datetime, str, str]]) -> None:
    """Analyze development time based on commit timestamps."""
    if len(commits) < 2:
        print("Not enough commits to analyze (need at least 2)")
        print(f"Found {len(commits)} commit(s)")
        if len(commits) == 1:
            print("\nWith only one commit, we'll estimate 30 minutes of development time.")
            print("Total estimated development time: 0.50 hours (30.0 minutes)")
        return
    
    print("=" * 80)
    print("GIT COMMIT HISTORY ANALYSIS")
    print("=" * 80)
    print(f"\nTotal commits: {len(commits)}")
    print(f"First commit: {commits[0][1].strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Last commit: {commits[-1][1].strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Calculate time differences between consecutive commits
    time_deltas = []
    active_sessions = []
    
    print("\n" + "=" * 80)
    print("COMMIT TIMELINE")
    print("=" * 80)
    
    for i, (commit_hash, timestamp, author, message) in enumerate(commits):
        print(f"\nCommit {i+1}:")
        print(f"  Hash: {commit_hash[:8]}")
        print(f"  Time: {timestamp.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"  Author: {author}")
        print(f"  Message: {message}")
        
        if i > 0:
            prev_timestamp = commits[i-1][1]
            delta = timestamp - prev_timestamp
            delta_seconds = delta.total_seconds()
            delta_hours = delta_seconds / 3600
            delta_minutes = delta_seconds / 60
            
            time_deltas.append(delta_seconds)
            
            print(f"  Time since previous commit: {delta_hours:.2f} hours ({delta_minutes:.1f} minutes)")
            
            if delta_hours < 1:
                print(f"  → Active development session (< 1 hour)")
                active_sessions.append(delta_seconds)
            else:
                print(f"  → Break detected (>= 1 hour) - will use average dev time")
    
    # Calculate statistics
    print("\n" + "=" * 80)
    print("DEVELOPMENT TIME ANALYSIS")
    print("=" * 80)
    
    if not active_sessions:
        print("\nNo active development sessions detected (all gaps >= 1 hour)")
        print("Using a default average of 30 minutes per commit")
        avg_dev_time = 30 * 60  # 30 minutes in seconds
    else:
        avg_dev_time = sum(active_sessions) / len(active_sessions)
        print(f"\nActive development sessions: {len(active_sessions)}")
        print(f"Average time per active session: {avg_dev_time/60:.1f} minutes ({avg_dev_time/3600:.2f} hours)")
    
    # Calculate total development time
    total_dev_time = 0
    break_count = 0
    
    for i, delta in enumerate(time_deltas):
        delta_hours = delta / 3600
        if delta_hours < 1:
            # Actual development time
            total_dev_time += delta
        else:
            # Break - use average
            total_dev_time += avg_dev_time
            break_count += 1
    
    # Add average time for the last commit (assume average dev time for final commit)
    total_dev_time += avg_dev_time
    
    total_hours = total_dev_time / 3600
    total_minutes = total_dev_time / 60
    
    print(f"\nBreaks detected: {break_count}")
    print(f"Average dev time applied to breaks: {avg_dev_time/60:.1f} minutes")
    
    print("\n" + "=" * 80)
    print("TOTAL DEVELOPMENT TIME")
    print("=" * 80)
    print(f"\nEstimated total development time: {total_hours:.2f} hours ({total_minutes:.1f} minutes)")
    print(f"Breakdown:")
    print(f"  - Number of commits: {len(commits)}")
    print(f"  - Active development sessions: {len(active_sessions)}")
    print(f"  - Breaks where average was applied: {break_count + 1}")  # +1 for last commit
    
    # Calculate wall clock time
    wall_clock = commits[-1][1] - commits[0][1]
    wall_clock_hours = wall_clock.total_seconds() / 3600
    
    print(f"\nWall clock time (first to last commit): {wall_clock_hours:.2f} hours")
    print(f"Development efficiency: {(total_hours/wall_clock_hours*100) if wall_clock_hours > 0 else 0:.1f}%")
    
    print("\n" + "=" * 80)
    print("FINDINGS & EXPLANATION")
    print("=" * 80)
    print("""
This analysis applies the following methodology:

1. For consecutive commits less than 1 hour apart:
   → We count the actual time between them as active development time.
   
2. For consecutive commits 1 hour or more apart:
   → We assume the developer took a break and use the average development
     time from active sessions instead.
     
3. For the final commit:
   → We add one average development session time, as we don't know when
     the developer stopped working after the last commit.

This approach gives us a more realistic estimate of "keyboard time" rather
than wall clock time, filtering out breaks, meals, sleep, etc.
""")

    # Additional insights
    if len(commits) >= 2:
        print("\nAdditional Insights:")
        if break_count == 0:
            print("  • All commits were made in concentrated development sessions")
        else:
            print(f"  • Development was spread across {break_count + 1} separate sessions")
        
        commits_per_hour = len(commits) / total_hours if total_hours > 0 else 0
        print(f"  • Average commit rate: {commits_per_hour:.2f} commits per hour")
        print(f"  • Average time per commit: {(total_dev_time/len(commits))/60:.1f} minutes")

def main():
    # Get the repository root
    repo_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        commits = get_git_commits(repo_path)
        if not commits:
            print("No commits found in repository")
            sys.exit(1)
        
        analyze_development_time(commits)
    except Exception as e:
        print(f"Error analyzing git history: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
