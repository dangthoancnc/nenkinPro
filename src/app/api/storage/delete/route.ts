import { requireStaff } from '@/lib/auth/authorization';
import { NextResponse } from 'next/server';
import { deleteStorageFile } from '@/lib/storageHelper';

export async function POST(req: Request) {
  const { user, error } = await requireStaff();
  if (error || !user) return error;

  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    await deleteStorageFile(url);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Storage Delete Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
