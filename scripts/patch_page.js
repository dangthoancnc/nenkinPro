const fs = require('fs');
const file = 'src/app/applications/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add states
content = content.replace(
  'const [isEditing, setIsEditing] = useState(isNew);',
  `const [isEditing, setIsEditing] = useState(isNew);
  const [editZairyu, setEditZairyu] = useState(isNew);
  const [editPassport, setEditPassport] = useState(isNew);
  const [editNenkin, setEditNenkin] = useState(isNew);
  const [editBank, setEditBank] = useState(isNew);
  const [editDeparture, setEditDeparture] = useState(isNew);
  const [editApp, setEditApp] = useState(isNew);
  const [editTaxOffice, setEditTaxOffice] = useState(isNew);`
);

// 2. Replace section headers and disabled props
// Zairyu
content = content.replace(
  '<div className="text-xs font-semibold text-indigo-600 border-b pb-1">THÔNG TIN THẺ NGOẠI KIỀU</div>',
  `<div className="flex items-center justify-between border-b pb-1">
    <div className="text-xs font-semibold text-indigo-600">THÔNG TIN THẺ NGOẠI KIỀU</div>
    <div className="flex gap-2">
      {!editZairyu ? (
        <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] px-2 py-0" onClick={() => setEditZairyu(true)}>Sửa</Button>
      ) : (
        <Button type="button" size="sm" className="h-6 text-[10px] px-2 py-0 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => { setEditZairyu(false); toast.success('Đã lưu tạm thông tin Thẻ ngoại kiều'); }}>Lưu</Button>
      )}
    </div>
  </div>`
);
// replace disabled={!isEditing} with disabled={!editZairyu} inside zairyu block
const zairyuBlockStart = content.indexOf("case 'zairyuFront':");
const passportBlockStart = content.indexOf("case 'passport':");
let zairyuBlock = content.substring(zairyuBlockStart, passportBlockStart);
zairyuBlock = zairyuBlock.replace(/disabled=\{!isEditing\}/g, 'disabled={!editZairyu}');
content = content.substring(0, zairyuBlockStart) + zairyuBlock + content.substring(passportBlockStart);

// Passport
content = content.replace(
  '<div className="text-xs font-semibold text-indigo-600 border-b pb-1">THÔNG TIN HỘ CHIẾU</div>',
  `<div className="flex items-center justify-between border-b pb-1">
    <div className="text-xs font-semibold text-indigo-600">THÔNG TIN HỘ CHIẾU</div>
    <div className="flex gap-2">
      {!editPassport ? (
        <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] px-2 py-0" onClick={() => setEditPassport(true)}>Sửa</Button>
      ) : (
        <Button type="button" size="sm" className="h-6 text-[10px] px-2 py-0 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => { setEditPassport(false); toast.success('Đã lưu tạm thông tin Hộ chiếu'); }}>Lưu</Button>
      )}
    </div>
  </div>`
);
const nenkinBlockStart = content.indexOf("case 'nenkinBook':");
let passportBlock = content.substring(passportBlockStart, nenkinBlockStart);
passportBlock = passportBlock.replace(/disabled=\{!isEditing\}/g, 'disabled={!editPassport}');
content = content.substring(0, passportBlockStart) + passportBlock + content.substring(nenkinBlockStart);

// Nenkin
content = content.replace(
  '<div className="text-xs font-semibold text-indigo-600 border-b pb-1">THÔNG TIN SỔ NENKIN</div>',
  `<div className="flex items-center justify-between border-b pb-1">
    <div className="text-xs font-semibold text-indigo-600">THÔNG TIN SỔ NENKIN</div>
    <div className="flex gap-2">
      {!editNenkin ? (
        <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] px-2 py-0" onClick={() => setEditNenkin(true)}>Sửa</Button>
      ) : (
        <Button type="button" size="sm" className="h-6 text-[10px] px-2 py-0 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => { setEditNenkin(false); toast.success('Đã lưu tạm thông tin Sổ Nenkin'); }}>Lưu</Button>
      )}
    </div>
  </div>`
);
const bankBlockStart = content.indexOf("case 'bankPassbook':");
let nenkinBlock = content.substring(nenkinBlockStart, bankBlockStart);
nenkinBlock = nenkinBlock.replace(/disabled=\{!isEditing\}/g, 'disabled={!editNenkin}');
content = content.substring(0, nenkinBlockStart) + nenkinBlock + content.substring(bankBlockStart);

