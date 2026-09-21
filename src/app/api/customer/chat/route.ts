import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { validateEmployee } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

async function resolveCaller(request: NextRequest, targetCustomerId?: string | null) {
  // 1. Check Customer token
  const rawToken = request.cookies.get('nenkin_customer_token')?.value;
  if (rawToken) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const session = await prisma.customerSession.findUnique({
      where: { tokenHash },
      include: {
        customer: {
          include: {
            applications: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
    });

    if (session && !session.revokedAt && session.expiresAt >= new Date()) {
      return { customer: session.customer, staffUser: null, isStaff: false };
    }
  }

  // 2. Check Staff session (e.g. staff viewing portal or previewing customer)
  const staff = await validateEmployee();
  if (staff) {
    let customer: any = null;
    if (targetCustomerId) {
      customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { id: targetCustomerId },
            { code: targetCustomerId },
            { applications: { some: { id: targetCustomerId } } },
          ],
        },
        include: {
          applications: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });
    }

    if (!customer) {
      // Fallback to first customer if none specified
      customer = await prisma.customer.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
          applications: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });
    }

    return { customer, staffUser: staff, isStaff: true };
  }

  return { customer: null, staffUser: null, isStaff: false };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestedCustomerId = searchParams.get('customerId') || searchParams.get('id');

    const { customer, staffUser, isStaff } = await resolveCaller(request, requestedCustomerId);

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Chưa xác thực người dùng' }, { status: 401 });
    }

    // Find or create a CUSTOMER_SUPPORT conversation for this customer
    let conversation = await prisma.conversation.findFirst({
      where: {
        participants: {
          some: { customerId: customer.id },
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, role: true } },
            customer: { select: { id: true, fullName: true, code: true } },
          },
        },
        application: {
          include: {
            assignedUser: { select: { id: true, name: true, staffCode: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!conversation) {
      const app = customer.applications?.[0] || null;
      let assignedUserId = app?.assignedUserId;

      if (!assignedUserId) {
        const defaultAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        assignedUserId = defaultAdmin?.id || null;
      }

      conversation = await prisma.conversation.create({
        data: {
          title: `Hỗ trợ: ${customer.fullName} (#${customer.code})`,
          type: 'CUSTOMER_SUPPORT',
          applicationId: app?.id || null,
          assignedUserId: assignedUserId || null,
          participants: {
            create: [
              { customerId: customer.id },
              ...(assignedUserId ? [{ userId: assignedUserId }] : []),
            ],
          },
          messages: {
            create: {
              senderUserId: assignedUserId || undefined,
              content: `Xin chào Quý khách ${customer.fullName}! VietNenkin rất hân hạnh được đồng hành cùng Quý khách. Hồ sơ Nenkin #${customer.code} của Quý khách đang được xử lý. Quý khách có bất kỳ thắc mắc hoặc cần gửi bổ sung giấy tờ gì xin hãy nhắn tin trực tiếp tại đây nhé!`,
            },
          },
        },
        include: {
          participants: {
            include: {
              user: { select: { id: true, name: true, role: true } },
              customer: { select: { id: true, fullName: true, code: true } },
            },
          },
          application: {
            include: {
              assignedUser: { select: { id: true, name: true, staffCode: true } },
            },
          },
        },
      });
    }

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      include: {
        senderUser: { select: { id: true, name: true } },
        senderCustomer: { select: { id: true, fullName: true } },
      },
    });

    const staffParticipant = conversation.participants.find(p => p.user)?.user;
    const staffName = staffParticipant?.name || conversation.application?.assignedUser?.name || 'Chuyên viên VietNenkin';

    const formattedMessages = messages.map(m => {
      let isMe = false;
      let senderName = 'Hỗ trợ VietNenkin';

      if (m.senderCustomerId) {
        senderName = m.senderCustomer?.fullName || customer.fullName || 'Bạn';
        isMe = !isStaff || (isStaff && !staffUser);
      } else if (m.senderUserId) {
        senderName = m.senderUser?.name || staffName;
        isMe = isStaff && staffUser?.id === m.senderUserId;
      }

      return {
        id: m.id,
        senderName,
        isMe,
        content: m.content,
        attachments: (m.attachments as any) || [],
        time: new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        createdAt: m.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        title: conversation.title,
        staffName,
        isOnline: true,
      },
      messages: formattedMessages,
    });
  } catch (err: any) {
    console.error('Customer chat GET error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi lấy tin nhắn' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, customerId, content, attachments } = body;

    const { customer, staffUser, isStaff } = await resolveCaller(request, customerId);

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Chưa xác thực người dùng' }, { status: 401 });
    }

    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'Thiếu conversationId' }, { status: 400 });
    }

    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
    if (!content?.trim() && !hasAttachments) {
      return NextResponse.json({ success: false, error: 'Nội dung hoặc tệp đính kèm là bắt buộc' }, { status: 400 });
    }

    // Determine sender
    const isSenderStaff = isStaff && !!staffUser;

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderCustomerId: isSenderStaff ? undefined : customer.id,
        senderUserId: isSenderStaff ? staffUser.id : undefined,
        content: content?.trim() || '',
        attachments: hasAttachments ? attachments : undefined,
      },
      include: {
        senderUser: { select: { id: true, name: true } },
        senderCustomer: { select: { id: true, fullName: true } },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Create in-app notification for the recipient
    try {
      if (isSenderStaff) {
        // Staff replied to customer -> notify customer
        await prisma.notification.create({
          data: {
            customerId: customer.id,
            title: 'Tin nhắn mới từ Hỗ trợ VietNenkin',
            content: content ? (content.length > 60 ? content.substring(0, 60) + '...' : content) : 'Đã gửi một tệp đính kèm.',
            type: 'CHAT_MESSAGE',
            link: `/customer/portal`,
          },
        });
      } else {
        // Customer messaged staff -> notify assigned staff or admin
        const conv = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { participants: true },
        });
        const staffParticipant = conv?.participants.find(p => p.userId)?.userId;
        if (staffParticipant) {
          await prisma.notification.create({
            data: {
              userId: staffParticipant,
              title: `Tin nhắn từ khách hàng ${customer.fullName}`,
              content: content ? (content.length > 60 ? content.substring(0, 60) + '...' : content) : 'Khách hàng gửi tệp đính kèm mới.',
              type: 'CHAT_MESSAGE',
              link: `/messenger?conversationId=${conversationId}`,
            },
          });
        }
      }
    } catch (notifErr) {
      console.warn('Failed to send chat notification:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        senderName: isSenderStaff ? (staffUser?.name || 'Nhân viên') : (customer.fullName || 'Bạn'),
        isMe: true,
        content: message.content,
        attachments: (message.attachments as any) || [],
        time: new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        createdAt: message.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Customer chat POST error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi gửi tin nhắn' }, { status: 500 });
  }
}
