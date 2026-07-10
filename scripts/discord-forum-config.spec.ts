import { describe, expect, it } from 'vitest';
import {
  buildTicketsForumPostGuidelines,
  buildTicketsWelcomePost,
  forumTagsMatch,
  TICKETS_FORUM_TAGS,
} from './discord-forum-config';

describe('discord-forum-config', () => {
  it('builds post guidelines with site links', () => {
    const text = buildTicketsForumPostGuidelines('https://store.example');
    expect(text).toContain('Pick a tag');
    expect(text).toContain('https://store.example/faq');
    expect(text).toContain('Never');
  });

  it('builds welcome post with ticket template', () => {
    const post = buildTicketsWelcomePost('https://store.example/');
    expect(post.title).toContain('READ FIRST');
    expect(post.content).toContain('Purchase email:');
    expect(post.content).toContain('https://store.example/contact');
  });

  it('detects matching forum tags', () => {
    expect(
      forumTagsMatch(
        TICKETS_FORUM_TAGS.map((tag) => ({ name: tag.name })),
        TICKETS_FORUM_TAGS,
      ),
    ).toBe(true);
    expect(forumTagsMatch([{ name: 'Activation' }], TICKETS_FORUM_TAGS)).toBe(false);
  });
});
