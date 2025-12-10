# AI INTELLISENSE SYSTEM - DETECTION RULES

## SECURITY DETECTION:

### 1. N+1 Queries
- **File:** server/auth-middleware.ts
- **Look for:** `await supabase.from("users").select()`
- **Fix:** Cache results with 15-minute TTL
- **Task ID:** HP001

### 2. HTML Injection
- **File:** server/email.ts
- **Look for:** `${variable}` without escaping
- **Fix:** Use escape-html library
- **Task ID:** HP003

### 3. Rate Limiting Disabled
- **File:** server/rate-limit.ts
- **Look for:** `skip: () => isDev`
- **Fix:** Enable in dev with configurable flag
- **Task ID:** HP004

### 4. Error Message Leakage
- **File:** server/routes.ts
- **Look for:** `error: error.message` in responses
- **Fix:** Use generic messages
- **Task ID:** MP001

## PERFORMANCE DETECTION:

### 1. Missing Indexes
- **Look for:** `.eq("user_id", userId)` queries without indexes
- **Fix:** Add database indexes
- **Task ID:** HP002

### 2. Synchronous Email
- **Look for:** `await sendEmail` blocking request
- **Fix:** Fire-and-forget pattern
- **Task ID:** MP003

### 3. FIFO Cache
- **File:** server/cache.ts
- **Look for:** `this.cache.keys().next().value` for eviction
- **Fix:** Implement LRU eviction
- **Task ID:** MP004

### 4. Large Images
- **Look for:** `<img>` without optimization
- **Fix:** Use next/image with WebP

## DESIGN DETECTION:

### 1. Button Variants
- **Look for:** `<button>` without variant prop
- **Fix:** Use Button component with variant

### 2. Color Contrast
- **Test:** Text on background colors
- **Fix:** Adjust colors to meet WCAG 4.5:1

### 3. Spacing
- **Look for:** Random px values (13px, 17px, etc)
- **Fix:** Use 8, 16, 24, 32, 40, 48, 64px only

### 4. Card Nesting
- **Look for:** Card inside Card or bg-card inside bg-card
- **Fix:** Remove nested cards

## RESPONSIVENESS DETECTION:

### 1. Mobile Navigation
- **Count:** Mobile nav items > 8
- **Fix:** Implement dropdown menu

### 2. Filter Sidebars
- **Check:** Mobile view has sticky sidebar
- **Fix:** Collapse to drawer
- **Task ID:** MP002

### 3. Horizontal Overflow
- **Check:** Content causes horizontal scroll on mobile
- **Fix:** Add proper overflow handling

## DATA INTEGRITY DETECTION:

### 1. Missing Unique Constraints
- **File:** shared/schema.ts
- **Look for:** Tables without unique() constraints for user+property
- **Fix:** Add unique constraints
- **Task ID:** HP005

### 2. No Soft Deletes
- **Look for:** Hard DELETE statements
- **Fix:** Add deleted_at column
- **Task ID:** LP001

## AUTO-SCAN PROTOCOL:

1. **Security scan** (5 min)
   - Check auth-middleware.ts for N+1
   - Check email.ts for injection
   - Check rate-limit.ts for skip

2. **Performance scan** (5 min)
   - Check for missing indexes
   - Check email sending pattern
   - Check cache eviction policy

3. **Design scan** (10 min)
   - Check button usage
   - Check spacing values
   - Check color contrast

4. **Update detected_issues** in PROJECT_STATE.json
