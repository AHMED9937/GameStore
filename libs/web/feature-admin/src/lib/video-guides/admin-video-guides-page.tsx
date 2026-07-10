'use client';

import { Container } from '@gamestore/shared/ui';
import { AdminPageHeader } from '../components/admin-page-header';
import { AdminPageShell } from '../components/admin-page-shell';
import { AdminActivationVideoSettings } from './admin-activation-video-settings';
import { AdminFaqUbisoftSettings } from './admin-faq-ubisoft-settings';

export function AdminVideoGuidesPage() {
  return (
    <Container>
      <AdminPageShell>
        <AdminPageHeader
          title="Video guides"
          description="Manage store-wide activation videos and FAQ guide links shown to customers."
        />
        <AdminActivationVideoSettings />
        <AdminFaqUbisoftSettings />
      </AdminPageShell>
    </Container>
  );
}
