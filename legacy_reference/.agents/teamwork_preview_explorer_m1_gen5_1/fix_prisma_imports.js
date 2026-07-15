const fs = require('fs');
const files = [
  'g:/AntiGravity/apps/nenkin/src/app/api/dashboard/kpis/route.ts',
  'g:/AntiGravity/apps/nenkin/src/app/api/dashboard/recent-applications/route.ts',
  'g:/AntiGravity/apps/nenkin/src/app/api/hr/staffs/route.ts'
];
for(const file of files) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(/import\s*\{\s*prisma\s*\}\s*from\s*['"]@\/lib\/prisma['"];?/, 'import prisma from "@/lib/prisma";');
    fs.writeFileSync(file, code, 'utf8');
    console.log('Fixed', file);
  } else {
    console.log('Not found', file);
  }
}
