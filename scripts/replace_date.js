const fs = require('fs');
const file = 'src/app/applications/[id]/page.tsx';
let f = fs.readFileSync(file, 'utf8');

if (!f.includes('import { DateInput }')) {
  f = f.replace("import { Input } from '@/components/ui/Input';", "import { Input } from '@/components/ui/Input';\nimport { DateInput } from '@/components/ui/DateInput';");
}

f = f.replace(/<Input type="date"/g, '<DateInput');
fs.writeFileSync(file, f);
console.log('Replaced DateInput');
