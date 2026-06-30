import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { MyGamesPage } from '@gamestore/web/feature-my-games';

export default async function MyGamesRoutePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in?redirect_url=/my-games');
  }

  return <MyGamesPage />;
}
