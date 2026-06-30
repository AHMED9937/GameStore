import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FaqPage } from './faq-page';

describe('FaqPage', () => {
  it('renders FAQ shell', () => {
    render(<FaqPage />);
    expect(screen.getByRole('heading', { name: 'FAQ' })).toBeTruthy();
  });
});
