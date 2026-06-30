#!/usr/bin/env bash
# Cron entrypoint: pull WC knockout results, and only if they changed, commit +
# push + deploy. Runs headless, so it deliberately avoids the two things a cron
# session can't reach: the GNOME keyring (gh's token) and an ssh-agent. Push goes
# over the passphraseless ed25519 key via an explicit SSH url; wrangler reads its
# file-based OAuth token. See `just auto-update` to run it by hand.
set -uo pipefail

REPO=/home/saxon/code/github/saxonthune/fifa-bracketing
# nvm node isn't on cron's PATH; pin it (update on a node major upgrade).
export PATH="/home/saxon/.nvm/versions/node/v22.21.0/bin:/usr/bin:/bin"
PUSH_URL=git@github.com:saxonthune/fifa-bracketing.git
STANDINGS=src/data/currentStandings.json
LOG_DIR=/home/saxon/.local/state/fifa-bracketing
LOG=$LOG_DIR/cron.log

mkdir -p "$LOG_DIR"
exec >>"$LOG" 2>&1
# One run at a time — a deploy can outlast the 10-minute interval.
exec 9>"$LOG_DIR/lock"
flock -n 9 || { echo "$(date -Is) skip: previous run still going"; exit 0; }

cd "$REPO" || { echo "$(date -Is) FATAL: cannot cd $REPO"; exit 1; }
echo "$(date -Is) --- run start ---"

node scripts/pull-results.mjs --write
pull_rc=$?
[ $pull_rc -ne 0 ] && echo "$(date -Is) ⚠ NEEDS ATTENTION: pull-results exited $pull_rc (unmapped winner? check ALIASES)"

if git diff --quiet -- "$STANDINGS"; then
  echo "$(date -Is) no change; done"
  exit 0
fi

branch=$(git rev-parse --abbrev-ref HEAD)
echo "$(date -Is) standings changed on $branch — committing + deploying"
git commit -q -m "auto-pull WC results" -- "$STANDINGS" || { echo "$(date -Is) FATAL: commit failed"; exit 1; }
git push -q "$PUSH_URL" "HEAD:$branch" || { echo "$(date -Is) FATAL: push failed"; exit 1; }
npm run deploy || { echo "$(date -Is) FATAL: deploy failed"; exit 1; }
echo "$(date -Is) deployed."
