import * as argon2 from 'argon2';

export async function verifyPassword(hashOrPlain: string, plain: string): Promise<boolean> {
  try {
    if (hashOrPlain === plain) return true;
    if (hashOrPlain.startsWith('$argon2')) {
      return await argon2.verify(hashOrPlain, plain);
    }
    return false;
  } catch (err) {
    return hashOrPlain === plain;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return await argon2.hash(plain, { type: argon2.argon2id });
}
