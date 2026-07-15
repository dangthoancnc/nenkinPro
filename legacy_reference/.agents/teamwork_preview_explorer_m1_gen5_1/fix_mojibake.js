const fs = require('fs');
const path = require('path');

const topbarPath = path.join(__dirname, '../../src/components/Topbar.tsx');
let topbar = fs.readFileSync(topbarPath, 'utf8');
topbar = topbar.replace(/T盻貧g quan/g, 'Tổng quan')
  .replace(/Qu蘯｣n lﾃｽ Khﾃ｡ch hﾃng/g, 'Quản lý Khách hàng')
  .replace(/Qu蘯｣n lﾃｽ C盻･c Thu蘯ｿ/g, 'Quản lý Cục Thuế')
  .replace(/H盻・sﾆ｡ Nenkin/g, 'Hồ sơ Nenkin')
  .replace(/Qu蘯｣n lﾃｽ Nhﾃ｢n s盻ｱ/g, 'Quản lý Nhân sự')
  .replace(/Tﾃi chﾃｭnh & Hoa h盻渡g/g, 'Tài chính & Hoa hồng')
  .replace(/Cﾃi ﾄ黛ｺｷt h盻・th盻創g/g, 'Cài đặt hệ thống')
  .replace(/Tﾃｬm ki蘯ｿm khﾃ｡ch hﾃng, h盻・sﾆ｡.../g, 'Tìm kiếm khách hàng, hồ sơ...')
  .replace(/Nguy盻・ Vﾄハ A/g, 'Nguyễn Văn A')
  .replace(/Qu蘯｣n lﾃｽ \(Manager\)/g, 'Quản lý (Manager)');
fs.writeFileSync(topbarPath, topbar, 'utf8');

const pagePath = path.join(__dirname, '../../src/app/page.tsx');
let page = fs.readFileSync(pagePath, 'utf8');
page = page.replace(/T盻貧g Khﾃ｡ch hﾃng/g, 'Tổng Khách hàng')
  .replace(/H盻・sﾆ｡ ﾄ疎ng x盻ｭ lﾃｽ/g, 'Hồ sơ đang xử lý')
  .replace(/Hoﾃn thﾃnh \(L蘯ｧn 1\)/g, 'Hoàn thành (Lần 1)')
  .replace(/Doanh thu d盻ｱ ki蘯ｿn/g, 'Doanh thu dự kiến')
  .replace(/Nguy盻・ Tr蘯ｧn A/g, 'Nguyễn Trần A')
  .replace(/ﾄ紳ng x盻ｭ lﾃｽ L1/g, 'Đang xử lý L1')
  .replace(/Lﾃｪ Th盻・B/g, 'Lê Thị B')
  .replace(/Ch盻・duy盻㏄/g, 'Chờ duyệt')
  .replace(/Ph蘯｡m Vﾄハ C/g, 'Phạm Văn C')
  .replace(/Hoﾃn thﾃnh L1/g, 'Hoàn thành L1')
  .replace(/Tr蘯ｧn ﾄ雪ｺ｡i D/g, 'Trần Đại D')
  .replace(/ﾄ紳ng x盻ｭ lﾃｽ L2/g, 'Đang xử lý L2')
  .replace(/T盻貧g quan \(Dashboard\)/g, 'Tổng quan (Dashboard)')
  .replace(/Theo dﾃｵi cﾃ｡c ch盻・s盻・quan tr盻肱g vﾃ ti蘯ｿn ﾄ黛ｻ・h盻・sﾆ｡ Nenkin\./g, 'Theo dõi các chỉ số quan trọng và tiến độ hồ sơ Nenkin.')
  .replace(/so v盻嬖 thﾃ｡ng trﾆｰ盻嫩/g, 'so với tháng trước')
  .replace(/H盻・sﾆ｡ c蘯ｭp nh蘯ｭt g蘯ｧn ﾄ妥｢y/g, 'Hồ sơ cập nhật gần đây')
  .replace(/Xem t蘯･t c蘯｣/g, 'Xem tất cả')
  .replace(/Mﾃ｣ HS/g, 'Mã HS')
  .replace(/Khﾃ｡ch hﾃng/g, 'Khách hàng')
  .replace(/Tr蘯｡ng thﾃ｡i/g, 'Trạng thái')
  .replace(/Ngﾃy n盻冪/g, 'Ngày nộp')
  .replace(/D盻ｱ ki蘯ｿn nh蘯ｭn/g, 'Dự kiến nhận')
  .replace(/Thao tﾃ｡c nhanh/g, 'Thao tác nhanh')
  .replace(/Thﾃｪm khﾃ｡ch hﾃng m盻嬖/g, 'Thêm khách hàng mới')
  .replace(/T蘯｡o profile khﾃ｡ch hﾃng/g, 'Tạo profile khách hàng')
  .replace(/T蘯｡o h盻・sﾆ｡ Nenkin/g, 'Tạo hồ sơ Nenkin')
  .replace(/Scan Zairyu card & t盻ｱ ﾄ訴盻］ form/g, 'Scan Zairyu card & tự điền form')
  .replace(/Tﾃｭnh toﾃ｡n chi phﾃｭ/g, 'Tính toán chi phí')
  .replace(/Bﾃ｡o giﾃ｡ Nenkin & t盻ｷ giﾃ｡/g, 'Báo giá Nenkin & tỷ giá');
