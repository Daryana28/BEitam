import 'dotenv/config';
import { Role } from './src/models/index.js';

async function main() {
    const roles = [
        { role_name: 'ASSET_STAFF', description: 'Staff handling asset management' },
        { role_name: 'MAINTENANCE_STAFF', description: 'Staff handling maintenance' }
    ];

    for (const roleData of roles) {
        const [role, created] = await Role.findOrCreate({
            where: { role_name: roleData.role_name },
            defaults: roleData
        });
        
        if (created) {
            console.log(`Created role: ${role.role_name}`);
        } else {
            console.log(`Role ${role.role_name} already exists.`);
        }
    }

    console.log('Roles seeded successfully!');
    process.exit(0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
