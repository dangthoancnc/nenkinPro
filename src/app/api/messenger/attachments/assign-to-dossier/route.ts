import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const body = await request.json();
    const { fileUrl, customerId, targetType } = body;

    if (!fileUrl || !customerId) {
      return NextResponse.json({ success: false, error: 'Thiếu đường dẫn tệp (fileUrl) hoặc mã khách hàng (customerId)' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        applications: { orderBy: { createdAt: 'desc' }, take: 1 },
        bankAccounts: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy hồ sơ khách hàng' }, { status: 404 });
    }

    let updatedTargetName = 'Kho tài liệu chưa phân loại';

    switch (targetType) {
      case 'zairyuFront': {
        await prisma.customer.update({
          where: { id: customerId },
          data: { zairyuFrontUrl: fileUrl },
        });
        updatedTargetName = 'Thẻ ngoại kiều (Mặt trước)';
        break;
      }
      case 'zairyuBack': {
        await prisma.customer.update({
          where: { id: customerId },
          data: { zairyuBackUrl: fileUrl },
        });
        updatedTargetName = 'Thẻ ngoại kiều (Mặt sau)';
        break;
      }
      case 'passport': {
        await prisma.customer.update({
          where: { id: customerId },
          data: { passportUrl: fileUrl },
        });
        updatedTargetName = 'Hộ chiếu';
        break;
      }
      case 'nenkinBook': {
        await prisma.customer.update({
          where: { id: customerId },
          data: { nenkinBookUrl: fileUrl },
        });
        updatedTargetName = 'Sổ Nenkin';
        break;
      }
      case 'departureStamp': {
        await prisma.customer.update({
          where: { id: customerId },
          data: { departureStampUrl: fileUrl },
        });
        updatedTargetName = 'Dấu xuất cảnh';
        break;
      }
      case 'noticeOfEntitlement': {
        const app = customer.applications[0];
        if (app) {
          await prisma.nenkinApplication.update({
            where: { id: app.id },
            data: { noticeImageUrl: fileUrl },
          });
          updatedTargetName = 'Phiếu thông báo cấp Lần 1';
        } else {
          // Fallback to unclassified if no application exists yet
          const existing = customer.contactImageUrls || [];
          if (!existing.includes(fileUrl)) {
            await prisma.customer.update({
              where: { id: customerId },
              data: { contactImageUrls: [...existing, fileUrl] },
            });
          }
          updatedTargetName = 'Kho tài liệu chưa phân loại (Khách chưa có đơn Lần 1)';
        }
        break;
      }
      case 'bankPassbook': {
        if (customer.bankAccounts.length > 0) {
          const firstBank = customer.bankAccounts[0];
          const existing = firstBank.bankPassbookUrls || [];
          if (!existing.includes(fileUrl)) {
            await prisma.bankAccount.update({
              where: { id: firstBank.id },
              data: { bankPassbookUrls: [...existing, fileUrl] },
            });
          }
        } else {
          await prisma.bankAccount.create({
            data: {
              customerId,
              purpose: 'BOTH',
              bankCountry: 'VIETNAM',
              bankPassbookUrls: [fileUrl],
            },
          });
        }
        updatedTargetName = 'Tài khoản & Sổ ngân hàng';
        break;
      }
      case 'unclassified':
      default: {
        const existing = customer.contactImageUrls || [];
        if (!existing.includes(fileUrl)) {
          await prisma.customer.update({
            where: { id: customerId },
            data: { contactImageUrls: [...existing, fileUrl] },
          });
        }
        updatedTargetName = 'Kho tài liệu chưa phân loại của khách';
        break;
      }
    }

    // Record AuditLog
    await prisma.auditLog.create({
      data: {
        entityId: customerId,
        entityType: 'CUSTOMER',
        fromState: 'ATTACHMENT_ASSIGNMENT',
        toState: targetType || 'unclassified',
        actionBy: user.id,
        metadata: {
          fileUrl,
          targetType,
          targetName: updatedTargetName,
          customerName: customer.fullName,
          staffName: user.name,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã lưu tài liệu vào "${updatedTargetName}" của khách hàng ${customer.fullName} (#${customer.code})`,
      targetName: updatedTargetName,
      customer: {
        id: customer.id,
        code: customer.code,
        fullName: customer.fullName,
      },
    });
  } catch (err: any) {
    console.error('Assign attachment to dossier error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Lỗi gán tài liệu vào hồ sơ' }, { status: 500 });
  }
}
