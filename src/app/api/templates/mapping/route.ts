import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireRole } from '@/lib/auth/authorization';

export async function GET(request: NextRequest) {
  const { user, error } = await requireRole(['ADMIN']);
  if (error || !user) return error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const templateName = searchParams.get('template'); // e.g. don_xin_lan_1

    if (!templateName) {
      // List all pdfs
      const templatesDir = path.join(process.cwd(), 'public', 'forms');
      const files = fs.readdirSync(templatesDir);
      const pdfs = files.filter(f => f.endsWith('.pdf') && !f.includes('_grid')).map(f => f.replace('.pdf', ''));
      return NextResponse.json({ success: true, data: pdfs });
    }

    const configPath = path.join(process.cwd(), 'public', 'templates', `${templateName}.json`);
    let config = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }

    return NextResponse.json({ success: true, data: config });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireRole(['ADMIN']);
  if (error || !user) return error;

  try {
    const body = await request.json();
    const { templateName, config } = body;

    if (!templateName || !config) {
      return NextResponse.json({ success: false, error: 'Missing templateName or config' }, { status: 400 });
    }

    const configPath = path.join(process.cwd(), 'public', 'templates', `${templateName}.json`);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
