import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in?redirect_url=/account');
  }

  return children;
}
