'use client';

import { useParams } from 'next/navigation';
import CertificateConfigStudio from '@/app/components/CertificateConfigStudio';

export default function AdminCertificateDetailPage() {
  const { id } = useParams<{ id: string }>();

  return <CertificateConfigStudio certificateId={id} basePath="/admin" />;
}
