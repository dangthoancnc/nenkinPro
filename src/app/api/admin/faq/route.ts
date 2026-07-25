import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

// GET all FAQs (for Admin settings)
export async function GET() {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    let faqs: any[] = [];
    if ((prisma as any).faqItem) {
      faqs = await (prisma as any).faqItem.findMany({
        orderBy: { order: 'asc' },
      });
    } else {
      faqs = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM public.nenkin_faq_items ORDER BY "order" ASC`
      );
    }

    return NextResponse.json({ success: true, data: faqs });
  } catch (err: any) {
    console.error('Fetch admin FAQs error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST create new FAQ item
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const body = await request.json();
    const { key, label, keywords, answer, order, isActive } = body;

    if (!key || !label || !answer) {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập đầy đủ Mã nhận diện (Key), Tên nút và Nội dung câu trả lời.' }, { status: 400 });
    }

    const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '-');
    const kwArray = Array.isArray(keywords)
      ? keywords
      : typeof keywords === 'string'
      ? keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
      : [];

    let newFaq: any = null;
    if ((prisma as any).faqItem) {
      newFaq = await (prisma as any).faqItem.create({
        data: {
          key: cleanKey,
          label: label.trim(),
          keywords: kwArray,
          answer: answer.trim(),
          order: Number(order) || 0,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      });
    } else {
      const id = crypto.randomUUID();
      const kwFormatted = `{${kwArray.map(k => `"${k.replace(/"/g, '""')}"`).join(',')}}`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO public.nenkin_faq_items (id, key, label, keywords, answer, "isActive", "order")
         VALUES ($1, $2, $3, $4::text[], $5, $6, $7)`,
        id, cleanKey, label.trim(), kwArray, answer.trim(), isActive !== undefined ? Boolean(isActive) : true, Number(order) || 0
      );
      newFaq = { id, key: cleanKey, label: label.trim(), keywords: kwArray, answer: answer.trim(), isActive: true, order: Number(order) || 0 };
    }

    return NextResponse.json({ success: true, message: 'Đã thêm câu hỏi trợ lý thành công!', data: newFaq });
  } catch (err: any) {
    console.error('Create FAQ error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT update existing FAQ item
export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const body = await request.json();
    const { id, label, keywords, answer, order, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID câu hỏi cần cập nhật.' }, { status: 400 });
    }

    const kwArray = Array.isArray(keywords)
      ? keywords
      : typeof keywords === 'string'
      ? keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
      : undefined;

    if ((prisma as any).faqItem) {
      await (prisma as any).faqItem.update({
        where: { id },
        data: {
          ...(label && { label: label.trim() }),
          ...(kwArray !== undefined && { keywords: kwArray }),
          ...(answer !== undefined && { answer: answer.trim() }),
          ...(order !== undefined && { order: Number(order) }),
          ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        },
      });
    } else {
      if (isActive !== undefined) {
        await prisma.$executeRawUnsafe(
          `UPDATE public.nenkin_faq_items SET "isActive" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2`,
          Boolean(isActive), id
        );
      }
      if (label) {
        await prisma.$executeRawUnsafe(
          `UPDATE public.nenkin_faq_items SET label = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2`,
          label.trim(), id
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Cập nhật câu hỏi thành công!' });
  } catch (err: any) {
    console.error('Update FAQ error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE delete FAQ item
export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID câu hỏi cần xóa.' }, { status: 400 });
    }

    if ((prisma as any).faqItem) {
      await (prisma as any).faqItem.delete({ where: { id } });
    } else {
      await prisma.$executeRawUnsafe(`DELETE FROM public.nenkin_faq_items WHERE id = $1`, id);
    }

    return NextResponse.json({ success: true, message: 'Đã xóa câu hỏi khỏi ngân hàng dữ liệu.' });
  } catch (err: any) {
    console.error('Delete FAQ error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