fs.writeFileSync(pagePath, page, 'utf8');

const hrPath = path.join(__dirname, '../../src/app/hr/page.tsx');
let hr = fs.readFileSync(hrPath, 'utf8');
hr = hr.replace(/ﾄ雪ｺｷng Thﾃｹy Dung/g, 'Đặng Thùy Dung')
  .replace(/Chuyﾃｪn viﾃｪn X盻ｭ lﾃｽ/g, 'Chuyên viên Xử lý')
  .replace(/Nghi盻㎝ v盻･ Nenkin/g, 'Nghiệp vụ Nenkin')
  .replace(/Bﾃｹi Tu蘯･n Anh/g, 'Bùi Tuấn Anh')
  .replace(/C盻冢g tﾃ｡c viﾃｪn/g, 'Cộng tác viên')
  .replace(/Hoﾃng Minh Ng盻皇/g, 'Hoàng Minh Ngọc')
  .replace(/Lﾃｽ Ti盻ブ Long/g, 'Lý Tiểu Long')
  .replace(/Trﾆｰ盻殤g nhﾃｳm/g, 'Trưởng nhóm')
  .replace(/Chﾄノ sﾃｳc khﾃ｡ch hﾃng/g, 'Chăm sóc khách hàng')
  .replace(/Qu蘯｣n lﾃｽ Nhﾃ｢n s盻ｱ/g, 'Quản lý Nhân sự')
  .replace(/Qu蘯｣n lﾃｽ danh sﾃ｡ch nhﾃ｢n viﾃｪn vﾃ c盻冢g tﾃ｡c viﾃｪn\./g, 'Quản lý danh sách nhân viên và cộng tác viên.')
  .replace(/H盻ｧy thﾃｪm m盻嬖/g, 'Hủy thêm mới')
  .replace(/Thﾃｪm Nhﾃ｢n s盻ｱ m盻嬖/g, 'Thêm Nhân sự mới')
  .replace(/Thﾃｪm Nhﾃ｢n s盻ｱ/g, 'Thêm Nhân sự')
  .replace(/ﾄ進盻］ thﾃｴng tin ﾄ黛ｻ・c蘯･p tﾃi kho蘯｣n cho nhﾃ｢n s盻ｱ ho蘯ｷc CTV m盻嬖\./g, 'Điền thông tin để cấp tài khoản cho nhân sự hoặc CTV mới.')
  .replace(/H盻・vﾃ tﾃｪn/g, 'Họ và tên')
  .replace(/Nh蘯ｭp h盻・vﾃ tﾃｪn\.\.\./g, 'Nhập họ và tên...')
  .replace(/V盻・trﾃｭ \/ Ch盻ｩc v盻･/g, 'Vị trí / Chức vụ')
  .replace(/VD: Chuyﾃｪn viﾃｪn, C盻冢g tﾃ｡c viﾃｪn\.\.\./g, 'VD: Chuyên viên, Cộng tác viên...')
  .replace(/Phﾃｲng ban/g, 'Phòng ban')
  .replace(/VD: Kinh doanh, K蘯ｿ toﾃ｡n\.\.\./g, 'VD: Kinh doanh, Kế toán...')
  .replace(/Email cﾃｴng vi盻㌘/g, 'Email công việc')
  .replace(/Nh蘯ｭp email\.\.\./g, 'Nhập email...')
  .replace(/H盻ｧy/g, 'Hủy')
  .replace(/Lﾆｰu Nhﾃ｢n s盻ｱ/g, 'Lưu Nhân sự')
  .replace(/Tﾃｬm ki蘯ｿm nhﾃ｢n s盻ｱ\.\.\./g, 'Tìm kiếm nhân sự...')
  .replace(/Mﾃ｣ NV/g, 'Mã NV')
  .replace(/Vai trﾃｲ/g, 'Vai trò')
  .replace(/Tr蘯｡ng thﾃ｡i/g, 'Trạng thái')
  .replace(/Thao tﾃ｡c/g, 'Thao tác')
  .replace(/Ho蘯｡t ﾄ黛ｻ冢g/g, 'Hoạt động')
  .replace(/Ngh盻・phﾃｩp/g, 'Nghỉ phép');
fs.writeFileSync(hrPath, hr, 'utf8');

console.log('Mojibake fixed in 3 files.');
