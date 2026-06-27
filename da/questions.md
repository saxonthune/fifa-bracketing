# Questions

The minimal batch for the human, ranked by unblock-value. Each names what it
unblocks and proposes a default so you confirm rather than author. Cleared answers
become `confirmed` decisions in decisions.md.

```yaml
# --- RESOLVED ---
# Q-scoring     -> D-scoring-rule confirmed: R32=1 R16=2 QF=3 SF=5 F=8, TP=3 (assumed), no tiebreaker
# Q-pinned-format -> D-pinned-format confirmed: pinned.json in R2 = array of code strings (name is in the code)
# Q-third-place -> D-third-place-included confirmed: keep, scored

# --- OPEN ---

- id: Q-r2-url
  question: >
    What is the R2 bucket's public base URL (or custom domain), and the file names
    for results and the pinned list? Needed to wire the runtime fetch. (Infra you
    provision.)
  unblocks: [T-results-fetch]
  priority: high

- id: Q-team-seed
  question: >
    Store a numeric seed/ranking per team in the registry? Agent lean: no —
    deferred; structure already wires slots, seed would be display-only. Tradeoff
    brief delivered; awaiting your call.
  resolves: D-team-seed
  priority: low
```
