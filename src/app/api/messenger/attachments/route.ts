import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ success: false, error: 'customerId is required' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        fullName: true,
        code: true,
        contactImageUrls: true,
        zairyuFrontUrl: true,
        zairyuBackUrl: true,
        passportUrl: true,
        nenkinBookUrl: true,
        departureStampUrl: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy khách hàng' }, { status: 404 });
    }

    // Find all messages from conversations where this customer is a participant
    const messages = await (prisma.message as any).findMany({
      where: {
        conversation: {
          participants: {
            some: { customerId },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        attachments: true,
      },
    });

    const chatFiles: Array<{
      url: string;
      name: string;
      size?: number;
      type?: string;
      messageId: string;
      createdAt: Date;
    }> = [];

    for (const msg of messages) {
      if (Array.isArray(msg.attachments)) {
        for (const item of msg.attachments as any[]) {
          if (item && item.url) {
            chatFiles.push({
              url: item.url,
              name: item.name || 'Tài liệu đính kèm',
              size: item.size || 0,
              type: item.type || 'image/jpeg',
              messageId: msg.id,
              createdAt: msg.createdAt,
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          fullName: customer.fullName,
          code: customer.code,
        },
        unclassifiedUrls: customer.contactImageUrls || [],
        chatAttachments: chatFiles,
      },
    });
  } catch (err: any) {
    console.error('Fetch customer attachments error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi tải kho tệp khách hàng' }, { status: 500 });
  }
}
