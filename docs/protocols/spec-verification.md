# Spec Verification Guide
> Canonical index: `docs/INDEX.md`

This guide helps detect incomplete or interrupted spec updates without running tests.

## Quick Verification Commands

### Check E2E Spec Completeness

```bash
# Count total tests in E2E spec (should be 31)
grep -c "test('should" apps/nav-shell-e2e/src/navigation-shell.spec.ts

# Check for orphaned TODO comments (should be 0)
grep -c "^[[:space:]]*// TODO:" apps/nav-shell-e2e/src/navigation-shell.spec.ts

# Verify all test.describe sections are closed (should have matching counts)
grep -c "test\.describe(" apps/nav-shell-e2e/src/navigation-shell.spec.ts
grep -c "^  });" apps/nav-shell-e2e/src/navigation-shell.spec.ts
```

### Check Unit Test Spec Completeness (Navigation Drawer)

```bash
# Count tests in drawer spec (should be 51)
grep -c "it('should" apps/nav-shell/src/app/components/navigation-drawer/navigation-drawer.component.spec.ts

# Check for placeholder expectations (should be minimal)
grep "expect(.*).toBeTruthy()" apps/nav-shell/src/app/components/navigation-drawer/navigation-drawer.component.spec.ts | wc -l
```

## Expected Spec Structure

### E2E Spec (`navigation-shell.spec.ts`)

| Section                   | Test Count | Status     |
| ------------------------- | ---------- | ---------- |
| Mobile Drawer Interaction | 6          | ✓ Complete |
| Desktop Navigation        | 3          | ✓ Complete |
| Feature Status Badges     | 3          | ✓ Complete |
| Theme Switching           | 3          | ✓ Complete |
| Keyboard Navigation       | 5          | ✓ Complete |
| Responsive Breakpoint     | 2          | ✓ Complete |
| Active Route Highlighting | 2          | ✓ Complete |
| External Links            | 1          | ✓ Complete |
| Accessibility             | 4          | ✓ Complete |
| Error Handling            | 2          | ✓ Complete |
| **TOTAL**                 | **31**     | ✓ Complete |

### Unit Test Spec (`navigation-drawer.component.spec.ts`)

| Section        | Test Count | Status         |
| -------------- | ---------- | -------------- |
| Initialization | 3          | ⏳ In Progress |
| Rendering      | 4          | ⏳ In Progress |
| Links          | 6          | ⏳ In Progress |
| Badges         | 5          | ⏳ In Progress |
| Active Route   | 2          | ⏳ In Progress |
| Drawer State   | 3          | ⏳ In Progress |
| Keyboard       | 3          | ⏳ In Progress |
| Focus          | 5          | ⏳ In Progress |
| Accessibility  | 6          | ⏳ In Progress |
| Integration    | 2          | ⏳ In Progress |
| Responsive     | 2          | ⏳ In Progress |
| Edge Cases     | 4          | ⏳ In Progress |
| **TOTAL**      | **51**     | ⏳ In Progress |

## Error Detection Protocol

### When you encounter a network/connection error:

1. **PAUSE** - Don't retry immediately
2. **VERIFY** - Run the verification command for the section you were editing
3. **COMPARE** - Check actual count vs expected count above
4. **REPORT** - Share results with format:
   ```
   Section: Theme Switching
   Expected: 3 tests
   Actual: 3 tests
   Status: ✓ Verified Complete / ✗ Incomplete (missing N tests)
   ```

### Incomplete Sections (Missing Tests)

If a section is incomplete after a network error:

- The last test in that section may be truncated
- Check for orphaned closing braces
- Look for tests that start but don't have closing `}`

Example red flags:

```typescript
    test('should incomplete test', async ({ page }) => {
      // This test is cut off
      // Missing closing brace and assertions

  test.describe('Next Section', () => {
```

## Verification Results Template

Use this when reporting issues:

```markdown
## Spec Verification Report

**E2E Spec Status:**

- Total tests: [X/31]
- Orphaned TODOs: [X]
- All describe blocks closed: [✓/✗]
- Error location: [Line X - Section Name]

**Drawer Unit Spec Status:**

- Total tests: [X/51]
- Placeholder expectations: [X]
- All describe blocks closed: [✓/✗]

**Actions Taken:**

- [ ] Identified incomplete section
- [ ] Verified line ranges
- [ ] Marked for re-execution
```

## Prevention Tips

### For Future Updates

1. **Check before starting** - Verify current state matches expected state
2. **Add checksums** - Count tests before and after edits
3. **Use atomic updates** - Break large changes into smaller, verifiable chunks
4. **Enable auto-verify** - Could implement a pre-commit hook to check this automatically

### Suggested CI/CD Enhancement

Add to `.github/workflows/main.yml`:

```yaml
- name: Verify Test Specs
  run: |
   E2E_TESTS=$(grep -c "test('should" apps/nav-shell-e2e/src/navigation-shell.spec.ts)
   if [ "$E2E_TESTS" -ne 31 ]; then
     echo "ERROR: E2E spec incomplete (found $E2E_TESTS, expected 31)"
     exit 1
   fi

   if grep -q "^[[:space:]]*// TODO:" apps/nav-shell-e2e/src/navigation-shell.spec.ts; then
     echo "WARNING: Found orphaned TODO comments in E2E spec"
   fi
```

## Next Steps

1. Use verification commands above to confirm current state
2. Report results using template
3. If incomplete, identify exact section and retry that section only
4. Once verified complete, proceed to Drawer unit test strengthening
