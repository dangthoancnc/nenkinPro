import { cookies } from 'next/headers';
import prisma from './prisma';

export async function validateEmployee() {
  const cookieStore = await cookies();
  const employeeAuth = cookieStore.get('employee_auth')?.value;

  if (!employeeAuth) {
    return null;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(employeeAuth)) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: employeeAuth }
    });
    return user;
  } catch (error) {
    console.error('Database validation error:', error);
    return null;
  }
}
