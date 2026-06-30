import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@gamestore/shared/theme';
import { SiteShell } from '../components/layout/site-shell';
import { clerkAppearance } from '../lib/clerk-appearance';
import './global.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '700'],
});

export const metadata = {
  title: 'GameStore',
  description: 'Premium offline game activation store',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${plusJakarta.variable} ${spaceGrotesk.variable}`}>
      <body>
        <ClerkProvider
          appearance={clerkAppearance}
          signInFallbackRedirectUrl="/auth/redirect"
          signUpFallbackRedirectUrl="/auth/redirect"
        >
          <ThemeProvider>
            <SiteShell>{children}</SiteShell>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
