const fs = require('fs');
const file = 'src/app/applications/[id]/page.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const stateInjection = `  const [editZairyu, setEditZairyu] = useState(isNew);
  const [editPassport, setEditPassport] = useState(isNew);
  const [editNenkin, setEditNenkin] = useState(isNew);
  const [editBank, setEditBank] = useState(isNew);
  const [editDeparture, setEditDeparture] = useState(isNew);
  const [editApp, setEditApp] = useState(isNew);
  const [editTaxOffice, setEditTaxOffice] = useState(isNew);`;

let currentEditState = 'isEditing';

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  if (line.includes('const [isEditing, setIsEditing] = useState(isNew);')) {
    lines[i] = line + '\n' + stateInjection;
  }

  // Zairyu
  if (line.includes('THÔNG TIN THẺ NGOẠI KIỀU')) {
    currentEditState = 'editZairyu';
    lines[i] = `                      <div className="flex items-center justify-between border-b pb-1">
                        <div className="text-xs font-semibold text-indigo-600">THÔNG TIN THẺ NGOẠI KIỀU</div>
                        <div className="flex gap-2">
                          {!editZairyu ? (
                            <button type="button" className="h-6 text-[10px] px-2 py-0 border rounded text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => setEditZairyu(true)}>Sửa</button>
                          ) : (
                            <button type="button" className="h-6 text-[10px] px-2 py-0 border rounded bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => setEditZairyu(false)}>Lưu tạm</button>
                          )}
                        </div>
                      </div>`;
  }
  
  // Passport
  else if (line.includes('THÔNG TIN HỘ CHIẾU')) {
    currentEditState = 'editPassport';
    lines[i] = `                      <div className="flex items-center justify-between border-b pb-1">
                        <div className="text-xs font-semibold text-indigo-600">THÔNG TIN HỘ CHIẾU</div>
                        <div className="flex gap-2">
                          {!editPassport ? (
                            <button type="button" className="h-6 text-[10px] px-2 py-0 border rounded text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => setEditPassport(true)}>Sửa</button>
                          ) : (
                            <button type="button" className="h-6 text-[10px] px-2 py-0 border rounded bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => setEditPassport(false)}>Lưu tạm</button>
                          )}
                        </div>
                      </div>`;
  }

  // Nenkin
  else if (line.includes('THÔNG TIN SỔ NENKIN')) {
    currentEditState = 'editNenkin';
    lines[i] = `                      <div className="flex items-center justify-between border-b pb-1">
                        <div className="text-xs font-semibold text-indigo-600">THÔNG TIN SỔ NENKIN</div>
                        <div className="flex gap-2">
                          {!editNenkin ? (
                            <button type="button" className="h-6 text-[10px] px-2 py-0 border rounded text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => setEditNenkin(true)}>Sửa</button>
                          ) : (
                            <button type="button" className="h-6 text-[10px] px-2 py-0 border rounded bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => setEditNenkin(false)}>Lưu tạm</button>
                          )}
                        </div>
                      </div>`;
  }

  // Bank
  else if (line.includes('THÔNG TIN NGÂN HÀNG TRẢ TIỀN')) {
    currentEditState = 'editBank';
    lines[i] = `                      <div className="flex items-center justify-between border-b pb-1">
                        <div className="text-xs font-semibold text-indigo-600">THÔNG TIN NGÂN HÀNG TRẢ TIỀN</div>
                        <div className="flex gap-2">
                          {!editBank ? (
                            <button type="button" className="h-6 text-[10px] px-2 py-0 border rounded text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => setEditBank(true)}>Sửa</button>
                          ) : (
                            <button type="button" className="h-6 text-[10px] px-2 py-0 border rounded bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => setEditBank(false)}>Lưu tạm</button>
                          )}
                        </div>
                      </div>`;
  }

  // Departure
  else if (line.includes('THÔNG TIN DẤU XUẤT CẢNH')) {
    currentEditState = 'editDeparture';
    lines[i] = `                      <div className="flex items-center justify-between border-b pb-1">
                        <div className="text-xs font-semibold text-indigo-600">THÔNG TIN DẤU XUẤT CẢNH</div>
                        <div className="flex gap-2">
                          {!editDeparture ? (
                            <button type="button" className="h-6 text-[10px] px-2 py-0 border rounded text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => setEditDeparture(true)}>Sửa</button>
                          ) : (
                            <button type="button" className="h-6 text-[10px] px-2 py-0 border rounded bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => setEditDeparture(false)}>Lưu tạm</button>
                          )}
                        </div>
                      </div>`;
  }

  // App
  else if (line.includes('>Hồ sơ Nenkin</h3>')) {
    currentEditState = 'editApp';
    lines[i] = `                  <div className="flex items-center justify-between w-full mb-3">
                    <h3 className="font-semibold text-sm text-slate-800">Hồ sơ Nenkin</h3>
                    <div className="flex gap-2">
                      {!editApp ? (
                        <button type="button" className="h-6 text-[10px] px-2 py-0 border rounded text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => setEditApp(true)}>Sửa</button>
                      ) : (
                        <button type="button" className="h-6 text-[10px] px-2 py-0 border rounded bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => setEditApp(false)}>Lưu tạm</button>
                      )}
                    </div>
                  </div>`;
  }

  // Tax Office
  else if (line.includes('CỤC THUẾ QUẢN LÝ</h3>')) {
    currentEditState = 'editTaxOffice';
    lines[i] = `                <div className="flex items-center justify-between w-full mb-3">
                  <h3 className="font-semibold text-slate-800 text-sm">CỤC THUẾ QUẢN LÝ</h3>
                  <div className="flex gap-2">
                    {!editTaxOffice ? (
                      <button type="button" className="h-6 text-[10px] px-2 py-0 border rounded text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => setEditTaxOffice(true)}>Sửa</button>
                    ) : (
                      <button type="button" className="h-6 text-[10px] px-2 py-0 border rounded bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => setEditTaxOffice(false)}>Lưu tạm</button>
                    )}
                  </div>
                </div>`;
  }

  // Reset back to isEditing when exiting the forms context
  else if (line.includes('</form>')) {
    currentEditState = 'isEditing';
  }

  // Replace disabled prop based on current section
  if (currentEditState !== 'isEditing' && line.includes('disabled={!isEditing}')) {
    lines[i] = line.replace(/disabled=\{!isEditing\}/g, `disabled={!${currentEditState}}`);
  }
}

fs.writeFileSync(file, lines.join('\n'));
console.log('Safe patch completed');
