/**
 * Forum configuration for 🎫 | tickets (Discord "Get Started" checklist items 3–5).
 * Used by scripts/discord-setup.ts — keep in sync with apps/discord-bot ticket copy.
 */

export type ForumTagSpec = {
  name: string;
  emoji_name: string;
  moderated: boolean;
};

export const TICKETS_FORUM_TAGS: readonly ForumTagSpec[] = [
  { name: 'Activation', emoji_name: '🔑', moderated: false },
  { name: 'Steam', emoji_name: '🎮', moderated: false },
  { name: 'Ubisoft', emoji_name: '🔵', moderated: false },
  { name: 'Billing', emoji_name: '💳', moderated: false },
  { name: 'Account', emoji_name: '👤', moderated: false },
  { name: 'Other', emoji_name: '📋', moderated: false },
] as const;

export const TICKETS_FORUM_DEFAULT_REACTION = { emoji_name: '🎫' } as const;

export const TICKETS_WELCOME_THREAD_NAME = '📌 READ FIRST — How to open a ticket';

/** Shown when members click "New Post" (forum post guidelines, max 256 chars). */
export function buildTicketsForumPostGuidelines(siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, '');
  return [
    'Pick a tag. Clear title (game + issue).',
    'Never post license keys, passwords, or Steam Guard codes.',
    `FAQ: ${base}/faq · My Games: ${base}/my-games`,
  ].join(' ');
}

/** Pinned-style welcome post for the tickets forum (checklist item 5). */
export function buildTicketsWelcomePost(siteUrl: string): {
  title: string;
  content: string;
} {
  const base = siteUrl.replace(/\/$/, '');
  return {
    title: TICKETS_WELCOME_THREAD_NAME,
    content: [
      '**How to open a support ticket**',
      '',
      '1. Click **New Post** above and choose a tag.',
      '2. Write a clear title (example: `Forza — activation code not working`).',
      '3. Copy the template below into your post.',
      '',
      '**Ticket template** (do not paste passwords or Steam Guard codes):',
      '• Purchase email:',
      '• Game title:',
      '• What you tried:',
      '• Screenshot of the error (optional)',
      '',
      `**Links:** ${base}/faq · ${base}/my-games · ${base}/contact`,
      '',
      'Staff or the support bot will reply in your private thread.',
    ].join('\n'),
  };
}

export function forumTagsMatch(
  existing: Array<{ name: string }> | undefined,
  expected: readonly ForumTagSpec[],
): boolean {
  if (!existing || existing.length !== expected.length) {
    return false;
  }
  const names = new Set(existing.map((tag) => tag.name.toLowerCase()));
  return expected.every((tag) => names.has(tag.name.toLowerCase()));
}
