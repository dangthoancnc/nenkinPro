import type { DocumentTemplate } from '../template-schema';

export const donXinLan1Template: DocumentTemplate = {
  id: 'don-xin-lan-1',

  title: '脱退一時金請求書',

  description:
    'Đơn yêu cầu nhận trợ cấp Nenkin một lần — template PDF dạng overlay.',

  category: 'nenkin-withdrawal',

  activeVersionId: null,

  versions: [
    {
      id: 'don-xin-lan-1-v1-draft',
      templateId: 'don-xin-lan-1',
      version: 1,
      status: 'draft',

      sourcePdfPath: '/templates/don_xin_lan_1.pdf',

      pdfFingerprint:
        '00e7d8e9bf909724345d9f428a7c7288a0c4328072e713fdfce70b1e6c949dfc',

      pageCount: 2,

      // Quy ước bắt buộc: origin ở góc trái dưới, đơn vị PDF point.
      coordinateSystem: 'pdf-points-bottom-left',

      createdAt: '2026-07-15T00:00:00.000Z',
      createdBy: 'system-migration',
      changeNote:
        'Initial draft registry. Coordinates must be verified in PDF Mapping Studio.',

      fieldMappings: [
        {
          id: 'customer.full-name',
          label: '氏名 / Họ và tên',
          sourcePath: 'customer.fullName',
          coordinate: { page: 1, x: 0, y: 0 },
          font: { family: 'NotoSansJP', size: 10, color: '#000000' },
          align: 'left',
          maxWidth: 240,
          maxLines: 1,
          baselineOffset: 0,
          splitMode: 'none',
          required: true,
          enabled: true,
          notes: 'Placeholder. Must be positioned and reviewed before publish.',
        },
        {
          id: 'customer.postal-code',
          label: '郵便番号 / Mã bưu điện',
          sourcePath: 'customer.postalCode',
          coordinate: { page: 1, x: 0, y: 0 },
          font: { family: 'NotoSansJP', size: 10, color: '#000000' },
          align: 'center',
          maxLines: 1,
          baselineOffset: 0,
          splitMode: 'postal-code',
          required: true,
          enabled: true,
          notes:
            'Use characterBoxes after mapper review if the PDF has separate boxes.',
        },
        {
          id: 'customer.address',
          label: '住所 / Địa chỉ',
          sourcePath: 'customer.address',
          coordinate: { page: 1, x: 0, y: 0 },
          font: { family: 'NotoSansJP', size: 9, color: '#000000' },
          align: 'left',
          maxWidth: 420,
          maxLines: 2,
          lineHeight: 12,
          baselineOffset: 0,
          splitMode: 'none',
          required: true,
          enabled: true,
          notes: 'Validate Japanese/Vietnamese long-address overflow in preview.',
        },
      ],
    },
  ],
};
