#!/usr/bin/env bash
# Cron-friendly example: pull World Cup knockout results and, only when they
# change, commit, push, and deploy. Configure non-interactive Git and Wrangler
# authentication separately before scheduling this script.
set -uo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
REPO=$(dirname "$SCRIPT_DIR")
PUSH_REMOTE=${FIFA_BRACKET_PUSH_REMOTE:-origin}
STANDINGS=src/data/currentStandings.json
LOG_DIR=${FIFA_BRACKET_LOG_DIR:-"$REPO/logs"}
LOG=$LOG_DIR/auto-update.log

mkdir -p "$LOG_DIR"
exec >>"$LOG" 2>&1

# One run at a time—a deploy can outlast the schedule interval.
exec 9>"$LOG_DIR/auto-update.lock"
flock -n 9 || { echo "$(date -Is) skip: previous run still going"; exit 0; }

cd "$REPO" || { echo "$(date -Is) FATAL: cannot enter repository"; exit 1; }
echo "$(date -Is) --- run start ---"

node scripts/pull-results.mjs --write
pull_rc=$?
[ "$pull_rc" -ne 0 ] && echo "$(date -Is) NEEDS ATTENTION: pull-results exited $pull_rc"

if git diff --quiet -- "$STANDINGS"; then
  echo "$(date -Is) no change; done"
  exit 0
fi

branch=$(git rev-parse --abbrev-ref HEAD)
echo "$(date -Is) standings changed on $branch—committing and deploying"
git commit -q -m "auto-pull WC results" -- "$STANDINGS" || { echo "$(date -Is) FATAL: commit failed"; exit 1; }
git push -q "$PUSH_REMOTE" "HEAD:$branch" || { echo "$(date -Is) FATAL: push failed"; exit 1; }
npm run deploy || { echo "$(date -Is) FATAL: deploy failed"; exit 1; }
echo "$(date -Is) deployed"
