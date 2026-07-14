import { createClient } from '@supabase/supabase-js';
import prisma from '../lib/prisma';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'customer-documents';

function sanitizeFilename(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

async function uploadImage(localPath: string, folder: string, fileName: string): Promise<string | null> {
  if (!fs.existsSync(localPath)) return null;
  const fileBuffer = fs.readFileSync(localPath);
  
  const safeName = sanitizeFilename(fileName);
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(`${folder}/${safeName}`, fileBuffer, {
      upsert: true,
      contentType: 'image/jpeg'
    });

  if (error) {
    console.error(`Failed to upload ${fileName}:`, error.message);
    return null;
  }
  
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(`${folder}/${safeName}`);
    
  return publicUrlData.publicUrl;
}

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'KH-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

async function run() {
  console.log("Starting Migration...");

  // 1. Clear old data
  console.log("Cleaning old transactional data...");
  await prisma.transferRequest.deleteMany({});
  await prisma.nenkinApplication.deleteMany({});
  await prisma.customer.deleteMany({});
  
  // 2. Read migration data
  const dataPath = path.resolve('C:/Users/WIN10MST/.gemini/antigravity/brain/31d90b8e-492b-4cd4-8edb-2135a0bbf83b/scratch/migration_data.json');
  const imagesDir = path.resolve('C:/Users/WIN10MST/.gemini/antigravity/brain/31d90b8e-492b-4cd4-8edb-2135a0bbf83b/scratch/images');
  
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const { customers, applications } = JSON.parse(rawData);

  console.log(`Found ${customers.length} customers to migrate.`);

  // Mapping IDKhachHang to Supabase Customer ID
  const idMap: Record<string, string> = {};

  for (const c of customers) {
    const idAccess = c.IDKhachHang;
    
    // Upload images if any
    let zairyuFrontUrl = null, zairyuBackUrl = null, passportUrl = null;
    let departureStampUrl = null, nenkinBookUrl = null, bankPassbookUrl = null;

    if (c._images) {
      if (c._images.AnhTheNgoaiKieuP1 && c._images.AnhTheNgoaiKieuP1.length > 0) {
        zairyuFrontUrl = await uploadImage(path.join(imagesDir, c._images.AnhTheNgoaiKieuP1[0]), 'zairyuFront', c._images.AnhTheNgoaiKieuP1[0]);
      }
      if (c._images.AnhtheNgoaiKieuP2 && c._images.AnhtheNgoaiKieuP2.length > 0) {
        zairyuBackUrl = await uploadImage(path.join(imagesDir, c._images.AnhtheNgoaiKieuP2[0]), 'zairyuBack', c._images.AnhtheNgoaiKieuP2[0]);
      }
      if (c._images.AnhHoChieu && c._images.AnhHoChieu.length > 0) {
        passportUrl = await uploadImage(path.join(imagesDir, c._images.AnhHoChieu[0]), 'passport', c._images.AnhHoChieu[0]);
      }
      if (c._images.AnhDauXuatCanh && c._images.AnhDauXuatCanh.length > 0) {
        departureStampUrl = await uploadImage(path.join(imagesDir, c._images.AnhDauXuatCanh[0]), 'departure', c._images.AnhDauXuatCanh[0]);
      }
      if (c._images.AnhSoNenkin && c._images.AnhSoNenkin.length > 0) {
        nenkinBookUrl = await uploadImage(path.join(imagesDir, c._images.AnhSoNenkin[0]), 'nenkin', c._images.AnhSoNenkin[0]);
      }
      if (c._images.AnhSoNganHangP1 && c._images.AnhSoNganHangP1.length > 0) {
        bankPassbookUrl = await uploadImage(path.join(imagesDir, c._images.AnhSoNganHangP1[0]), 'bank', c._images.AnhSoNganHangP1[0]);
      }
    }

    let dobDate = new Date();
    if (c.NgaySinh) {
      dobDate = new Date(c.NgaySinh);
      if (isNaN(dobDate.getTime())) dobDate = new Date();
    }

    const newCustomer = await prisma.customer.create({
      data: {
        code: generateCode(),
        fullName: c.TenDayDu || c.KhachHang || 'UNKNOWN',
        dob: dobDate,
        sex: c.GioiTinh === 'False' ? 'Nữ' : (c.GioiTinh === 'True' ? 'Nam' : null),
        nenkinNumber: c.MSLuongHuu || (c.MSLuongHuu1 ? `${c.MSLuongHuu1}-${c.MSLuongHuu2 || ''}` : null),
        zairyuAddress: c.DiaChiJPauto || c.DiaChiJP || null,
        postalCode: c.PostCode || (c.MaBuuDienJP1 ? `${c.MaBuuDienJP1}-${c.MaBuuDienJP2 || ''}` : null),
        phone: c.SoDienThoai || null,
        overseasAddress: c.DiaChiVN || null,
        hasPermanentResidence: c.VinhTru === 'True',
        bankName: c.TenNganHang || null,
        branchName: c.TenChiNhanh || null,
        accountNumber: c.SoTaiKhoan || null,
        accountName: c.TenChuTaiKhoan || null,
        bankBranchAddress: c.DiaChiChiNhanh || null,
        
        // images
        zairyuFrontUrl,
        zairyuBackUrl,
        passportUrl,
        departureStampUrl,
        nenkinBookUrl,
        bankPassbookUrl,
        status: 'VERIFIED'
      }
    });

    idMap[idAccess] = newCustomer.id;
    process.stdout.write('.');
  }
  
  console.log("\nCustomers migrated successfully.");

  // Applications
  console.log("Migrating Applications...");
  for (const app of applications) {
    const custId = idMap[app.IDKhachHang];
    if (!custId) continue;

    let totalExpected = app.SotienLan1 ? parseFloat(app.SotienLan1) : null;
    let received1st = null;
    let received2nd = app.SoTienLan2 ? parseFloat(app.SoTienLan2) : null;
    let tax2nd = app.ThueLan2 ? parseFloat(app.ThueLan2) : null;
    let serviceFee = app.PhiDichVuLan2 ? parseFloat(app.PhiDichVuLan2) : null;

    let applyDate = app.NgayGuiHoSo1 ? new Date(app.NgayGuiHoSo1) : null;
    let sent1stDate = app.NgayGuiHoSo1 ? new Date(app.NgayGuiHoSo1) : null;
    let noticeDate = app.NgayNhanThongBao1 ? new Date(app.NgayNhanThongBao1) : null;
    let sent2ndDate = app.NgayGuiHoSo2 ? new Date(app.NgayGuiHoSo2) : null;
    let received2ndDate = app.NgayNhanThongBao2 ? new Date(app.NgayNhanThongBao2) : null;

    await prisma.nenkinApplication.create({
      data: {
        customerId: custId,
        status: 'RECEIVED_1ST', // or something else depending on data
        applyDate: isNaN(applyDate?.getTime() as number) ? null : applyDate,
        sent1stDate: isNaN(sent1stDate?.getTime() as number) ? null : sent1stDate,
        noticeDate: isNaN(noticeDate?.getTime() as number) ? null : noticeDate,
        sent2ndDate: isNaN(sent2ndDate?.getTime() as number) ? null : sent2ndDate,
        received2ndDate: isNaN(received2ndDate?.getTime() as number) ? null : received2ndDate,
        totalExpectedJpy: totalExpected,
        received1stJpy: received1st,
        received2ndJpy: received2nd,
        tax2ndJpy: tax2nd,
        serviceFeeJpy: serviceFee,
        targetGroup: app.DoiTuong || null,
      }
    });
  }
  
  console.log("Applications migrated successfully.");
  process.exit(0);
}

run().catch(console.error);
