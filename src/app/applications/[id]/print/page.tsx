'use client';

import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import PrintModal from '../print-modal';

export default function StandalonePrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params?.id as string;
  const template = searchParams.get('template') || undefined;

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.opener) {
      window.close();
    } else {
      router.push(`/applications/${id}`);
    }
  };

  if (!id) return null;

  return (
    <PrintModal
      isOpen={true}
      id={id}
      initialTemplate={template}
      onClose={handleClose}
    />
  );
}