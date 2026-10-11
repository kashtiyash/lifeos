#!/usr/bin/env bash
set -euo pipefail

check_title() {
  local title="$1"
  local normalized="${title//$(printf '\357\270\217')/}"
  local pattern='^(✨ feat|🐛 fix|🧪 test|♻ refactor|📚 docs|⚙ chore|👷 ci|💄 style|⚡ perf|📦 build|⏪ revert)(\([a-z0-9._/-]+\))?!?: .+'
  [[ "$normalized" =~ $pattern ]]
}

check_title '✨ feat(tasks): add cursor pagination'
check_title '♻️ refactor: isolate repository'
check_title '🐛 fix(auth): reject unverified user'

if check_title 'feat(tasks): missing type emoji'; then
  echo "Invalid title unexpectedly passed" >&2
  exit 1
fi
if check_title '🐛 feat: emoji does not match type'; then
  echo "Mismatched title unexpectedly passed" >&2
  exit 1
fi

echo "PR title validator self-test passed."
