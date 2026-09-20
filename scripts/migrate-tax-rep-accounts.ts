import prisma from '../src/lib/prisma';

async function main() {
  console.log('=== MIGRATING TAX REPRESENTATIVE BANK ACCOUNTS ===');

  const reps = await prisma.taxRepresentative.findMany({
    include: {
      bankAccounts: true,
      applications: true,
    }
  });

  console.log(`Tìm thấy ${reps.length} Người đại diện thuế.`);

  for (const rep of reps) {
    let defaultAcc = rep.bankAccounts.find(a => a.isDefault) || rep.bankAccounts[0];

    // Nếu chưa có tài khoản nào trong bảng TaxRepBankAccount, tạo từ các trường hiện tại của rep
    if (!defaultAcc && (rep.bankName || rep.accountNumber || rep.yuchoKigo)) {
      defaultAcc = await prisma.taxRepBankAccount.create({
        data: {
          taxRepresentativeId: rep.id,
          isDefault: true,
          bankName: rep.bankName,
          branchName: rep.branchName,
          accountNumber: rep.accountNumber,
          accountName: rep.accountName || rep.fullName,
          accountNameKatakana: rep.accountNameKatakana || rep.fullNameKana,
          isYucho: rep.isYucho,
          bankAccountType: rep.bankAccountType || 'ORDINARY',
          yuchoKigo: rep.yuchoKigo,
          yuchoBango: rep.yuchoBango,
        }
      });
      console.log(`✓ Đã tạo tài khoản mặc định cho ${rep.fullName}: ${rep.bankName || 'Yucho'} (${defaultAcc.id})`);
    }

    // Gán tài khoản này cho các hồ sơ đang tham chiếu tới rep mà chưa có taxRepBankAccountId
    if (defaultAcc) {
      const apps = await prisma.nenkinApplication.findMany({
        where: {
          taxRepresentativeId: rep.id,
          taxRepBankAccountId: null,
        }
      });

      if (apps.length > 0) {
        await prisma.nenkinApplication.updateMany({
          where: {
            taxRepresentativeId: rep.id,
            taxRepBankAccountId: null,
          },
          data: {
            taxRepBankAccountId: defaultAcc.id,
          }
        });
        console.log(`✓ Đã gán tài khoản mặc định (${defaultAcc.bankName || 'Yucho'}) cho ${apps.length} hồ sơ của ${rep.fullName}`);
      }
    }
  }

  console.log('=== HOÀN TẤT MIGRATION TÀI KHOẢN NGÂN HÀNG ĐẠI DIỆN THUẾ ===');
}

main().catch(console.error).finally(() => prisma.$disconnect());
