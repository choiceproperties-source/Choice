# CONTEXT BRIDGE

## PURPOSE:
Maintain continuity between AI sessions by capturing key context and decisions.

---

## SESSION LOG:

### Session 1 (Initial Setup)
- **Date:** 
- **Tasks Completed:** System initialization
- **Key Decisions:** 
  - Created autonomous improvement system
  - Prioritized security and performance fixes
  - Established 4-phase improvement roadmap
- **Challenges:** None
- **Next Steps:** Run scanner, start HP001

---

## DECISION LOG:

Record important decisions that affect future work:

```json
[
  {
    "decision": "Prioritize security fixes before UX improvements",
    "reason": "Security vulnerabilities present higher risk than UX issues",
    "date": "",
    "session": 1,
    "affects_tasks": ["HP001", "HP003", "HP004"]
  },
  {
    "decision": "Use escape-html library for email sanitization",
    "reason": "Well-maintained, lightweight, standard approach",
    "date": "",
    "session": 1,
    "affects_tasks": ["HP003"]
  },
  {
    "decision": "Cache user roles for 15 minutes",
    "reason": "Balance between performance and security (role changes are rare)",
    "date": "",
    "session": 1,
    "affects_tasks": ["HP001"]
  }
]
```

---

## CROSS-SESSION MEMORY:

### Things to Remember:
1. This project uses Supabase for auth and database
2. Frontend is React + TypeScript + Tailwind
3. Backend is Express.js + TypeScript
4. Shadcn UI components are used - follow their patterns
5. Never add hover/active states to Buttons/Badges (built-in)
6. Use DESIGN_RULES.json for all styling decisions

### Gotchas to Avoid:
1. Don't skip updating PROJECT_STATE.json after tasks
2. Don't forget to invalidate cache when updating data
3. Don't use literal colors without dark mode variants
4. Don't nest Cards inside Cards
5. Don't add partial borders to rounded elements

### Code Patterns Used:
1. API responses use `success()` and `errorResponse()` helpers
2. Validation uses Zod schemas from shared/schema.ts
3. Auth middleware populates `req.user`
4. Cache uses `cache.set()` and `cache.get()` with TTL

---

## SESSION TEMPLATE:

Copy this for each new session:

```markdown
### Session N
- **Date:** YYYY-MM-DD
- **Started At:** HH:MM
- **Tasks Attempted:** [list]
- **Tasks Completed:** [list]
- **Key Decisions:** [list]
- **Challenges:** [list]
- **Next Steps:** [list]
- **Ended At:** HH:MM
```

---

## RECOVERY NOTES:

If context is lost:
1. Read this file first
2. Check PROJECT_STATE.json for current phase/progress
3. Check TASK_QUEUE.json for next task
4. Review recent git commits for work done
5. Resume from next pending task
