export interface AddressResolutionInput {
  frontAddress?: string | null;
  frontPostalCode?: string | null;
  backAddress?: string | null;
  backPostalCode?: string | null;
  hasAddressOnBack?: boolean | null;
}

export interface AddressResolutionResult {
  address: string;
  postalCode: string;
  source: 'BACK' | 'FRONT' | null;
}

/**
 * Resolves the official last address (Địa chỉ sau cùng tại Nhật) according to Japanese Immigration Bureau (在留カード) rules:
 * - Ưu tiên 1: Địa chỉ sau cùng tại MẶT SAU (trong bảng 住居地記載欄) nếu có ghi nhận chuyển nhà.
 * - Ưu tiên 2: Địa chỉ tại MẶT TRƯỚC nếu mặt sau trống (chưa từng chuyển nhà).
 */
export function resolveZairyuLastAddress(input: AddressResolutionInput): AddressResolutionResult {
  const backAddr = (input.backAddress || '').trim();
  const hasBackAddr = Boolean(backAddr && input.hasAddressOnBack !== false);

  if (hasBackAddr) {
    return {
      address: backAddr,
      postalCode: (input.backPostalCode || '').trim(),
      source: 'BACK',
    };
  }

  const frontAddr = (input.frontAddress || '').trim();
  if (frontAddr) {
    return {
      address: frontAddr,
      postalCode: (input.frontPostalCode || '').trim(),
      source: 'FRONT',
    };
  }

  return {
    address: '',
    postalCode: '',
    source: null,
  };
}
