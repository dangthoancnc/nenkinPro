# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api\portal-sec.spec.ts >> Portal Security Tests (SEC-003 & SEC-004) >> [TC-06] Lấy Signed URL Hợp lệ
- Location: e2e\api\portal-sec.spec.ts:205:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 500
```

# Test source

```ts
  116 |     // Lần 6 phải trả về 429
  117 |     const resBlocked = await request.post('/api/portal/auth/login', {
  118 |       data: { action: 'login', cardNumber: customerCode, passwordPin: '000000' }
  119 |     });
  120 |     expect(resBlocked.status()).toBe(429);
  121 |   });
  122 | 
  123 |   test('[TC-03] Chặn khách cũ chưa reset PIN', async ({ request }) => {
  124 |     // Đăng ký trước
  125 |     await request.post('/api/portal/auth/register', {
  126 |       data: { action: 'register', cardNumber: customerCode, fullName: 'Test Sec Customer', staffCode, passwordPin: '123456' }
  127 |     });
  128 |     
  129 |     // Set pinResetRequired = true
  130 |     await prisma.customer.updateMany({
  131 |       where: { cardNumber: customerCode },
  132 |       data: { pinResetRequired: true }
  133 |     });
  134 | 
  135 |     // Cố tình đăng nhập bằng mã PIN hợp lệ
  136 |     const res = await request.post('/api/portal/auth/login', {
  137 |       data: { action: 'login', cardNumber: customerCode, passwordPin: '123456' }
  138 |     });
  139 |     expect(res.status()).toBe(403);
  140 |     const data = await res.json();
  141 |     expect(data.requireReset).toBe(true);
  142 |   });
  143 | 
  144 |   test('[TC-04] Đăng nhập thành công & Hủy Session cũ (Single Active Session)', async ({ request }) => {
  145 |     // Đăng ký trước
  146 |     const regRes = await request.post('/api/portal/auth/register', {
  147 |       data: { action: 'register', cardNumber: customerCode, fullName: 'Test Sec Customer', staffCode, passwordPin: '123456' }
  148 |     });
  149 |     
  150 |     const dbCustomer = await prisma.customer.findFirst({ where: { cardNumber: customerCode } });
  151 |     const customerIdLocal = dbCustomer!.id;
  152 | 
  153 |     // Kiểm tra có 1 session trong DB
  154 |     const sessionsBefore = await prisma.customerSession.findMany({ where: { customerId: customerIdLocal } });
  155 |     expect(sessionsBefore.length).toBe(1);
  156 |     expect(sessionsBefore[0].revokedAt).toBeNull();
  157 | 
  158 |     // Đăng nhập thiết bị thứ 2
  159 |     const loginRes = await request.post('/api/portal/auth/login', {
  160 |       data: { action: 'login', cardNumber: customerCode, passwordPin: '123456' }
  161 |     });
  162 |     expect(loginRes.status()).toBe(200);
  163 | 
  164 |     // Session cũ bị revoke, session mới tạo ra
  165 |     const sessionsAfter = await prisma.customerSession.findMany({ 
  166 |       where: { customerId: customerIdLocal },
  167 |       orderBy: { createdAt: 'desc' }
  168 |     });
  169 |     expect(sessionsAfter.length).toBe(2);
  170 |     // Session cũ nhất bị revoke
  171 |     const oldSession = sessionsAfter.find(s => s.id === sessionsBefore[0].id);
  172 |     expect(oldSession?.revokedAt).not.toBeNull();
  173 |     // Session mới nhất vẫn active
  174 |     const newSession = sessionsAfter.find(s => s.id !== sessionsBefore[0].id);
  175 |     expect(newSession?.revokedAt).toBeNull();
  176 |   });
  177 | 
  178 |   test('[TC-05] Data Policy của Endpoint /me', async ({ request }) => {
  179 |     await request.post('/api/portal/auth/register', {
  180 |       data: { action: 'register', cardNumber: customerCode, fullName: 'Test Sec Customer', staffCode, passwordPin: '123456' }
  181 |     });
  182 | 
  183 |     await prisma.customer.updateMany({
  184 |       where: { cardNumber: customerCode },
  185 |       data: { zairyuFrontUrl: '/storage/v1/object/public/nenkin-documents/test-zairyu.jpg' }
  186 |     });
  187 | 
  188 |     const res = await request.get('/api/portal/auth/me');
  189 |     expect(res.status()).toBe(200);
  190 |     const data = await res.json();
  191 |     
  192 |     const customerDto = data.customer;
  193 |     // Không chứa dữ liệu nhạy cảm
  194 |     expect(customerDto.myNumber).toBeUndefined();
  195 |     expect(customerDto.nenkinNumber).toBeUndefined();
  196 |     expect(customerDto.passwordPin).toBeUndefined();
  197 |     expect(customerDto.zairyuFrontUrl).toBeUndefined();
  198 |     
  199 |     // Kiểm tra cờ boolean uploadedDocuments
  200 |     expect(customerDto.uploadedDocuments).toBeDefined();
  201 |     expect(customerDto.uploadedDocuments.zairyuFront).toBe(true);
  202 |     expect(customerDto.uploadedDocuments.passport).toBe(false);
  203 |   });
  204 | 
  205 |   test('[TC-06] Lấy Signed URL Hợp lệ', async ({ request }) => {
  206 |     await request.post('/api/portal/auth/register', {
  207 |       data: { action: 'register', cardNumber: customerCode, fullName: 'Test Sec Customer', staffCode, passwordPin: '123456' }
  208 |     });
  209 | 
  210 |     await prisma.customer.updateMany({
  211 |       where: { cardNumber: customerCode },
  212 |       data: { zairyuFrontUrl: '/storage/v1/object/public/nenkin-documents/test-zairyu.jpg' }
  213 |     });
  214 | 
  215 |     const res = await request.get('/api/portal/documents/zairyuFront/signed-url');
> 216 |     expect(res.status()).toBe(200);
      |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  217 |     const data = await res.json();
  218 |     expect(data.success).toBe(true);
  219 |     expect(data.signedUrl).toContain('token=');
  220 |   });
  221 | 
  222 |   test('[TC-07] Chặn Path Traversal/Injection', async ({ request }) => {
  223 |     await request.post('/api/portal/auth/register', {
  224 |       data: { action: 'register', cardNumber: customerCode, fullName: 'Test Sec Customer', staffCode, passwordPin: '123456' }
  225 |     });
  226 | 
  227 |     const res = await request.get('/api/portal/documents/invalidColumnName/signed-url');
  228 |     expect(res.status()).toBe(400);
  229 |   });
  230 | 
  231 |   test('[TC-08] Cross-owner ngăn chặn truy cập chéo', async ({ request }) => {
  232 |     // Đăng ký
  233 |     await request.post('/api/portal/auth/register', {
  234 |       data: { action: 'register', cardNumber: customerCode, fullName: 'Test Sec Customer', staffCode, passwordPin: '123456' }
  235 |     });
  236 | 
  237 |     // Thử lấy document mà customer này không có file (passportUrl)
  238 |     const res = await request.get('/api/portal/documents/passport/signed-url');
  239 |     expect(res.status()).toBe(404);
  240 |   });
  241 | 
  242 |   test('[TC-09] Đăng xuất & Vô hiệu hóa Token', async ({ request }) => {
  243 |     await request.post('/api/portal/auth/register', {
  244 |       data: { action: 'register', cardNumber: customerCode, fullName: 'Test Sec Customer', staffCode, passwordPin: '123456' }
  245 |     });
  246 | 
  247 |     const logoutRes = await request.post('/api/portal/auth/logout');
  248 |     expect(logoutRes.status()).toBe(200);
  249 |     
  250 |     // Check DB session is revoked
  251 |     const dbCustomer = await prisma.customer.findFirst({ where: { cardNumber: customerCode } });
  252 |     const sessions = await prisma.customerSession.findMany({ where: { customerId: dbCustomer?.id } });
  253 |     expect(sessions[sessions.length - 1].revokedAt).not.toBeNull();
  254 | 
  255 |     // Call /me should fail
  256 |     const meRes = await request.get('/api/portal/auth/me');
  257 |     expect(meRes.status()).toBe(401);
  258 |   });
  259 | });
  260 | 
```