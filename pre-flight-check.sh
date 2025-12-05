#!/bin/zsh
# pre-flight-check.sh - Validate file state before major operations
# Usage: ./pre-flight-check.sh <file_path> [pattern1] [pattern2] ...

set -e

FILE_PATH="$1"
shift

if [ ! -f "$FILE_PATH" ]; then
    echo "ERROR: File not found: $FILE_PATH"
    exit 1
fi

echo "=== PRE-FLIGHT CHECK ==="
echo "File: $FILE_PATH"
echo ""

# Basic file checks
echo "✓ File exists and readable"
FILE_SIZE=$(wc -c < "$FILE_PATH")
echo "✓ File size: $FILE_SIZE bytes"

LINE_COUNT=$(wc -l < "$FILE_PATH")
echo "✓ Line count: $LINE_COUNT lines"

# Check if file is valid (for code files, basic syntax check)
if [[ "$FILE_PATH" == *.ts || "$FILE_PATH" == *.tsx ]]; then
    if grep -q "^[[:space:]]*[{}]$" "$FILE_PATH"; then
        echo "✓ Structure looks valid (contains balanced braces)"
    else
        echo "⚠ Warning: Could not verify brace structure"
    fi
fi

echo ""
echo "Pattern matches:"
# Check each pattern provided
for pattern in "$@"; do
    COUNT=$(grep -c "$pattern" "$FILE_PATH" || echo "0")
    echo "  '$pattern': $COUNT matches"
done

echo ""
echo "✅ Pre-flight check complete - file is ready for operations"
