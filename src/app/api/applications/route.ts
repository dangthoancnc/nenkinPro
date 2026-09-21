import { requireStaff, requireCustomerAccess } from '@/lib/auth/authorization';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = parseInt(searchParams.get('limit') || '10');
    const minimal = searchParams.get('minimal') === 'true';
    
    // Filters
    const q = searchParams.get('q') || '';
    const statusesParam = searchParams.get('statuses');
    const statuses = statusesParam ? statusesParam.split(',').filter(Boolean) : [];
    const bank = searchParams.get('bank') || '';
    const dobFrom = searchParams.get('dobFrom');
    const dobTo = searchParams.get('dobTo');
    
    // Sorters
    const sortCol = searchParams.get('sortCol') || 'applyDate';
    const sortDir = searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc';

    let andConditions: any[] = [];

    if (user.role === 'COLLABORATOR') {
      andConditions.push({ customer: { createdById: user.id } });
    } else {
      if (filter === 'my_assigned') {
        andConditions.push({ assignedUserId: user.id });
      } else if (filter === 'unassigned') {
        andConditions.push({ assignedUserId: null });
      }
    }

    const qClean = (q || '').trim();
    if (qClean) {
      const words = qClean.split(/\s+/).filter(Boolean);
      try {
        let matchingCustomerIds: string[] = [];
        if (words.length > 0) {
          const conditions = words
            .map((_, i) => `unaccent(c."fullName") ILIKE '%' || unaccent($${i + 1}) || '%'`)
            .join(' AND ');
          const sql = `
            SELECT c.id
            FROM "nenkin_customers" c
            WHERE (${conditions})
               OR c.code ILIKE '%' || $1 || '%'
               OR (c."fullNameFurigana" IS NOT NULL AND c."fullNameFurigana" ILIKE '%' || $1 || '%')
               OR (c."nenkinKatakanaName" IS NOT NULL AND c."nenkinKatakanaName" ILIKE '%' || $1 || '%')
               OR (c.phone IS NOT NULL AND c.phone ILIKE '%' || $1 || '%')
          `;
          const rows: { id: string }[] = await prisma.$queryRawUnsafe(sql, ...words);
          matchingCustomerIds = rows.map(r => r.id);
        }

        const orBranches: any[] = [
          { customer: { fullName: { contains: qClean, mode: 'insensitive' } } },
          { customer: { code: { contains: qClean, mode: 'insensitive' } } }
        ];
        if (matchingCustomerIds.length > 0) {
          orBranches.unshift({ customerId: { in: matchingCustomerIds } });
        }
        andConditions.push({ OR: orBranches });
      } catch (err) {
        console.warn('Unaccent search query fallback:', err);
        andConditions.push({
          customer: {
            OR: [
              { fullName: { contains: qClean, mode: 'insensitive' } },
              { code: { contains: qClean, mode: 'insensitive' } }
            ]
          }
        });
      }
    }

    if (statuses.length > 0) {
      andConditions.push({ status: { in: statuses } });
    }

    if (bank) {
      andConditions.push({
        customer: {
          bankAccounts: {
            some: {
              bankName: { contains: bank, mode: 'insensitive' }
            }
          }
        }
      });
    }

    if (dobFrom || dobTo) {
      let dobFilter: any = {};
      if (dobFrom) dobFilter.gte = new Date(dobFrom);
      if (dobTo) dobFilter.lte = new Date(dobTo);
      andConditions.push({ customer: { dob: dobFilter } });
    }

    const whereClause = andConditions.length > 0 ? { AND: andConditions } : {};

    let orderByClause: any = {};
    if (sortCol === 'name') {
      orderByClause = { customer: { fullName: sortDir } };
    } else if (sortCol === 'status') {
      orderByClause = { status: sortDir };
    } else if (sortCol === 'applyDate') {
      orderByClause = { applyDate: sortDir };
    } else if (sortCol === 'jpy') {
      orderByClause = { totalExpectedJpy: sortDir };
    } else {
      orderByClause = { createdAt: sortDir };
    }

    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      prisma.nenkinApplication.findMany({
        where: whereClause,
        include: minimal ? {
          customer: {
            select: {
              id: true,
              fullName: true,
              code: true,
              taxOfficeId: true,
              referredByCode: true,
              referralType: true,
              createdBy: { select: { id: true, name: true, staffCode: true, role: true } },
              referredByCustomer: { select: { id: true, fullName: true, code: true } }
            }
          },
          assignedUser: { select: { id: true, name: true, email: true, role: true, staffCode: true } },
          taxRepresentative: { select: { fullName: true } }
        } : {
          customer: {
            include: {
              createdBy: { select: { id: true, name: true, staffCode: true, role: true, email: true } },
              referredByCustomer: { select: { id: true, fullName: true, code: true } }
            }
          },
          assignedUser: { select: { id: true, name: true, email: true, role: true, staffCode: true } },
          taxRepresentative: { select: { fullName: true } }
        },
        orderBy: orderByClause,
        skip,
        take: limit,
      }),
      prisma.nenkinApplication.count({ where: whereClause })
    ]);

    return NextResponse.json({
      success: true,
      data: applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId, status, applyDate, totalExpectedJpy } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }

    const { user, error } = await requireCustomerAccess(customerId);
    if (error || !user) return error;

    const newApplication = await prisma.nenkinApplication.create({
      data: {
        customerId,
        status: status || 'DRAFT',
        applyDate: applyDate ? new Date(applyDate) : null,
        totalExpectedJpy: totalExpectedJpy || null,
      },
    });

    return NextResponse.json(newApplication, { status: 201 });
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

