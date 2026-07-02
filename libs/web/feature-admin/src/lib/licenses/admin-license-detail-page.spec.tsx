import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminLicenseDetailPage } from './admin-license-detail-page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@gamestore/web/data-access', () => ({
  getAdminLicense: vi.fn().mockResolvedValue({
    id: 'lic-1',
    licenseKey: 'GS-ABCD-EF12-3456',
    gameId: 'game-1',
    gameTitle: 'Demo Game',
    status: 'available',
    buyerEmail: 'buyer@example.com',
    buyerCountry: null,
    ownerEmail: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    activatedAt: null,
    source: 'admin',
    subscriptionId: null,
    validFrom: '2024-01-01T00:00:00.000Z',
    expiresAt: null,
  }),
  updateAdminLicense: vi.fn(),
  revokeAdminLicense: vi.fn(),
  deleteAdminLicense: vi.fn(),
  isSetupResponse: () => false,
  apiErrorMessage: (error: unknown) =>
    error instanceof Error ? error.message : 'Request failed',
}));

describe('AdminLicenseDetailPage', () => {
  it('renders license key, copy, save, and revoke actions', async () => {
    render(<AdminLicenseDetailPage licenseId="lic-1" />);

    expect(await screen.findByRole('heading', { name: 'License details' })).toBeTruthy();
    expect(screen.getByTestId('admin-license-detail-key').textContent).toContain(
      'GS-ABCD-EF12-3456',
    );
    expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Revoke' })).toBeTruthy();
    expect(screen.getByTestId('admin-license-delete-section')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Delete license' })).toBeTruthy();
    expect(screen.getByTestId('admin-license-detail-status').textContent).toContain(
      'admin',
    );
    expect(screen.getByDisplayValue('buyer@example.com')).toBeTruthy();
    expect(document.querySelector('input[name="expiresAt"]')).toBeTruthy();
  });
});
