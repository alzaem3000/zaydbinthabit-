import fs from 'fs';
import path from 'path';

console.log("🔍 STARTING DEEP SYSTEM AUDIT...");
const errors: string[] = [];
const warnings: string[] = [];

function checkFileContains(filePath: string, stringsToFind: string[], fileDescription: string) {
  if (!fs.existsSync(filePath)) {
    errors.push(`❌ MISSING FILE: ${fileDescription} (${filePath})`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  stringsToFind.forEach(str => {
    if (!content.includes(str)) {
      errors.push(`❌ LOGIC ERROR in ${fileDescription}: Missing expected code/logic -> '${str.substring(0, 30)}...'`);
    }
  });
}

// 1. Dependency Check
console.log("⏳ Checking Dependencies...");
checkFileContains('package.json', ['browser-image-compression'], 'Package.json');

// 2. Schema Check (Database Integrity)
console.log("⏳ Checking Database Schema...");
checkFileContains(path.join('shared', 'schema.ts'), [
  'nationalId: text("national_id").unique()',
  'mobileNumber: text("mobile_number").unique()',
  'link: text("link")',
  'export const performanceStandards = pgTable'
], 'Database Schema');

// 3. Backend Routing & Auth Check
console.log("⏳ Checking Backend Logic & Local Auth...");
checkFileContains(path.join('server', 'routes.ts'), [
  '/api/auth/teacher/register',
  '/api/auth/teacher/login',
  'req.login(',
  'const { nationalId, mobileNumber'
], 'Backend Routes');

// 4. Frontend Teacher UI Check
console.log("⏳ Checking Teacher Dashboard (Grid UI)...");
checkFileContains(path.join('client', 'src', 'pages', 'home.tsx'), [
  'indicator-card',
  'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  '<Progress'
], 'Teacher Dashboard');

// 5. Frontend Auth Page Check
console.log("⏳ Checking Auth Page...");
checkFileContains(path.join('client', 'src', 'pages', 'auth-page.tsx'), [
  'TabsTrigger value="login"',
  'TabsTrigger value="register"'
], 'Authentication Page');

// 6. Modal Integrity Check
console.log("⏳ Checking Upload Modal...");
checkFileContains(path.join('client', 'src', 'components', 'witness-upload-modal.tsx'), [
  'browser-image-compression',
  'TabsTrigger value="link"'
], 'Witness Upload Modal');


console.log("\n=================================");
console.log("📊 AUDIT RESULTS:");
if (errors.length > 0) {
  console.error(`⚠️ FOUND ${errors.length} CRITICAL ERRORS:`);
  errors.forEach(e => console.error(e));
  process.exit(1);
} else {
  console.log("✅ ALL ARCHITECTURAL CHECKS PASSED SUCCESSFULLY.");
  console.log("=================================\n");
}
