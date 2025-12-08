# Operation Protocol - Quick Reference

> Canonical index: `docs/INDEX.md`

## Before Large Operations

You'll see this:

```
🔹 OPERATION: [Name]
📋 SCOPE: [What changes]
📊 COMPLEXITY: Simple/Medium/Complex

PLAN: [Strategy 1, Fallback 1, Fallback 2, Fallback 3]
PRE-FLIGHT: [Verification checks]

Ready?

Prereq: Only proceed when Requirements Brief + Design Spec + Implementation Spec are approved; otherwise pause and request them.
```

**Your action:** Say "Go" or "Wait/Constraints"

---

## During Operations

You'll see step-by-step progress:

```
📍 STEP 1/3: [Description]
   ✓ SUCCESS or ✗ FAILED or ⚠️ PARTIAL

📍 STEP 2/3: [Description]
   ✗ FAILED → FALLBACK: [New strategy]
   ✓ SUCCESS (Fallback)
```

**Your action:** Nothing needed, I'm handling it

---

## After Operations

You'll see verification:

```
✅ COMPLETE

📊 RESULTS: [What changed]
⏱️ EXECUTION: [Timing per step]
📝 CHANGES: [File counts, replacements]
🎯 NEXT: [What's ready now]
```

**Your action:** Ready for next step

---

## If Something Goes Wrong

### Network Error

```
⚠️ NETWORK ERROR DETECTED
   Options: Retry now / Wait 10s / Use smaller batches
```

**Your action:** Choose option (or I'll auto-retry in 3s)

### Partial Failure

```
⚠️ PARTIAL (15/19 done)
   ✓ Applied: [List]
   ✗ Failed: [List]

   RECOMMENDATION: [Specific action]
```

**Your action:** Follow recommendation or give alternative

### Complete Failure

```
✗ FAILED after 2 fallbacks
   Root cause: [Explanation]

   OPTIONS:
   1. Try again
   2. Use file rewrite
   3. Skip for now
```

**Your action:** Choose which option to try

---

## Verification Scripts

Anytime, run:

```bash
./spec-verify.sh              # Check all specs
./spec-verify.sh e2e         # E2E tests only
./spec-verify.sh drawer      # Drawer tests only

./pre-flight-check.sh <file> <pattern1> <pattern2>
```

---

## Key Files

| File | Purpose |
| `../roles/qa-coach-enhanced-instructions.md` | My updated instructions |
| `qa-coach-operation-protocol.md` | Full protocol details |
| `spec-verification.md` | Verification guide |
| `spec-verify.sh` | Auto-verify specs |
| `pre-flight-check.sh` | Pre-operation validation |

---

## Standard Responses to You

**"Go"** → Proceed with operation
**"Wait"** → Pause before starting (you'll verify something)
**"Use [approach] only"** → Constraint on how I do it
**"Break into batches"** → Smaller chunks instead of all at once
**"Try again"** → Retry after failure
**"Skip"** → Don't do this operation now

---

## Your Role (TL;DR)

1. **Before:** Approve with "Go" or give constraints
2. **During:** I handle all steps and fallbacks (no action)
3. **After:** Next step is clear and ready
4. **If fails:** Choose from specific options I offer

**No more:** "Try again" with no context, silent failures, repeated errors
