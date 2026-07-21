import { requireStaff, requireCustomerAccess } from '@/lib/auth/authorization';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { GoogleGenerativeAI, ModelParams } from '@google/generative-ai';
import prisma from '@/lib/prisma';
import crypto from 'node:crypto';
import { checkUploadRateLimit } from '@/lib/auth/rateLimit';

function validateMagicBytes(buffer: ArrayBuffer): { isValid: boolean; ext: string | null; mimeType: string | null } {
  const arr = new Uint8Array(buffer).subarray(0, 4);
  const hex = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

  if (hex.startsWith('FFD8FF')) return { isValid: true, ext: 'jpg', mimeType: 'image/jpeg' };
  if (hex.startsWith('89504E47')) return { isValid: true, ext: 'png', mimeType: 'image/png' };
  if (hex.startsWith('25504446')) return { isValid: true, ext: 'pdf', mimeType: 'application/pdf' };

  return { isValid: false, ext: null, mimeType: null };
}
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const customerId = formData.get('customerId') as string | null;
    const source = formData.get('source') as string;
    
    // Rate limit check (20 requests per hour)
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const identifier = customerId || 'anonymous';
    if (!checkUploadRateLimit(ip, identifier)) {
      return NextResponse.json({ error: 'Quá nhiều yêu cầu tải lên. Vui lòng thử lại sau.' }, { status: 429 });
    }

    const rawDocType = formData.get('documentType') as string || 'zairyuFront';
    let documentType = rawDocType;
    if (rawDocType === 'nenkinBook') {
      documentType = 'nenkin';
    } else if (rawDocType.startsWith('bankPassbook')) {
      documentType = 'bank';
    } else if (rawDocType === 'departureStamp') {
      documentType = 'departure';
    }

    // Strict whitelist check
    const ALLOWED_TYPES = ['zairyuFront', 'zairyuBack', 'passport', 'nenkin', 'bank', 'noticeOfPayment', 'securityPhoto', 'departure'];
    if (!ALLOWED_TYPES.includes(documentType)) {
      return NextResponse.json({ error: 'Loại tài liệu không hợp lệ.' }, { status: 400 });
    }

    if (source === 'onboarding') {
      // NOTE: Onboarding allows unauthenticated uploads from new users to a specific prefix path.
      // Rate limits and allowed file types are enforced strictly above to prevent abuse.
      const allowedOnboardingTypes = ['zairyuFront', 'zairyuBack', 'passport', 'nenkin', 'bank'];
      if (!allowedOnboardingTypes.includes(documentType)) {
        return NextResponse.json({ error: 'Invalid document type for onboarding' }, { status: 400 });
      }
    } else {
      const { user, error } = await requireStaff();
      if (error || !user) return error;
      
      if (customerId) {
        const { error: customerError } = await requireCustomerAccess(customerId);
        if (customerError) return customerError;
      }
    }

    const file = formData.get('file') as File | null;
    const action = formData.get('action') as string || 'uploadAndExtract';
    const imageUrl = formData.get('imageUrl') as string | null;

    let publicUrl = imageUrl || '';
    let securityPhotoUrl = '';
    let buffer: ArrayBuffer | null = null;
    let mimeType = 'image/jpeg';

    const securityFile = formData.get('securityFile') as File | null;

    // === 0. Handle Security File Upload ===
    if (securityFile && securityFile.size > 0) {
      if (securityFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Kích thước tệp tin vượt quá 5MB.' }, { status: 400 });
      }
      const secBuffer = await securityFile.arrayBuffer();
      const magic = validateMagicBytes(secBuffer);
      if (!magic.isValid) {
        return NextResponse.json({ error: 'Định dạng tệp không hợp lệ. Chỉ chấp nhận JPEG, PNG, PDF.' }, { status: 400 });
      }

      const prefix = customerId || 'anonymous';
      const secFileName = `${prefix}/securityPhoto/${Date.now()}_${crypto.randomUUID()}.${magic.ext}`;
      
      try {
        // TODO: [Tech Debt] Remove this mock from production code. Mocking should be done at the infrastructure level (e.g., MSW or Playwright page.route), not inside application code.
        if (process.env.NODE_ENV === 'test') {
          securityPhotoUrl = secFileName;
        } else {
          const { error: secUploadError } = await supabase.storage
            .from('customer-documents')
            .upload(secFileName, secBuffer, { contentType: magic.mimeType! });
          
          if (!secUploadError) {
            const { data } = supabase.storage
              .from('customer-documents')
              .getPublicUrl(secFileName);
            securityPhotoUrl = data.publicUrl; // Store full public URL
          } else {
            console.error('Security photo upload error:', secUploadError);
          }
        }
      } catch (uploadError) {
        console.error('Error in security upload logic:', uploadError);
      }
    }

    // === 1. Handle Upload ===
    if (file && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Kích thước tệp tin vượt quá 5MB.' }, { status: 400 });
      }
      buffer = await file.arrayBuffer();
      const magic = validateMagicBytes(buffer);
      if (!magic.isValid) {
        return NextResponse.json({ error: 'Định dạng tệp không hợp lệ. Chỉ chấp nhận JPEG, PNG, PDF.' }, { status: 400 });
      }
      mimeType = magic.mimeType!;
      
      if (action.includes('upload')) {
        const prefix = customerId || 'anonymous';
        const fileName = `${prefix}/${documentType}/${Date.now()}_${crypto.randomUUID()}.${magic.ext}`;
        
        // TODO: [Tech Debt] Remove this mock from production code. Mocking should be done at the infrastructure level (e.g., MSW or Playwright page.route), not inside application code.
        if (process.env.NODE_ENV === 'test') {
          publicUrl = fileName;
        } else {
          const { error: uploadError } = await supabase.storage
            .from('customer-documents')
            .upload(fileName, buffer, { contentType: mimeType });

          if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            return NextResponse.json({ error: `Supabase Error: ${uploadError.message}` }, { status: 500 });
          }

          const { data } = supabase.storage
            .from('customer-documents')
            .getPublicUrl(fileName);
          publicUrl = data.publicUrl; // Store full public URL
        }
      }
    } else if (imageUrl) {
      try {
        const res = await fetch(imageUrl);
        if (!res.ok) {
          return NextResponse.json({ error: `Failed to fetch image: ${res.statusText}` }, { status: 400 });
        }
        buffer = await res.arrayBuffer();
        const ct = res.headers.get('content-type');
        mimeType = ct && ct.startsWith('image/') ? ct : 'image/jpeg';
      } catch (fetchErr) {
        console.error('Fetch image error:', fetchErr);
        return NextResponse.json({ error: 'Invalid or unreachable imageUrl' }, { status: 400 });
      }
    }
    
    if (!buffer && action.includes('extract')) {
      return NextResponse.json({ error: 'No image data to extract' }, { status: 400 });
    }

    // === 2. Perform OCR using Gemini ===
    let extractedData: Record<string, unknown> | null = null;

    if (action.includes('extract') && buffer) {
      // Read keys from both possible env vars
      const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
      const apiKeys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);
      
      if (apiKeys.length === 0) {
        console.error('GEMINI_API_KEY not found.');
        return NextResponse.json({ error: 'GEMINI_API_KEY is missing. OCR cannot be performed.' }, { status: 500 });
      }

      // Build prompt based on document type
      const prompt = buildPrompt(documentType);

      const imageParts = [
        {
          inlineData: {
            data: Buffer.from(buffer).toString("base64"),
            mimeType: mimeType
          }
        }
      ];

      let result = null;
      let lastError: Error | null = null;

      // Try each API key
      for (let i = 0; i < apiKeys.length; i++) {
        const currentKey = apiKeys[i];
        try {
          const genAI = new GoogleGenerativeAI(currentKey);
          
          // Updated to the latest stable flash model from the models list
          const modelConfig: Record<string, unknown> = { model: 'gemini-2.5-flash' };
          const model = genAI.getGenerativeModel(modelConfig as unknown as ModelParams);

          // Only 1 retry (not 3) to avoid burning quota
          result = await model.generateContent([prompt, ...imageParts]);
          break; // Success → stop trying more keys

        } catch (keyError: unknown) {
          const errorMessage = keyError instanceof Error ? keyError.message : String(keyError);
          lastError = keyError instanceof Error ? keyError : new Error(errorMessage);
          
          if (errorMessage.includes('429') || errorMessage.includes('RATE_LIMIT') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
            console.warn(`API Key số ${i + 1} đã cạn kiệt (429). Chuyển sang Key tiếp theo...`);
            continue; // Try next key
          } else if (errorMessage.includes('503') || errorMessage.includes('overloaded')) {
            console.warn(`API Key số ${i + 1} bị quá tải (503). Chuyển sang Key tiếp theo...`);
            continue; // Try next key
          } else {
            // Unknown error → stop immediately and report
            console.error(`Gemini API error (Key ${i + 1}):`, errorMessage);
            return NextResponse.json({ 
              error: `Lỗi Gemini AI: ${errorMessage.substring(0, 200)}` 
            }, { status: 500 });
          }
        }
      }

      // All keys exhausted
      if (!result) {
        const msg = apiKeys.length > 1 
          ? 'Tất cả các API Key đều đã cạn kiệt giới hạn truy cập. Vui lòng thêm API Key mới vào file .env hoặc chờ vài giờ để Google cấp lại dung lượng.'
          : 'API Key đã hết dung lượng (429). Vui lòng chờ 1-2 phút rồi thử lại, hoặc thêm Key mới vào file .env.';
        console.error('All API keys exhausted:', lastError?.message);
        return NextResponse.json({ error: msg }, { status: 429 });
      }

      // Parse response
      try {
        const response = await result.response;
        let text = response.text();
        
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          text = text.substring(jsonStart, jsonEnd + 1);
          extractedData = JSON.parse(text);
        } else {
          console.error('Gemini OCR returned non-JSON:', text.substring(0, 300));
          return NextResponse.json({ 
            error: 'Hình ảnh không phù hợp hoặc quá mờ. AI không thể đọc được nội dung. Vui lòng kiểm tra lại loại tài liệu (Zairyu / Hộ chiếu / Sổ Nenkin) và chụp lại ảnh rõ nét hơn.' 
          }, { status: 400 });
        }
      } catch (parseError) {
        console.error('Gemini OCR parse error:', parseError);
        return NextResponse.json({ 
          error: 'AI trả về dữ liệu không hợp lệ. Vui lòng thử lại hoặc nhập dữ liệu thủ công.' 
        }, { status: 500 });
      }

      // === 2b. Verify & Correct data via Zipcloud ===
      if (extractedData && (documentType === 'zairyuFront' || documentType === 'zairyuBack')) {
        const data = extractedData as Record<string, unknown>;
        
        if (typeof data.postalCode === 'string' && typeof data.address === 'string' && data.postalCode) {
          const isZipValid = await verifyPostalCode(data.postalCode, data.address);
          if (!isZipValid) {
            console.log(`Mã bưu điện AI trích xuất (${data.postalCode}) có thể sai. Đang tra cứu lại...`);
            const correctZip = await lookupPostalCodeFromAddress(data.address);
            if (correctZip) data.postalCode = correctZip;
          }
        } else if (typeof data.address === 'string' && !data.postalCode) {
          const zip = await lookupPostalCodeFromAddress(data.address);
          if (zip) data.postalCode = zip;
        }

        // Auto-infer accurate Tax Office without hallucination
        if (typeof data.address === 'string') {
          const inferredTaxOffice = await inferTaxOfficeWithAI(
            data.address, 
            (data.postalCode as string) || '', 
            apiKeys[0] || process.env.GEMINI_API_KEY || ''
          );
          if (inferredTaxOffice) {
            data.taxOffice = {
              name: inferredTaxOffice.name,
              postalCode: inferredTaxOffice.zip,
              address: inferredTaxOffice.address,
              mailingName: inferredTaxOffice.name,
              mailingPostalCode: inferredTaxOffice.zip
            };
          }
        }
      }

      // === 3. Save to OcrResult if we have a customerId ===
      // customerId is already parsed at the top of the function
      if (customerId && extractedData && !extractedData.error) {
        try {
          await prisma.ocrResult.upsert({
            where: { customerId_documentType: { customerId, documentType } },
            update: { rawData: extractedData as any },
            create: { customerId, documentType, rawData: extractedData as any }
          });
        } catch (dbErr) {
          console.error('Failed to save OcrResult to DB:', dbErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      publicUrl,
      securityPhotoUrl: securityPhotoUrl || undefined,
      extractedData
    });
  } catch (error) {
    console.error('OCR Route Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Build an appropriate prompt based on document type.
 */
function buildPrompt(documentType: string): string {
  switch (documentType) {
    case 'zairyuFront':
      return `Hãy trích xuất các thông tin sau từ ảnh MẶT TRƯỚC Thẻ ngoại kiều (Zairyu Card) này:
1. Full Name (Họ tên)
2. Nationality (Quốc tịch)
3. Date of Birth (Ngày sinh) - định dạng YYYY-MM-DD
4. Sex (Giới tính)
5. Address (Địa chỉ cư trú bằng tiếng Nhật)
6. Address Romaji (Địa chỉ cư trú chuyển sang Romaji để dễ đọc)
7. Card Number (Mã số thẻ - thường ở góc trên bên phải)
8. Từ "Address", hãy suy luận ra Postal Code (Mã bưu điện - 7 chữ số) của địa chỉ đó.
9. Có phải là người cư trú vĩnh viễn (Permanent Resident / 永住者) không? (true/false)
10. Ngày bắt đầu cư trú vĩnh viễn (nếu có) - định dạng YYYY-MM-DD
11. QUAN TRỌNG: KHÔNG ĐƯỢC tự ý đoán hoặc bịa tên Cục Thuế (Tax Office). Hãy để trống toàn bộ object taxOffice. Hệ thống sẽ tự động tra cứu chính xác.

LƯU Ý: Nếu đây KHÔNG PHẢI là ảnh thẻ ngoại kiều (Zairyu Card), hãy trả về JSON với tất cả trường rỗng và thêm trường "error": "Ảnh không phải thẻ ngoại kiều. Vui lòng tải đúng loại tài liệu."

Trả về JSON với cấu trúc: { "fullName": "", "nationality": "", "dob": "", "sex": "", "address": "", "romajiAddress": "", "cardNumber": "", "postalCode": "", "hasPermanentResidence": false, "permanentResidenceDate": "", "taxOffice": { "name": "", "romajiName": "", "address": "", "romajiAddress": "", "postalCode": "", "phone": "", "websiteUrl": "", "mapUrl": "", "receptionInfo": "", "notes": "" } }`;

    case 'zairyuBack':
      return `Đây là MẶT SAU của Thẻ ngoại kiều. Nhiệm vụ chính của bạn là tìm Địa Chỉ Cư Trú Mới Nhất.
LƯU Ý QUAN TRỌNG: Trường hợp mặt sau có nhiều dòng ghi địa chỉ, hãy kiểm tra ngày ghi bên cạnh, hoặc thông thường HÃY LẤY ĐỊA CHỈ Ở DÒNG DƯỚI CÙNG vì đó là địa chỉ được cập nhật sau cùng.
Chỉ trả về các trường address, romajiAddress, postalCode và taxOffice. Các trường khác (fullName, dob, cardNumber) để chuỗi rỗng.
KHÔNG ĐƯỢC tự ý đoán hoặc bịa tên Cục Thuế (taxOffice). Hãy để trống toàn bộ object taxOffice.

LƯU Ý: Nếu đây KHÔNG PHẢI là mặt sau thẻ ngoại kiều, hãy trả về JSON với tất cả trường rỗng và thêm trường "error": "Ảnh không phải mặt sau thẻ ngoại kiều."

Trả về JSON với cấu trúc: { "fullName": "", "dob": "", "address": "", "romajiAddress": "", "cardNumber": "", "postalCode": "", "taxOffice": { "name": "", "romajiName": "", "address": "", "romajiAddress": "", "postalCode": "", "phone": "", "websiteUrl": "", "mapUrl": "", "receptionInfo": "", "notes": "" } }`;

    case 'passport':
      return `Trích xuất thông tin từ ảnh Hộ Chiếu (Passport) này:
1. Surname / Family Name (Họ)
2. Given Names (Tên đệm và Tên)
3. Nationality (Quốc tịch)
4. Date of Birth (Ngày sinh) - định dạng YYYY-MM-DD
5. Sex / Gender (Giới tính)
6. Passport Number (Số hộ chiếu)
7. Date of Issue (Ngày cấp) - định dạng YYYY-MM-DD
8. Date of Expiry (Ngày hết hạn) - định dạng YYYY-MM-DD
9. Place of Birth (Nơi sinh)

LƯU Ý: Nếu đây KHÔNG PHẢI là ảnh hộ chiếu, hãy trả về JSON với tất cả trường rỗng và thêm trường "error": "Ảnh không phải hộ chiếu."

Trả về JSON: { "lastName": "", "firstName": "", "nationality": "", "dob": "", "sex": "", "passportNumber": "", "passportIssueDate": "", "passportExpiryDate": "", "placeOfBirth": "" }`;

    case 'nenkin':
      return `Trích xuất thông tin từ ảnh Sổ Nenkin (年金手帳 - Nenkin Techō) này:
1. Số Nenkin (基礎年金番号 - Basic Pension Number, thường có 10 chữ số dạng XXXX-XXXXXX)
2. Họ tên (Kanji)
3. Họ tên Furigana (Kana/Romaji nếu có)
4. Tên Katakana (Katakana Name, thường được ghi trên sổ)
5. Ngày sinh

LƯU Ý: Nếu đây KHÔNG PHẢI là sổ Nenkin, hãy trả về JSON với tất cả trường rỗng và thêm trường "error": "Ảnh không phải sổ Nenkin."

Trả về JSON: { "nenkinNumber": "", "fullNameKanji": "", "fullNameFurigana": "", "nenkinKatakanaName": "", "dob": "" }`;

    case 'bank':
      return `Trích xuất thông tin từ ảnh Sổ/Thẻ Ngân Hàng này:
1. Tên Ngân hàng (銀行名)
2. Tên Chi nhánh (支店名)
3. Số Tài khoản (口座番号)
4. Chủ tài khoản (口座名義人)
5. SWIFT Code (nếu có)
6. Địa chỉ chi nhánh ngân hàng (nếu có)
7. Quốc gia của ngân hàng

LƯU Ý: Nếu đây KHÔNG PHẢI là tài liệu ngân hàng, hãy trả về JSON với tất cả trường rỗng và thêm trường "error": "Ảnh không phải tài liệu ngân hàng."

Trả về JSON: { "bankName": "", "branchName": "", "accountNumber": "", "accountName": "", "swiftCode": "", "bankBranchAddress": "", "bankCountry": "" }`;

    case 'noticeOfPayment':
      return `Trích xuất thông tin từ ảnh "Phiếu thông báo quyết định cấp Nenkin" (脱退一時金支給決定通知書) này:
1. Ngày quyết định cấp (支給決定日 hoặc ngày tháng ghi trên phiếu) - định dạng YYYY-MM-DD
2. Tổng tiền cấp (支給額) - Trích xuất phần số, bỏ chữ Yen/Phẩy
3. Tiền thuế bị giữ lại (所得税額) - Thường là 20.42% của tổng tiền. Trích xuất phần số.
4. Tiền thực nhận Lần 1 (控除後支払額) - Trích xuất phần số.

LƯU Ý: Nếu đây KHÔNG PHẢI là phiếu thông báo Nenkin (脱退一時金支給決定通知書), hãy trả về JSON với tất cả trường rỗng và thêm trường "error": "Ảnh không phải Phiếu thông báo cấp Nenkin."

Trả về JSON: { "noticeDate": "", "totalExpectedJpy": "", "tax2ndJpy": "", "received1stJpy": "" }`;

    default:
      return `Trích xuất thông tin từ tài liệu này và trả về JSON: { "data": "extracted info" }`;
  }
}

/**
 * Xác minh mã bưu điện bằng zipcloud API (miễn phí, không cần key).
 * Trả về true nếu mã bưu điện khớp với tỉnh, thành phố và thị trấn trong địa chỉ.
 */
async function verifyPostalCode(postalCode: string, address: string): Promise<boolean> {
  try {
    const code = postalCode.replace(/[-\s]/g, '');
    if (code.length !== 7) return false;
    
    const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${code}`, {
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return false;
    
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const pref = data.results[0].address1; // VD: "愛知県"
      const city = data.results[0].address2; // VD: "東海市"
      const town = data.results[0].address3; // VD: "荒尾町"
      
      if (!address.includes(pref) || !address.includes(city)) return false;
      if (town && !address.includes(town)) return false; // Thắt chặt để loại bỏ bưu điện lệch (VD: khác town)
      
      return true;
    }
    return false;
  } catch (err) {
    console.error('verifyPostalCode error:', err);
    return true; // Timeout/lỗi mạng → chấp nhận tạm (user sẽ xác nhận)
  }
}

/**
 * Tra cứu mã bưu điện từ địa chỉ Nhật bằng excelapi (ưu tiên) hoặc Nominatim.
 */
async function lookupPostalCodeFromAddress(address: string): Promise<string> {
  if (!address) return '';
  
  // 1. Ưu tiên sử dụng excelapi (chính xác hơn Nominatim cho địa chỉ Nhật)
  try {
    const excelUrl = `https://api.excelapi.org/post/zipcode?address=${encodeURIComponent(address)}`;
    const excelRes = await fetch(excelUrl, { signal: AbortSignal.timeout(5000) });
    if (excelRes.ok) {
      let code = (await excelRes.text()).trim().replace(/-/g, '');
      if (/^\d{7}$/.test(code)) return code;
    }
  } catch (err) {
    console.error('excelapi lookup error:', err);
  }

  // 2. Fallback Nominatim (OpenStreetMap) nếu excelapi thất bại
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&countrycodes=jp&limit=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'NenkinApp/1.0 (postal-code-lookup)',
        'Accept-Language': 'ja'
      },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return '';
    
    const data = await res.json();
    if (data.length > 0 && data[0].address?.postcode) {
      return data[0].address.postcode.replace(/-/g, '');
    }
    return '';
  } catch (err) {
    console.error('lookupPostalCodeFromAddress error:', err);
    return '';
  }
}

