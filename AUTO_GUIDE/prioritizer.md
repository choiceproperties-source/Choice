# TASK PRIORITIZATION

## SCORING SYSTEM:

### Impact Points:
- **Security:** 10 points (vulnerabilities, data exposure)
- **Broken:** 9 points (feature doesn't work)
- **Performance:** 8 points (slow, inefficient)
- **UX:** 7 points (confusing, frustrating)
- **Design:** 6 points (inconsistent, ugly)
- **Enhancement:** 5 points (nice to have)

### Effort Multipliers:
- **Quick** (<30 min): 1
- **Medium** (30-90 min): 3
- **Complex** (90-180 min): 6
- **Major** (>3 hr): 10

## PRIORITY FORMULA:

```
Priority = (Impact x 3) - (Effort x 2)
```

### Examples:
- Security fix, quick effort: (10 x 3) - (1 x 2) = 28 (HIGH)
- UX fix, medium effort: (7 x 3) - (3 x 2) = 15 (MEDIUM)
- Enhancement, complex: (5 x 3) - (6 x 2) = 3 (LOW)

## PRIORITY BANDS:

| Band | Score | Action |
|------|-------|--------|
| HIGH | 25+ | Do immediately |
| MEDIUM | 15-24 | Do this session if time |
| LOW | <15 | Defer to later session |

## EXECUTION ORDER:

1. All HIGH priority (score >= 25)
2. MEDIUM priority with security impact
3. MEDIUM priority with performance impact
4. Remaining MEDIUM priority
5. LOW priority (backlog)

## AUTO-SELECT ALGORITHM:

```
function selectNextTask(sessionTimeRemaining):
  for task in sortedByPriority(taskQueue):
    if task.estimatedTime <= sessionTimeRemaining:
      if task.prerequisites.allCompleted():
        return task
  return null
```

## SESSION PLANNING:

1. Check remaining session time
2. Calculate priority scores for all pending tasks
3. Select highest priority that fits time
4. If complex task: ensure 20% buffer time
5. Always reserve 5 min for state updates

## BLOCKER HANDLING:

If task has blocker:
1. Skip to next task
2. Document blocker in PROJECT_STATE.json
3. Flag for human review if critical
4. Re-evaluate after blocker resolved
