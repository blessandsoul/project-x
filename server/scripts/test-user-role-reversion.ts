/**
 * Test: User Role Reversion on Company Deletion
 *
 * This test verifies that when a company is deleted, the owner user's
 * role is reverted from 'company' to 'user' and their company_id is cleared.
 *
 * Manual test steps:
 * 1. Create a user account
 * 2. Onboard a company (user role becomes 'company', company_id is set)
 * 3. Delete the company
 * 4. Verify user role is 'user' and company_id is null
 * 5. Verify user can create a new company
 */

console.log('📝 User Role Reversion Test Guide\n');
console.log('This test verifies that deleting a company reverts the owner user\'s role.\n');

console.log('Test Steps:');
console.log('1. Register a new user via POST /auth/register');
console.log('   - Email: test-company-delete@example.com');
console.log('   - Username: testcompanydelete');
console.log('   - Password: Test123!@#\n');

console.log('2. Login and verify initial state via GET /auth/me');
console.log('   Expected:');
console.log('   - role: "user"');
console.log('   - company_id: null\n');

console.log('3. Onboard a company via POST /companies/onboard');
console.log('   - name: "Test Company for Deletion"');
console.log('   - website: "https://test-delete.com"\n');

console.log('4. Verify user state changed via GET /auth/me');
console.log('   Expected:');
console.log('   - role: "company"');
console.log('   - company_id: <number>\n');

console.log('5. Delete the company via DELETE /companies/:id');
console.log('   - Use the company_id from step 4\n');

console.log('6. Verify user role reverted via GET /auth/me');
console.log('   Expected:');
console.log('   - role: "user" ✅ (reverted)');
console.log('   - company_id: null ✅ (cleared)\n');

console.log('7. Verify assets deleted');
console.log('   - Check uploads/companies/test-company-for-deletion/ is gone\n');

console.log('8. Verify user can create a new company');
console.log('   - POST /companies/onboard with different company name');
console.log('   - Should succeed (no "already has a company" error)\n');

console.log('✅ If all steps pass, user role reversion is working correctly!\n');

console.log('API Endpoints:');
console.log('- POST   /auth/register');
console.log('- POST   /auth/login');
console.log('- GET    /auth/me');
console.log('- POST   /companies/onboard');
console.log('- DELETE /companies/:id');