/**
 * Suy luận chính xác Cục Thuế từ địa chỉ bằng cách sử dụng AI (Gemini).
 */
async function inferTaxOfficeWithAI(address: string, postalCode: string, apiKey: string) {
  if (!address) return null;
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `Bạn là một chuyên gia về hệ thống hành chính Nhật Bản.
Hãy tìm tên Cục Thuế Quốc gia (National Tax Agency - Zeimusho) trực thuộc có thẩm quyền quản lý đối với địa chỉ sau:
Địa chỉ cư trú: ${address} (Mã bưu điện: ${postalCode})

LƯU Ý QUAN TRỌNG:
1. Bạn phải trả về chính xác tên Cục Thuế (ví dụ: 名古屋中村税務署, 品川税務署).
2. Hãy cố gắng tìm ra Mã bưu điện (Postal Code) của chính Cục Thuế đó, cũng như địa chỉ của nó.
3. Nếu bạn hoàn toàn không thể xác định được, hãy để trống các trường thay vì bịa đặt.

Vui lòng trả về ĐÚNG định dạng JSON sau:
{ "name": "Tên Cục Thuế (Kanji)", "romajiName": "Tên Romaji", "address": "Địa chỉ cục thuế (Kanji)", "postalCode": "Mã bưu điện của cục thuế (7 số)" }`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      text = text.substring(jsonStart, jsonEnd + 1);
      const parsed = JSON.parse(text);
      if (parsed.name) {
        return {
          name: parsed.name,
          zip: parsed.postalCode || '',
          address: parsed.address || '',
        };
      }
    }
    return null;
  } catch (error) {
    console.error('AI inferTaxOffice error:', error);
    return null;
  }
}
