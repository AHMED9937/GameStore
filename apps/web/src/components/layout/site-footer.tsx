'use client';

import Link from 'next/link';
import { Button, Container, Input } from '@gamestore/shared/ui';
import styles from './layout.module.css';

const EXPLORE_LINKS = [
  { href: '/shop', label: 'All Games' },
  { href: '/shop', label: 'Subscriptions' },
  { href: '/shop', label: 'Special Offers' },
] as const;

const SUPPORT_LINKS = [
  { href: '/my-games', label: 'My Games' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact Us' },
] as const;

const discordInviteUrl =
  process.env['NEXT_PUBLIC_DISCORD_INVITE_URL']?.trim() || 'https://discord.gg/';

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <Container className={styles.footerGrid}>
        <div className={styles.footerBrand}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon} aria-hidden>
              ◆
            </span>
            <span className={styles.logoText}>GameStore</span>
          </Link>
          <p>
            Premium offline game activation service. Get instant access to the biggest PC
            game releases safely, affordably, and automatically.
          </p>
          <div className={styles.socialLinks}>
            <a
              href={discordInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
              aria-label="Discord"
            >
              D
            </a>
            <a href="#" className={styles.socialBtn} aria-label="Telegram">
              T
            </a>
            <a href="#" className={styles.socialBtn} aria-label="YouTube">
              Y
            </a>
          </div>
        </div>

        <div className={styles.footerLinks}>
          <h4>Explore</h4>
          <ul>
            {EXPLORE_LINKS.map(({ href, label }) => (
              <li key={label}>
                <Link href={href}>{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.footerLinks}>
          <h4>Support</h4>
          <ul>
            {SUPPORT_LINKS.map(({ href, label }) => (
              <li key={label}>
                <Link href={href}>{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.footerNewsletter}>
          <h4>Stay Updated</h4>
          <p className={styles.newsletterNote}>
            Subscribe to get notified about new release additions.
          </p>
          <form
            className={styles.newsletterForm}
            onSubmit={(e) => e.preventDefault()}
          >
            <Input type="email" placeholder="Your email address" aria-label="Email" />
            <Button type="submit" variant="primary">
              Subscribe
            </Button>
          </form>
        </div>
      </Container>

      <Container className={styles.footerBottom}>
        <p>&copy; {new Date().getFullYear()} GameStore. All rights reserved.</p>
        <div className={styles.footerBottomLinks}>
          <a href="#">Terms of Service</a>
          <a href="#">Privacy Policy</a>
        </div>
      </Container>
    </footer>
  );
}
