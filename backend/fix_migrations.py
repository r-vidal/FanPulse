#!/usr/bin/env python3
"""
Script to diagnose and fix Alembic migration head conflicts.

This script will:
1. Show current migration heads
2. Create a merge migration if needed
3. Apply the migrations
"""

import subprocess
import sys
from pathlib import Path

def run_command(cmd):
    """Run a shell command and return output"""
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout, result.stderr, result.returncode

def main():
    print("=" * 60)
    print("Alembic Migration Fixer")
    print("=" * 60)
    print()

    # Change to backend directory
    backend_dir = Path(__file__).parent
    print(f"Working directory: {backend_dir}")
    print()

    # Step 1: Show current heads
    print("Step 1: Checking current migration heads...")
    stdout, stderr, code = run_command(["alembic", "heads"])

    if code != 0:
        print(f"Error running alembic heads:")
        print(stderr)
        return 1

    print("Current heads:")
    print(stdout)

    # Count the number of heads
    heads = [line for line in stdout.strip().split('\n') if line.strip()]
    num_heads = len(heads)

    print(f"\nFound {num_heads} head(s)")
    print()

    if num_heads <= 1:
        print("✓ Only one head found - no merge needed!")
        print("\nTrying to upgrade to head...")
        stdout, stderr, code = run_command(["alembic", "upgrade", "head"])
        if code != 0:
            print(f"Error upgrading:")
            print(stderr)
            return 1
        print("✓ Migration successful!")
        return 0

    # Step 2: Multiple heads - need to create merge
    print(f"⚠ Multiple heads detected. Creating merge migration...")
    print()

    # Extract revision IDs from heads output
    # Format is usually: "<revision> (head)"
    head_revisions = []
    for line in heads:
        if line.strip():
            # Extract revision ID (first word)
            parts = line.strip().split()
            if parts:
                rev_id = parts[0]
                head_revisions.append(rev_id)
                print(f"  - {rev_id}")

    if len(head_revisions) < 2:
        print("Error: Could not extract head revision IDs")
        return 1

    print()
    print(f"Creating merge migration for heads: {', '.join(head_revisions)}")

    # Create merge migration
    merge_message = f"Merge heads: {', '.join(head_revisions)}"
    stdout, stderr, code = run_command([
        "alembic", "merge", "-m", merge_message
    ] + head_revisions)

    if code != 0:
        print(f"Error creating merge migration:")
        print(stderr)
        return 1

    print("✓ Merge migration created!")
    print(stdout)
    print()

    # Step 3: Apply migrations
    print("Step 3: Applying migrations...")
    stdout, stderr, code = run_command(["alembic", "upgrade", "head"])

    if code != 0:
        print(f"Error upgrading:")
        print(stderr)
        return 1

    print("✓ All migrations applied successfully!")
    print(stdout)

    return 0

if __name__ == "__main__":
    sys.exit(main())
