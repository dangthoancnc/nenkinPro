import { notFound, redirect } from 'next/navigation';
import PdfMappingStudio from '@/features/templates/components/PdfMappingStudio';
import { getTemplate } from '@/features/templates/template-registry';
import { requireRole } from '@/lib/auth/authorization';

type MapperPageProps = {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ versionId?: string }>;
};

export default async function TemplateMapperPage({
  params,
  searchParams,
}: MapperPageProps) {
  const { user, error } = await requireRole(['ADMIN', 'MANAGER']);
  if (error || !user) redirect('/login');

  const { templateId } = await params;
  const resolvedSearchParams = await searchParams;
  const versionId = resolvedSearchParams?.versionId;

  const template = getTemplate(templateId);
  if (!template) notFound();

  const version =
    template.versions.find((item) => item.id === versionId) ??
    template.versions[0];

  if (!version) notFound();

  return (
    <main className="mx-auto max-w-[1680px] px-4 py-8 md:px-8">
      <PdfMappingStudio
        templateId={template.id}
        initialVersion={version}
        pdfUrl={version.sourcePdfPath}
      />
    </main>
  );
}
