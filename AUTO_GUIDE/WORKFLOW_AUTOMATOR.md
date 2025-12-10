# WORKFLOW PROTOCOL

## SESSION START:
1. Read START_HERE.md
2. Check PROJECT_STATE.json
3. Run mental scan (from INTELLISENSE.md)
4. Pick task from TASK_QUEUE.json

## TASK EXECUTION:
1. Read task details completely
2. Verify prerequisites are met
3. Read the target file
4. Implement fix exactly as specified
5. Test acceptance criteria
6. Update TASK_QUEUE.json (mark completed)
7. Update PROJECT_STATE.json (increment completed count)

## STATE UPDATE FORMAT:

### After completing a task:
```json
// In TASK_QUEUE.json, move from high_priority to completed:
{
  "id": "HP001",
  "title": "Fix N+1 Query in Auth Middleware",
  "completed": true,
  "completed_date": "2024-XX-XX",
  "completed_by_session": 1
}

// In PROJECT_STATE.json:
{
  "session": {
    "completed_tasks_this_session": 1
  },
  "completed_tasks": ["HP001"],
  "metrics": {
    "completed": 1,
    "remaining": 44,
    "success_rate": 2.2
  }
}
```

## COMMIT FORMAT:
`[AUTO][Session-{N}][{Task-ID}] {description}`

Examples:
- `[AUTO][Session-1][HP001] Fixed N+1 query in auth middleware`
- `[AUTO][Session-1][HP002] Added database indexes for user_id and property_id`
- `[AUTO][Session-2][MP001] Standardized error responses`

## SESSION END CHECKLIST:
1. Update all state files
2. Record session summary in context_bridge.md
3. List next 3 recommended tasks
4. Commit with session snapshot
5. Mark session complete in PROJECT_STATE.json

## ERROR HANDLING:
If a task fails:
1. Document the issue in PROJECT_STATE.json blockers array
2. Move task to pending_review in TASK_QUEUE.json
3. Continue to next task
4. Flag for human review if critical

## TIME MANAGEMENT:
- Quick tasks (<30 min): Complete 3-5 per session
- Medium tasks (30-90 min): Complete 1-2 per session
- Complex tasks (>90 min): Complete 1 max per session
- Always leave 5 min for state updates
