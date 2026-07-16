import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

console.log('DATABASE_URL is:', process.env.DATABASE_URL);
console.log('DIRECT_URL is:', process.env.DIRECT_URL);

// Use DIRECT_URL to bypass pooler connectivity issues
if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

import prisma from '../src/lib/prisma';

async function main() {
  const codeSuffix = Math.floor(Math.random() * 9000) + 1000;
  const customerCode = `TEST-CUST-${codeSuffix}`;

  console.log(`Creating mock customer with code ${customerCode}...`);

  // 1. Create TaxOffice
  const taxOffice = await prisma.taxOffice.create({
    data: {
      name: '新宿税務署',
      romajiName: 'Shinjuku Tax Office',
      address: '東京都新宿区北新宿1-19-3',
      postalCode: '1690074',
    }
  });

  // 2. Create TaxRepresentative
  const taxRep = await prisma.taxRepresentative.create({
    data: {
      fullName: 'NGUYEN VAN A',
      fullNameKana: 'グエン ヴァン エー',
      address: '東京都新宿区西新宿1-1-1',
      postalCode: '1600023',
      phone: '09012345678',
      relationship: '納税管理人',
    }
  });

  // 3. Create Customer
  const customer = await prisma.customer.create({
    data: {
      code: customerCode,
      fullName: 'TRAN VAN DUNG',
      fullNameFurigana: 'チャン ヴァン ズン',
      dob: new Date('1995-06-15'),
      zairyuAddress: '東京都千代at区千代at1-1',
      postalCode: '1000001',
      sex: 'MALE',
      nationality: 'VIETNAM',
      phone: '08098765432',
      nenkinNumber: '1234567890',
      myNumber: '123456789012',
      bankName: 'MUFG Bank',
      branchName: 'Shinjuku Branch',
      accountNumber: '1234567',
      accountName: 'TRAN VAN DUNG',
      swiftCode: 'BOTKJPJT',
      taxOfficeId: taxOffice.id,
      occupation: 'IT Engineer',
      departureDate: new Date('2023-04-15'),
      overseasStreet: '123 Le Loi',
      overseasCity: 'District 1',
      overseasProvince: 'Ho Chi Minh',
      overseasPostalCode: '700000',
      overseasCountry: 'VIETNAM',
    }
  });

  // 4. Create WorkHistory
  await prisma.workHistory.create({
    data: {
      customerId: customer.id,
      companyName: 'ABC Kogyo KK',
      startDate: new Date('2020-04-01'),
      endDate: new Date('2023-03-31'),
    }
  });

  // 5. Create NenkinApplication
  const application = await prisma.nenkinApplication.create({
    data: {
      customerId: customer.id,
      taxRepresentativeId: taxRep.id,
      status: 'DRAFT',
    }
  });

  console.log('--------------------------------------------------');
  console.log('Successfully created mock application!');
  console.log(`Application ID: ${application.id}`);
  console.log(`Customer Code : ${customer.code}`);
  console.log('--------------------------------------------------');
  console.log('Use the Application ID above to test the PDF generator.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
