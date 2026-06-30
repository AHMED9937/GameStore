import Link from 'next/link';
import { Button } from '@gamestore/shared/ui';
import { AdminPageHeader } from '../components/admin-page-header';

export function AdminGamesHeader() {
  return (
    <AdminPageHeader
      title="Games"
      description="Create, edit, and publish catalog titles."
      actions={
        <Link href="/admin/games/new">
          <Button type="button">Add game</Button>
        </Link>
      }
    />
  );
}
