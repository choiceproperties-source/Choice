# ACCOUNT MIGRATION GUIDE

## WHEN LIMIT REACHED:

1. Stop current task at safe point
2. Update all state files immediately
3. Commit changes:
   ```bash
   git add .
   git commit -m "[AUTO-SAVE] Session {N} snapshot - {current_task}"
   git push origin main
   ```
4. Update PROJECT_STATE.json:
   ```json
   {
     "session": {
       "ended": true,
       "ended_at": "timestamp",
       "reason": "session_limit"
     }
   }
   ```

## NEW ACCOUNT/SESSION SETUP:

1. Clone from GitHub (if new account)
2. Read AUTO_GUIDE/START_HERE.md immediately
3. Check AUTO_GUIDE/PROJECT_STATE.json
4. Check AUTO_GUIDE/TASK_QUEUE.json
5. Increment session number:
   ```json
   {
     "session": {
       "number": 2,
       "started": true,
       "started_at": "timestamp"
     }
   }
   ```
6. Continue from next pending task

## CONTINUITY MECHANISMS:

System maintains state through:
- **PROJECT_STATE.json** - Overall progress and metrics
- **TASK_QUEUE.json** - Task completion status
- **Git commits** - Code changes with task IDs
- **DESIGN_RULES.json** - Consistent design decisions
- **context_bridge.md** - Session summaries and decisions

## HANDOFF CHECKLIST:

Before ending session:
- [ ] All code changes committed
- [ ] PROJECT_STATE.json updated
- [ ] TASK_QUEUE.json updated  
- [ ] Session summary in context_bridge.md
- [ ] Next steps clearly documented
- [ ] Changes pushed to GitHub

## RECOVERY:

If state is corrupted:
1. Check git log for last [AUTO] commit
2. Review completed tasks from commit messages
3. Rebuild state from commit history
4. Resume from first incomplete task
