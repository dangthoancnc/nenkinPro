import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PUT } from '../app/api/customers/[id]/route';

vi.mock('@/lib/prisma', () => {
  return {
    default: {
      customer: {
        update: vi.fn().mockResolvedValue({ id: 'test-id' })
      }
    }
  };
});

vi.mock('@/lib/auth/authorization', () => ({
  requireCustomerAccess: vi.fn().mockResolvedValue({ user: { id: 'admin-id', role: 'ADMIN' }, error: null })
}));

describe('PUT /api/customers/[id]', () => {
  let prismaMock: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const prisma = await import('@/lib/prisma');
    prismaMock = prisma.default;
  });

  it('updates customer with 15 new fields successfully', async () => {
    const payload = {
      sex: 'Nam',
      nationality: 'VN',
      phone: '0901234567',
      occupation: 'Kỹ sư',
      placeOfBirth: 'Hà Nội',
      headOfHouseholdName: 'Nguyễn Văn A',
      relationshipToHead: 'Bản thân',
      hasPermanentResidence: true,
      permanentResidenceDate: '2023-01-01',
      departureDate: '2026-05-10',
      overseasCountry: 'VIET NAM',
      overseasPostalCode: '100000',
      accountNameKatakana: 'NGUYEN VAN A',
      bankBranchAddress: 'Hanoi Branch',
      bankCountry: 'VIET NAM'
    };

    const req = new Request('http://localhost/api/customers/test-id', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const res = await PUT(req, { params: Promise.resolve({ id: 'test-id' }) }) as Response;
    const json = await res.json();
    
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);

    // Verify Prisma received the correct fields
    const updateCall = prismaMock.customer.update.mock.calls[0][0];
    expect(updateCall.data.sex).toBe('Nam');
    expect(updateCall.data.hasPermanentResidence).toBe(true);
    expect(updateCall.data.permanentResidenceDate).toEqual(new Date('2023-01-01'));
    expect(updateCall.data.departureDate).toEqual(new Date('2026-05-10'));
  });

  it('handles optional or empty fields safely', async () => {
    const payload = {
      sex: '',
      hasPermanentResidence: null,
      departureDate: ''
    };

    const req = new Request('http://localhost/api/customers/test-id', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const res = await PUT(req, { params: Promise.resolve({ id: 'test-id' }) }) as Response;
    
    expect(res.status).toBe(200);
    const updateCall = prismaMock.customer.update.mock.calls[0][0];
    
    // empty string for dates usually gets parsed to invalid date if not careful,
    // but the route handler checks body.departureDate ? new Date() : null
    expect(updateCall.data.sex).toBe('');
    expect(updateCall.data.hasPermanentResidence).toBeNull();
    expect(updateCall.data.departureDate).toBeNull();
  });
});
