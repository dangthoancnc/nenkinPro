import { Customer, OcrResult, NenkinApplication } from '@prisma/client';

export type CustomerWithRelations = Customer & {
  ocrResults?: OcrResult[];
  applications?: NenkinApplication[];
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
    bankPassbookUrl,
    securityPhotoUrl,
    
    accountNumber,
    
    // Extract the rest
    ...safeCustomer
  } = customer;

  // Mask account number
  let maskedAccountNumber = null;
  if (accountNumber && accountNumber.length >= 4) {
    maskedAccountNumber = `****${accountNumber.slice(-4)}`;
  } else if (accountNumber) {
    maskedAccountNumber = `****`;
  }

  // Build metadata for documents
  const documentsMetadata = [];

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

  return {
    ...safeCustomer,
    accountNumber: maskedAccountNumber,
    documentsMetadata,
    applications: (customer.applications || []).map(app => ({
      id: app.id,
      status: app.status,
      applyDate: app.applyDate,
      updatedAt: app.updatedAt,
    }))
  };
}
