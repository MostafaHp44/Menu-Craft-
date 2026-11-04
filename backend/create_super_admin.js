const { createEmployee } = require('./src/services/employee.service');
(async () => {
  try {
    const result = await createEmployee('rest-1793437631499-27bf0', {
      name: 'Super Admin',
      email: 'super@menucraft.demo',
      password: 'PPv7Ms1hwcnRbUeIoZMHSw',
      role: 'super_admin',
      branchAccessType: 'all',
      branchIds: []
    }, null);
    console.log('Created:', result);
  } catch (e) {
    console.error('FAILED:', e.status || 500, e.message);
  }
})();
