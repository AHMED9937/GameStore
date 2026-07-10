import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MyGamesFlow } from './my-games-flow';

vi.mock('./validated-license-context', () => ({
  useValidatedLicense: () => ({ step: 'enter' }),
}));

vi.mock('./license-key-form', () => ({
  LicenseKeyForm: () => <div data-testid="license-key-form" />,
}));

vi.mock('./license-game-picker', () => ({
  LicenseGamePicker: () => <div data-testid="license-game-picker" />,
}));

vi.mock('./steam-credentials-view', () => ({
  SteamCredentialsView: () => <div data-testid="steam-credentials-view" />,
}));

vi.mock('./my-licenses-panel', () => ({
  MyLicensesPanel: () => <div data-testid="licenses-panel-props">inline</div>,
}));

vi.mock('./my-subscriptions-panel', () => ({
  MySubscriptionsPanel: () => <div data-testid="subscriptions-panel-props">inline</div>,
}));

describe('MyGamesFlow', () => {
  it('renders section content without full-page loading overlay', () => {
    render(<MyGamesFlow />);

    expect(screen.queryByTestId('my-games-initial-loading-overlay')).toBeNull();
    expect(screen.getByTestId('licenses-panel-props').textContent).toContain('inline');
    expect(screen.getByTestId('subscriptions-panel-props').textContent).toContain('inline');
    expect(screen.getByTestId('license-key-form')).toBeTruthy();
    expect(
      screen.getByText(
        /Enter a license key from your purchase, or pick one from your account./i,
      ),
    ).toBeTruthy();
  });
});