// Bank
content = content.replace(
  '<div className="text-xs font-semibold text-indigo-600 border-b pb-1">THÔNG TIN NGÂN HÀNG</div>',
  `<div className="flex items-center justify-between border-b pb-1">
    <div className="text-xs font-semibold text-indigo-600">THÔNG TIN NGÂN HÀNG</div>
    <div className="flex gap-2">
      {!editBank ? (
        <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] px-2 py-0" onClick={() => setEditBank(true)}>Sửa</Button>
      ) : (
        <Button type="button" size="sm" className="h-6 text-[10px] px-2 py-0 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => { setEditBank(false); toast.success('Đã lưu tạm thông tin Ngân hàng'); }}>Lưu</Button>
      )}
    </div>
  </div>`
);
const departureBlockStart = content.indexOf("case 'departureStamp':");
let bankBlock = content.substring(bankBlockStart, departureBlockStart);
bankBlock = bankBlock.replace(/disabled=\{!isEditing\}/g, 'disabled={!editBank}');
content = content.substring(0, bankBlockStart) + bankBlock + content.substring(departureBlockStart);

// Departure
content = content.replace(
  '<div className="text-xs font-semibold text-indigo-600 border-b pb-1">THÔNG TIN VỀ NƯỚC</div>',
  `<div className="flex items-center justify-between border-b pb-1">
    <div className="text-xs font-semibold text-indigo-600">THÔNG TIN VỀ NƯỚC</div>
    <div className="flex gap-2">
      {!editDeparture ? (
        <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] px-2 py-0" onClick={() => setEditDeparture(true)}>Sửa</Button>
      ) : (
        <Button type="button" size="sm" className="h-6 text-[10px] px-2 py-0 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => { setEditDeparture(false); toast.success('Đã lưu tạm thông tin Về nước'); }}>Lưu</Button>
      )}
    </div>
  </div>`
);
const noticeBlockStart = content.indexOf("case 'noticeOfPayment':");
let departureBlock = content.substring(departureBlockStart, noticeBlockStart);
departureBlock = departureBlock.replace(/disabled=\{!isEditing\}/g, 'disabled={!editDeparture}');
content = content.substring(0, departureBlockStart) + departureBlock + content.substring(noticeBlockStart);

// App (Nenkin App Info)
content = content.replace(
  '<h3 className="font-semibold text-sm text-slate-800">Hồ sơ Nenkin</h3>',
  `<div className="flex items-center justify-between w-full">
    <h3 className="font-semibold text-sm text-slate-800">Hồ sơ Nenkin</h3>
    <div className="flex gap-2">
      {!editApp ? (
        <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] px-2 py-0" onClick={() => setEditApp(true)}>Sửa</Button>
      ) : (
        <Button type="button" size="sm" className="h-6 text-[10px] px-2 py-0 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => { setEditApp(false); toast.success('Đã lưu tạm phần Hồ sơ Nenkin'); }}>Lưu</Button>
      )}
    </div>
  </div>`
);
const taxOfficeBlockStart = content.indexOf('CỤC THUẾ QUẢN LÝ');
let appBlock = content.substring(noticeBlockStart, taxOfficeBlockStart);
appBlock = appBlock.replace(/disabled=\{!isEditing\}/g, 'disabled={!editApp}');
content = content.substring(0, noticeBlockStart) + appBlock + content.substring(taxOfficeBlockStart);

// Tax Office
content = content.replace(
  '<h3 className="font-semibold text-slate-800 text-sm">CỤC THUẾ QUẢN LÝ</h3>',
  `<div className="flex items-center justify-between w-full">
    <h3 className="font-semibold text-slate-800 text-sm">CỤC THUẾ QUẢN LÝ</h3>
    <div className="flex gap-2">
      {!editTaxOffice ? (
        <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] px-2 py-0" onClick={() => setEditTaxOffice(true)}>Sửa</Button>
      ) : (
        <Button type="button" size="sm" className="h-6 text-[10px] px-2 py-0 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => { setEditTaxOffice(false); toast.success('Đã lưu tạm phần Cục Thuế'); }}>Lưu</Button>
      )}
    </div>
  </div>`
);
let taxBlock = content.substring(taxOfficeBlockStart);
taxBlock = taxBlock.replace(/disabled=\{!isEditing\}/g, 'disabled={!editTaxOffice}');
content = content.substring(0, taxOfficeBlockStart) + taxBlock;

fs.writeFileSync(file, content);
console.log('Patched edit sections');
