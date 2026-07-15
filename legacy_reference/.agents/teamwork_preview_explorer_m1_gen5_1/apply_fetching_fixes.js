const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../../src/app/page.tsx');
let page = fs.readFileSync(pagePath, 'utf8');

// Replace mock data in src/app/page.tsx with a fetch from /api/dashboard
const newPage = `'use client';

import { useState, useEffect } from 'react';
import { Users, FileText, Banknote, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';

// Utility to map icon names to Lucide icons
const iconMap: Record<string, any> = {
  Users,
  Clock,
  CheckCircle2,
  TrendingUp,
};

export default function Home() {
  const [kpis, setKpis] = useState<any[]>([]);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard');
        const json = await res.json();
        if (json.success) {
          setKpis(json.data.kpis || []);
          setRecentApplications(json.data.recentApplications || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Tổng quan (Dashboard)</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Theo dõi các chỉ số quan trọng và tiến độ hồ sơ Nenkin.</p>
      </div>

      {loading ? (
        <div className="text-center py-10">Đang tải...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, index) => {
              const Icon = iconMap[kpi.iconName] || Users;
              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{kpi.title}</p>
                        <h3 className="text-2xl font-bold">{kpi.value}</h3>
                      </div>
                      <div className={"w-12 h-12 rounded-lg flex items-center justify-center " + kpi.bg}>
                        <Icon className={"w-6 h-6 " + kpi.color} />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <span className="text-emerald-500 font-medium">{kpi.trend}</span>
                      <span className="text-slate-400 dark:text-slate-500 ml-2">so với tháng trước</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Applications and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Applications */}
            <Card className="lg:col-span-2 overflow-hidden flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <div>
                  <CardTitle>Hồ sơ cập nhật gần đây</CardTitle>
                </div>
                <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700 h-auto p-0">
                  Xem tất cả
                </Button>
              </CardHeader>
              <div className="flex-1 overflow-x-auto p-0">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900">
                    <TableRow>
                      <TableHead className="w-[100px]">Mã HS</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày nộp</TableHead>
                      <TableHead className="text-right">Dự kiến nhận</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentApplications.map((app, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{app.id}</TableCell>
                        <TableCell>{app.name}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            {app.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-500">{app.date}</TableCell>
                        <TableCell className="text-right font-medium">{app.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Thao tác nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all text-left group">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/60 transition-colors">
                    <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-indigo-700 dark:group-hover:text-indigo-400">Thêm khách hàng mới</p>
                    <p className="text-xs text-muted-foreground">Tạo profile khách hàng</p>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all text-left group">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/60 transition-colors">
                    <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-emerald-700 dark:group-hover:text-emerald-400">Tạo hồ sơ Nenkin</p>
                    <p className="text-xs text-muted-foreground">Scan Zairyu card & tự điền form</p>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all text-left group">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center group-hover:bg-amber-200 dark:group-hover:bg-amber-800/60 transition-colors">
                    <Banknote className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-amber-700 dark:group-hover:text-amber-400">Tính toán chi phí</p>
                    <p className="text-xs text-muted-foreground">Báo giá Nenkin & tỷ giá</p>
                  </div>
                </button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
`;
fs.writeFileSync(pagePath, newPage, 'utf8');

const hrPath = path.join(__dirname, '../../src/app/hr/page.tsx');
let hr = fs.readFileSync(hrPath, 'utf8');

let newHr = hr.replace(
  /const staffs = \[[\s\S]*?\];/,
  "const [staffs, setStaffs] = useState<any[]>([]);\n" +
  "  const [loading, setLoading] = useState(true);\n\n" +
  "  React.useEffect(() => {\n" +
  "    async function fetchStaffs() {\n" +
  "      try {\n" +
  "        const res = await fetch('/api/hr/staffs');\n" +
  "        const json = await res.json();\n" +
  "        if (json.success) {\n" +
  "          setStaffs(json.data);\n" +
  "        }\n" +
  "      } catch (e) {\n" +
  "        console.error(e);\n" +
  "      } finally {\n" +
  "        setLoading(false);\n" +
  "      }\n" +
  "    }\n" +
  "    fetchStaffs();\n" +
  "  }, []);"
);

