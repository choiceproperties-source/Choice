// AUTO_GUIDE/scanner.js
// Automated issue detection for Choice Properties

const fs = require('fs');
const path = require('path');

class ProjectScanner {
  constructor() {
    this.issues = [];
    this.projectRoot = path.resolve(__dirname, '..');
  }

  scan() {
    console.log('Starting automated scan...');
    
    this.issues = [];
    
    // Security scans
    this.checkN1Queries();
    this.checkEmailInjection();
    this.checkRateLimiting();
    this.checkErrorMessages();
    
    // Performance scans
    this.checkMissingIndexes();
    this.checkCacheEviction();
    this.checkSyncEmail();
    
    // Data integrity scans
    this.checkUniqueConstraints();
    
    // Update state
    this.updateState();
    
    console.log(`Scan complete. Found ${this.issues.length} issues.`);
    this.issues.forEach(issue => {
      console.log(`  [${issue.severity.toUpperCase()}] ${issue.title} (${issue.fix_id})`);
    });
    
    return this.issues;
  }
  
  fileExists(relativePath) {
    const fullPath = path.join(this.projectRoot, relativePath);
    return fs.existsSync(fullPath);
  }
  
  readFile(relativePath) {
    const fullPath = path.join(this.projectRoot, relativePath);
    if (!fs.existsSync(fullPath)) return null;
    return fs.readFileSync(fullPath, 'utf8');
  }
  
  checkN1Queries() {
    const content = this.readFile('server/auth-middleware.ts');
    if (content && content.includes('await supabase.from("users")') && 
        !content.includes('roleCache') && !content.includes('userCache')) {
      this.issues.push({
        type: 'security',
        severity: 'high',
        title: 'N+1 Query in Auth Middleware',
        description: 'authenticateToken runs database query on every request',
        file: 'server/auth-middleware.ts',
        fix_id: 'HP001'
      });
    }
  }
  
  checkEmailInjection() {
    const content = this.readFile('server/email.ts');
    if (content && content.includes('${data.') && !content.includes('escape(')) {
      this.issues.push({
        type: 'security',
        severity: 'high',
        title: 'Email HTML Injection Risk',
        description: 'User input not escaped in email templates',
        file: 'server/email.ts',
        fix_id: 'HP003'
      });
    }
  }
  
  checkRateLimiting() {
    const content = this.readFile('server/rate-limit.ts');
    if (content && content.includes('skip: () => isDev')) {
      this.issues.push({
        type: 'security',
        severity: 'medium',
        title: 'Rate Limiting Disabled in Dev',
        description: 'Rate limiting bypassed in development mode',
        file: 'server/rate-limit.ts',
        fix_id: 'HP004'
      });
    }
  }
  
  checkErrorMessages() {
    const content = this.readFile('server/routes.ts');
    if (content && content.includes('error: error.message') || 
        content && content.includes('error: err.message')) {
      this.issues.push({
        type: 'security',
        severity: 'medium',
        title: 'Detailed Error Messages Exposed',
        description: 'Internal error messages sent to client',
        file: 'server/routes.ts',
        fix_id: 'MP001'
      });
    }
  }
  
  checkMissingIndexes() {
    const content = this.readFile('shared/schema.ts');
    if (content) {
      // Check if schema exists but no explicit indexes
      const hasUserIdQueries = content.includes('userId');
      const hasExplicitIndexes = content.includes('index(') || content.includes('.index(');
      
      if (hasUserIdQueries && !hasExplicitIndexes) {
        this.issues.push({
          type: 'performance',
          severity: 'high',
          title: 'Missing Database Indexes',
          description: 'No indexes on frequently queried columns',
          file: 'shared/schema.ts',
          fix_id: 'HP002'
        });
      }
    }
  }
  
  checkCacheEviction() {
    const content = this.readFile('server/cache.ts');
    if (content && content.includes('this.cache.keys().next().value') && 
        !content.includes('lastAccessed')) {
      this.issues.push({
        type: 'performance',
        severity: 'medium',
        title: 'FIFO Cache Eviction',
        description: 'Cache uses FIFO instead of LRU eviction',
        file: 'server/cache.ts',
        fix_id: 'MP004'
      });
    }
  }
  
  checkSyncEmail() {
    const content = this.readFile('server/routes.ts');
    if (content && content.includes('await sendEmail(')) {
      this.issues.push({
        type: 'performance',
        severity: 'medium',
        title: 'Synchronous Email Sending',
        description: 'Email sending blocks request response',
        file: 'server/routes.ts',
        fix_id: 'MP003'
      });
    }
  }
  
  checkUniqueConstraints() {
    const content = this.readFile('shared/schema.ts');
    if (content) {
      // Check applications table for unique constraint
      const applicationsSection = content.match(/applications\s*=\s*pgTable\([^)]+\)/s);
      if (applicationsSection && !applicationsSection[0].includes('unique()')) {
        this.issues.push({
          type: 'data_integrity',
          severity: 'medium',
          title: 'Missing Unique Constraint on Applications',
          description: 'Users can submit duplicate applications',
          file: 'shared/schema.ts',
          fix_id: 'HP005'
        });
      }
    }
  }
  
  updateState() {
    const statePath = path.join(__dirname, 'PROJECT_STATE.json');
    
    try {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      
      state.detected_issues = {
        security: this.issues.filter(i => i.type === 'security'),
        performance: this.issues.filter(i => i.type === 'performance'),
        data_integrity: this.issues.filter(i => i.type === 'data_integrity'),
        ux: this.issues.filter(i => i.type === 'ux'),
        accessibility: this.issues.filter(i => i.type === 'accessibility'),
        consistency: this.issues.filter(i => i.type === 'consistency')
      };
      
      state.system.last_scan = new Date().toISOString();
      
      fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
      console.log('State updated with scan results.');
    } catch (err) {
      console.error('Failed to update state:', err.message);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const scanner = new ProjectScanner();
  scanner.scan();
}

module.exports = ProjectScanner;
