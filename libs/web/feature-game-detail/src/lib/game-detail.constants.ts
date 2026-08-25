export type DetailIconName =
  | 'bolt'
  | 'clock'
  | 'download'
  | 'shield'
  | 'refresh'
  | 'card'
  | 'users'
  | 'key'
  | 'lock'
  | 'alert'
  | 'share'
  | 'cpu'
  | 'gamepad';

export type ProductDetailItem = {
  title: string;
  description: string;
  icon: DetailIconName;
};

export type ImportantInfoItem = {
  title: string;
  description: string;
  icon: DetailIconName;
};

function platformStoreLabel(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'steam':
      return 'Steam';
    case 'epic':
      return 'Epic Games';
    case 'microsoft':
    case 'xbox':
      return 'Microsoft Store';
    default:
      return platform;
  }
}

export function getProductDetails(platform: string): ProductDetailItem[] {
  const store = platformStoreLabel(platform);

  return [
    {
      title: 'Immediate access',
      icon: 'bolt',
      description:
        'You will receive access credentials to the account immediately after completing your purchase. No wait time.',
    },
    {
      title: 'Self-activation',
      icon: 'clock',
      description:
        'You can activate the account anytime, 24/7, without requiring our intervention.',
    },
    {
      title: 'Secure download',
      icon: 'download',
      description: `Download the game directly from our ${store} account, without resorting to torrents or unsecured third-party sites.`,
    },
    {
      title: '2-Year Warranty',
      icon: 'shield',
      description:
        '2-year access guarantee. In case of access or connection issues, we will resolve the problem or provide a replacement account for free.',
    },
    {
      title: 'Updates included',
      icon: 'refresh',
      description: `Enjoy the latest game updates available on ${store}.`,
    },
    {
      title: 'Secure payments',
      icon: 'card',
      description:
        'We offer secure payment methods via Stripe and Paypal, ensuring a protected transaction.',
    },
  ];
}

function getSteamImportantInformation(): ImportantInfoItem[] {
  return [
    {
      title: 'Offline Steam account',
      icon: 'users',
      description:
        'This product provides access to a Steam account in offline mode. It is designed for single-player mode only, without online features.',
    },
    {
      title: 'No activation key',
      icon: 'key',
      description:
        'This is not a game key but a shared account. You are not purchasing an individual game license.',
    },
    {
      title: 'Non-transferable account',
      icon: 'lock',
      description:
        'This account is shared and cannot be linked or transferred to your personal Steam account.',
    },
    {
      title: 'Incompatible with cloud gaming services',
      icon: 'gamepad',
      description:
        'It is not possible to play this game via cloud gaming services such as PlayKey, Geforce Now, Google Stadia, Loudplay, Drova, etc.',
    },
    {
      title: 'Modifications not allowed',
      icon: 'alert',
      description:
        'It is strictly forbidden to modify account information (email address, password, etc.). Any modification attempt may result in deactivation of your access.',
    },
    {
      title: 'Shared account',
      icon: 'share',
      description:
        'This account is shared with other users. You must not attempt to take control of it or make changes.',
    },
  ];
}

export function getImportantInformation(platform: string): ImportantInfoItem[] {
  if (platform.toLowerCase() === 'steam') {
    return getSteamImportantInformation();
  }

  const store = platformStoreLabel(platform);
  const accountLabel =
    platform.toLowerCase() === 'epic' ? 'Epic Games' : 'Microsoft Store';

  return [
    {
      title: `Online ${store} account`,
      icon: 'users',
      description: `This product provides access to a shared ${store} account with online features available. You can sign in with your personal account so progress and saves are managed by ${accountLabel}.`,
    },
    {
      title: 'No activation key',
      icon: 'key',
      description:
        'This is not a game key but a shared account. You are not purchasing an individual game license.',
    },
    {
      title: 'Non-transferable account',
      icon: 'lock',
      description: `This account is shared and cannot be linked or transferred to your personal ${store} account.`,
    },
    {
      title: 'Modifications not allowed',
      icon: 'alert',
      description:
        'It is strictly forbidden to modify account information (email address, password, etc.). Any modification attempt may result in deactivation of your access.',
    },
    {
      title: 'Shared account',
      icon: 'share',
      description:
        'This account is shared with other users. You must not attempt to take control of it or make changes.',
    },
  ];
}

export type ActivationStep = {
  step: number;
  title: string;
  description: string;
};

export function getActivationSteps(platform: string, gameTitle: string): ActivationStep[] {
  const store = platformStoreLabel(platform);
  const platformLive =
    platform.toLowerCase() === 'microsoft' || platform.toLowerCase() === 'xbox'
      ? 'Xbox Live'
      : platform.toLowerCase() === 'epic'
        ? 'Epic'
        : 'Steam';

  return [
    {
      step: 1,
      title: 'Activate the key',
      description:
        'You can then activate the activation key on our website to access the game you purchased.',
    },
    {
      step: 2,
      title: `Download ${store}`,
      description: `Download the ${store} app from the link provided after activation.`,
    },
    {
      step: 3,
      title: 'Install the activator',
      description:
        'Run the installer and follow the on-screen instructions to install the activator.',
    },
    {
      step: 4,
      title: 'Enter your key in the activator',
      description: `Open the ${store} activator and enter your activation key.`,
    },
    {
      step: 5,
      title: 'Connect your game',
      description: `In the activator, find ${gameTitle} and click on "Connect".`,
    },
    {
      step: 6,
      title: 'Wait for automatic connection',
      description: `Let the activator sign you in to the shared ${store} account automatically.`,
    },
    {
      step: 7,
      title: 'Download the game',
      description: `Open the ${store} app and download ${gameTitle}.`,
    },
    {
      step: 8,
      title: `Sign in with your personal ${platformLive} account`,
      description: `Sign in to the ${store} app with your own ${platformLive} account so your achievements and game data stay tied to you.`,
    },
    {
      step: 9,
      title: 'Play online with your friends',
      description: `Launch ${gameTitle} and enjoy online play with your friends.`,
    },
  ];
}

export const GAME_DETAIL_TABS = [
  { id: 'product-details', label: 'Product Details' },
  { id: 'activation', label: 'Activation' },
  { id: 'game-description', label: 'Game Description' },
  { id: 'requirements', label: 'Required configuration' },
] as const;

export type GameDetailTabId = (typeof GAME_DETAIL_TABS)[number]['id'];
