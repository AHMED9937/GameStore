import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { Container } from '@gamestore/shared/ui';
import { LegalContent } from './legal-content';
import styles from './legal-page.module.css';

export type LegalDocument = 'terms' | 'privacy' | 'refund';

const LEGAL_DOCUMENTS: Record<LegalDocument, { file: string }> = {
  terms: { file: 'terms-of-service.md' },
  privacy: { file: 'privacy-policy.md' },
  refund: { file: 'refund-policy.md' },
};

function findDocsLegalDir(): string {
  // `process.cwd()` differs between `next build` (repo root) and `next dev` (apps/web).
  // Walk up from cwd until we find the workspace `docs/legal` folder so the same code works in
  // both build-time prerendering and local dev server.
  let current = process.cwd();
  for (let depth = 0; depth < 5; depth++) {
    const candidate = path.join(current, 'docs/legal');
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  throw new Error('Could not find docs/legal directory');
}

function loadLegalDoc(file: string): string {
  const filePath = path.join(findDocsLegalDir(), file);
  if (!existsSync(filePath)) {
    throw new Error(`Could not find legal document: ${file}`);
  }
  return readFileSync(filePath, 'utf8');
}

export type LegalPageProps = {
  document: LegalDocument;
};

export function LegalPage({ document }: LegalPageProps) {
  const { file } = LEGAL_DOCUMENTS[document];
  const content = loadLegalDoc(file);

  return (
    <section className={styles.section}>
      <Container className={styles.contentWrapper}>
        <LegalContent content={content} />
      </Container>
    </section>
  );
}
