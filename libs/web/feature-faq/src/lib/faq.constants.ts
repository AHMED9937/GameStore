export type FaqItemVariant = 'default' | 'ubisoft' | 'license';

export type FaqItem = {
  id: string;
  question: string;
  variant: FaqItemVariant;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
  callout?: {
    title: string;
    body: string;
  };
};

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    id: 'games-to-replace',
    question: 'Why are some of my games marked as "to replace"?',
    variant: 'default',
    paragraphs: [
      'Following recent issues with Steam accounts, access to some game accounts is temporarily unavailable and these accounts need to be replaced.',
      'The affected games appear in the "Games to Replace" section of your library, marked with an "Account not working" badge.',
      'The most popular games are being replaced first. Please be aware that replacing all the accounts will take a very long time, and some games will most likely never be replaced.',
      'Because of this situation, the subscription catalogue has been temporarily shortened. Games to replace are now only shown for one-time licenses and no longer for subscription-type licenses.',
      'No action is required on your part. Access is restored automatically as the accounts are replaced, and the catalogue will gradually rebuild itself over time. Thank you for your patience and understanding.',
    ],
  },
  {
    id: 'ubisoft-offline',
    question: 'How to switch Ubisoft to offline mode?',
    variant: 'ubisoft',
  },
  {
    id: 'personal-saves',
    question: 'Will I have my own personal game saves?',
    variant: 'default',
    paragraphs: [
      'Yes! Your game saves are stored locally on your PC and belong entirely to you. Each player has their own independent save files, completely separate from other users.',
    ],
    callout: {
      title: 'Important',
      body: 'You must disable cloud save synchronization on your platform (Ubisoft Connect, Steam, etc.). If cloud sync is enabled, your saves could be overwritten by another user\'s data. Once cloud sync is disabled in your platform\'s settings, your saves stay local and are never synced — no risk of conflict with other users.',
    },
  },
  {
    id: 'lost-license',
    question: 'I lost or forgot my license. What can I do?',
    variant: 'license',
    paragraphs: [
      'No problem! Enter the email address used for your purchase and we\'ll send your license(s) to it.',
    ],
  },
] as const;

export const FAQ_SUBTITLE =
  'Common questions about accounts, offline play, and licenses.';
