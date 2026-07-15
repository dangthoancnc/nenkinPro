import { PrismaClient } from '@prisma/client';
import { mapApplicationToTemplate } from '../../src/lib/documentMapper';

const app = {
  id: 'test-id',
  status: 'PENDING',
  customer: {
    id: 'cust-id',
    fullName: 'Test User',
    zairyuAddress: 'Tokyo',
    postalCode: '123-4567',
    accountNumber: '1234567',
    nenkinNumber: '1234-567890',
    myNumber: '123456789012',
    dob: new Date('1990-01-01'),
    taxOffice: {
      name: 'Shinjuku',
      address: 'Shinjuku-ku'
    }
  },
  taxRepresentative: {
    fullName: 'Rep User',
    address: 'Osaka',
    postalCode: '987-6543'
  },
  totalExpectedJpy: { toString: () => "1000.5" },
  received1stJpy: null,
  received2ndJpy: undefined,
  tax2ndJpy: { toString: () => "0" },
};

console.log(mapApplicationToTemplate(app as any));
