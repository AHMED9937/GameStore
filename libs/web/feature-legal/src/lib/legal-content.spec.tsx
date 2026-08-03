import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LegalContent } from './legal-content';

const sampleMarkdown = `
# Terms of Service

**OfflineGameNia**  
**Last updated:** July 15, 2026

> Disclaimer: not legal advice.

## 1. Acceptance

By using the Service you agree to our [Privacy Policy](./privacy-policy.md) and [Refund Policy](./refund-policy.md).

### 1.1 Eligibility

- You must be **18** or older.
- Follow our [external guide](https://example.com).

| Feature | Value |
| ------- | ----- |
| Support | support@offlinegamenia.com |
`;

describe('LegalContent', () => {
  it('renders the document title and adds an id to headings', () => {
    render(<LegalContent content={sampleMarkdown} />);

    const h1 = screen.getByRole('heading', { level: 1, name: 'Terms of Service' });
    expect(h1.id).toBe('terms-of-service');

    const h2 = screen.getByRole('heading', { level: 2, name: /Acceptance/i });
    expect(h2.id).toBe('1-acceptance');
  });

  it('rewrites internal markdown links to app routes', () => {
    render(<LegalContent content={sampleMarkdown} />);

    const privacyLink = screen.getByRole('link', { name: 'Privacy Policy' });
    expect(privacyLink.getAttribute('href')).toBe('/privacy-policy');

    const refundLink = screen.getByRole('link', { name: 'Refund Policy' });
    expect(refundLink.getAttribute('href')).toBe('/refund-policy');
  });

  it('opens external links in a new tab', () => {
    render(<LegalContent content={sampleMarkdown} />);

    const externalLink = screen.getByRole('link', { name: 'external guide' });
    expect(externalLink.getAttribute('href')).toBe('https://example.com');
    expect(externalLink.getAttribute('target')).toBe('_blank');
    expect(externalLink.getAttribute('rel')).toContain('noopener');
  });

  it('renders tables and blockquotes', () => {
    render(<LegalContent content={sampleMarkdown} />);

    expect(screen.getByText('Disclaimer: not legal advice.')).toBeTruthy();
    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.getByText('support@offlinegamenia.com')).toBeTruthy();
  });

  it('renders lists with strong emphasis', () => {
    render(<LegalContent content={sampleMarkdown} />);

    const listItem = screen.getByText(/You must be/);
    expect(listItem.querySelector('strong')).toBeTruthy();
  });
});
