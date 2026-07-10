import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EMPTY_FAQ_UBISOFT_SETTINGS } from '@gamestore/web/data-access';
import { FaqPage } from './faq-page';

describe('FaqPage', () => {
  it('renders FAQ heading and all questions', () => {
    render(<FaqPage ubisoftSettings={EMPTY_FAQ_UBISOFT_SETTINGS} />);

    expect(screen.getByRole('heading', { name: 'FAQ' })).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        name: /Why are some of my games marked as "to replace"\?/i,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: /How to switch Ubisoft to offline mode\?/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        name: /Will I have my own personal game saves\?/i,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        name: /I lost or forgot my license\. What can I do\?/i,
      }),
    ).toBeTruthy();
  });

  it('toggles accordion panels', () => {
    render(<FaqPage ubisoftSettings={EMPTY_FAQ_UBISOFT_SETTINGS} />);

    const savesButton = screen.getByRole('button', {
      name: /Will I have my own personal game saves\?/i,
    });

    expect(savesButton.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(savesButton);

    expect(savesButton.getAttribute('aria-expanded')).toBe('true');
  });
});
