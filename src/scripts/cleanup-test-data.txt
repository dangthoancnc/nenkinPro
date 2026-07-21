import prisma from '../lib/prisma';

async function cleanupTestData() {
  console.log('=== Bắt đầu dọn dữ liệu test ===\n');

  // 1. Tìm tất cả "Test Customer"
  const testCustomers = await prisma.customer.findMany({
    where: { fullName: 'Test Customer' },
    select: { id: true, fullName: true, code: true }
  });
  console.log(`Tìm thấy ${testCustomers.length} Test Customer`);

  if (testCustomers.length > 0) {
    const customerIds = testCustomers.map(c => c.id);

    // Xóa transfer requests liên quan
    const delTransfers = await prisma.transferRequest.deleteMany({
      where: { customerId: { in: customerIds } }
    });
    console.log(`  - Xóa ${delTransfers.count} transfer requests`);

    // Xóa applications liên quan
    const delApps = await prisma.nenkinApplication.deleteMany({
      where: { customerId: { in: customerIds } }
    });
    console.log(`  - Xóa ${delApps.count} applications`);

    // Xóa customers
    const delCustomers = await prisma.customer.deleteMany({
      where: { fullName: 'Test Customer' }
    });
    console.log(`  - Xóa ${delCustomers.count} Test Customer ✓`);
  }

  // 2. Tìm tất cả "Test Employee" 
  const testEmployees = await prisma.user.findMany({
    where: { 
      OR: [
        { name: 'Test Employee' },
        { email: { contains: 'test-employee' } },
        { email: { contains: '@example.com' } }
      ]
    },
    select: { id: true, name: true, email: true }
  });
  console.log(`\nTìm thấy ${testEmployees.length} Test Employee`);

  if (testEmployees.length > 0) {
    const userIds = testEmployees.map(u => u.id);

    // Cập nhật customers được tạo bởi test employees (set createdById = null)
    const updateCustomers = await prisma.customer.updateMany({
      where: { createdById: { in: userIds } },
      data: { createdById: null }
    });
    console.log(`  - Gỡ liên kết ${updateCustomers.count} customers`);

    // Xóa transfer requests liên quan  
    const delTransfersSent = await prisma.transferRequest.deleteMany({
      where: { fromUserId: { in: userIds } }
    });
    const delTransfersRecv = await prisma.transferRequest.deleteMany({
      where: { toUserId: { in: userIds } }
    });
    console.log(`  - Xóa ${delTransfersSent.count + delTransfersRecv.count} transfer requests`);

    // Xóa test employees
    const delUsers = await prisma.user.deleteMany({
      where: { id: { in: userIds } }
    });
    console.log(`  - Xóa ${delUsers.count} Test Employee ✓`);
  }

  console.log('\n=== Hoàn tất dọn dữ liệu test ===');
  
  // Hiện tổng số còn lại
  const remainingUsers = await prisma.user.count();
  const remainingCustomers = await prisma.customer.count();
  console.log(`\nCòn lại: ${remainingUsers} nhân sự, ${remainingCustomers} khách hàng`);
}

cleanupTestData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
