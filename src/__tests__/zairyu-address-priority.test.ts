import { describe, it, expect } from 'vitest';
import { resolveZairyuLastAddress } from '../lib/zairyuAddressResolver';

describe('resolveZairyuLastAddress - Japanese Zairyu Card Last Address Priority', () => {
  it('prioritizes back address over front address when back address exists', () => {
    const result = resolveZairyuLastAddress({
      frontAddress: '愛知県名古屋市中区栄1-1-1',
      frontPostalCode: '4600008',
      backAddress: '東京都新宿区歌舞伎町2-2-2',
      backPostalCode: '1600021',
      hasAddressOnBack: true,
    });

    expect(result.address).toBe('東京都新宿区歌舞伎町2-2-2');
    expect(result.postalCode).toBe('1600021');
    expect(result.source).toBe('BACK');
  });

  it('falls back to front address when back has no address registered (blank table)', () => {
    const result = resolveZairyuLastAddress({
      frontAddress: '愛知県名古屋市中区栄1-1-1',
      frontPostalCode: '4600008',
      backAddress: '',
      backPostalCode: '',
      hasAddressOnBack: false,
    });

    expect(result.address).toBe('愛知県名古屋市中区栄1-1-1');
    expect(result.postalCode).toBe('4600008');
    expect(result.source).toBe('FRONT');
  });

  it('falls back to front address when back address is not provided at all', () => {
    const result = resolveZairyuLastAddress({
      frontAddress: '大阪府大阪市北区梅田1-1-1',
      frontPostalCode: '5300001',
    });

    expect(result.address).toBe('大阪府大阪市北区梅田1-1-1');
    expect(result.postalCode).toBe('5300001');
    expect(result.source).toBe('FRONT');
  });

  it('returns empty when neither front nor back address is present', () => {
    const result = resolveZairyuLastAddress({
      frontAddress: '',
      backAddress: '',
      hasAddressOnBack: false,
    });

    expect(result.address).toBe('');
    expect(result.postalCode).toBe('');
    expect(result.source).toBeNull();
  });

  it('handles whitespace trimming correctly', () => {
    const result = resolveZairyuLastAddress({
      frontAddress: '  愛知県名古屋市   ',
      backAddress: '  神奈川県横浜市中区   ',
      hasAddressOnBack: true,
    });

    expect(result.address).toBe('神奈川県横浜市中区');
    expect(result.source).toBe('BACK');
  });
});