newHr = newHr.replace(
  /\{staffs\.map\(\(staff, index\) => \(/,
  "{loading ? (\n" +
  "                <TableRow>\n" +
  "                  <TableCell colSpan={7} className=\"text-center py-4\">Đang tải...</TableCell>\n" +
  "                </TableRow>\n" +
  "              ) : staffs.map((staff, index) => ("
);
fs.writeFileSync(hrPath, newHr, 'utf8');

const dashPath = path.join(__dirname, '../../src/app/portal/dashboard/page.tsx');
let dash = fs.readFileSync(dashPath, 'utf8');

dash = dash.replace(
  /const handleUpload = \(type: string\) => \{[\s\S]*?\};/,
  "const handleUpload = async (file: File, type: string) => {\n" +
  "    try {\n" +
  "      const formData = new FormData();\n" +
  "      formData.append('file', file);\n" +
  "      formData.append('type', type);\n" +
  "      const res = await fetch('/api/upload', {\n" +
  "        method: 'POST',\n" +
  "        body: formData,\n" +
  "      });\n" +
  "      const data = await res.json();\n" +
  "      if (data.success) {\n" +
  "        alert('Tải lên thành công cho ' + type);\n" +
  "        // Refresh profile\n" +
  "        const profileRes = await fetch('/api/portal/profile');\n" +
  "        if (profileRes.ok) {\n" +
  "          const profileData = await profileRes.json();\n" +
  "          if (profileData.success) {\n" +
  "            setCustomer(profileData.data);\n" +
  "          }\n" +
  "        }\n" +
  "      } else {\n" +
  "        alert('Có lỗi xảy ra: ' + data.error);\n" +
  "      }\n" +
  "    } catch (err) {\n" +
  "      console.error(err);\n" +
  "      alert('Không thể tải lên file');\n" +
  "    }\n" +
  "  };"
);

dash = dash.replace(
  /function DocumentUploadCard\(\{ title, description, icon, url, onUpload \}: \{ title: string; description: string; icon: React\.ReactNode; url: string; onUpload: \(\) => void \}\) \{/,
  "function DocumentUploadCard({ title, description, icon, url, onUpload }: { title: string; description: string; icon: React.ReactNode; url: string; onUpload: (file: File) => void }) {\n" +
  "  const fileInputRef = React.useRef<HTMLInputElement>(null);\n\n" +
  "  const handleClick = () => {\n" +
  "    if (!url) {\n" +
  "      fileInputRef.current?.click();\n" +
  "    }\n" +
  "  };\n\n" +
  "  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {\n" +
  "    if (e.target.files && e.target.files[0]) {\n" +
  "      onUpload(e.target.files[0]);\n" +
  "    }\n" +
  "  };\n"
);

dash = dash.replace(
  /<div \n            onClick=\{onUpload\}/,
  "<input type=\"file\" ref={fileInputRef} className=\"hidden\" onChange={handleFileChange} />\n          <div \n            onClick={handleClick}"
);

dash = dash.replace(
  /onUpload=\{\(\) => handleUpload\('zairyu'\)\}/,
  "onUpload={(file) => handleUpload(file, 'zairyu')}"
);
dash = dash.replace(
  /onUpload=\{\(\) => handleUpload\('passport'\)\}/,
  "onUpload={(file) => handleUpload(file, 'passport')}"
);
dash = dash.replace(
  /onUpload=\{\(\) => handleUpload\('nenkin'\)\}/,
  "onUpload={(file) => handleUpload(file, 'nenkin')}"
);
dash = dash.replace(
  /onUpload=\{\(\) => handleUpload\('bank'\)\}/,
  "onUpload={(file) => handleUpload(file, 'bank')}"
);

dash = dash.replace(
  /import \{ useState, useEffect \} from 'react';/,
  "import React, { useState, useEffect } from 'react';"
);

fs.writeFileSync(dashPath, dash, 'utf8');

console.log('Fetching fixed in 3 files.');
