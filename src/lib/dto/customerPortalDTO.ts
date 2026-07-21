import { Customer, OcrResult, NenkinApplication } from '@prisma/client';

export type CustomerWithRelations = Customer & {
  ocrResults?: OcrResult[];
  applications?: NenkinApplication[];
  bankAccounts?: any[]; // Allow bankAccounts
};

export function toCustomerPortalDTO(customer: CustomerWithRelations) {
  const {
    myNumber,
    nenkinNumber,
    passwordPin,
    pinResetRequired,
    
    // Omit sensitive URLs
    zairyuFrontUrl,
    zairyuBackUrl,
    passportUrl,
    departureStampUrl,
    nenkinBookUrl,
    securityPhotoUrl,
    
    // Extract the rest
    ...safeCustomer
  } = customer;

  // Mask account number
  const mainBankAccount = customer.bankAccounts && customer.bankAccounts.length > 0 ? customer.bankAccounts[0] : null;
  const accountNumber = mainBankAccount?.accountNumber;
  let maskedAccountNumber = null;
  if (accountNumber && accountNumber.length >= 4) {
    maskedAccountNumber = `****${accountNumber.slice(-4)}`;
  } else if (accountNumber) {
    maskedAccountNumber = `****`;
  }

  // Build metadata for documents
  const documentsMetadata: any[] = [];

  // If there are OCR results, we map them
  if (customer.ocrResults) {
    customer.ocrResults.forEach(ocr => {
      documentsMetadata.push({
        id: ocr.id,
        documentType: ocr.documentType,
        status: 'RECEIVED',
        updatedAt: ocr.updatedAt,
      });
    });
  }

  const hasBankPassbook = customer.bankAccounts?.some(b => (b.bankPassbookUrls && b.bankPassbookUrls.length > 0)) || false;

  return {
    ...safeCustomer,
    accountNumber: maskedAccountNumber,
    documentsMetadata,
    uploadedDocuments: {
      zairyuFront: !!customer.zairyuFrontUrl,
      zairyuBack: !!customer.zairyuBackUrl,
      passport: !!customer.passportUrl,
      departureStamp: !!customer.departureStampUrl,
      nenkinBook: !!customer.nenkinBookUrl,
      bankPassbook: hasBankPassbook,
      securityPhoto: !!customer.securityPhotoUrl,
    },
    applications: (customer.applications || []).map(app => ({
      id: app.id,
      status: app.status,
      applyDate: app.applyDate,
      updatedAt: app.updatedAt,
    }))
  };
}
