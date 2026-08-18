'use client';

import { useParams } from 'next/navigation';
import CertificateConfigStudio from '@/app/components/CertificateConfigStudio';

export default function OrganizerCertificateDetailPage() {
  const { id } = useParams<{ id: string }>();

  return <CertificateConfigStudio certificateId={id} basePath="/organizer" />;
}
