import { IconEpic, IconGamepad, IconMicrosoft, IconSteam } from './game-detail-icons';
import styles from './game-detail.module.css';

export type GameDetailPlatformIconProps = {
  platform: string;
  size?: 'sm' | 'md' | 'lg';
};

export function GameDetailPlatformIcon({
  platform,
  size = 'md',
}: GameDetailPlatformIconProps) {
  const className = [
    styles.platformIcon,
    size === 'sm' ? styles.platformIconSm : '',
    size === 'lg' ? styles.platformIconLg : '',
  ]
    .filter(Boolean)
    .join(' ');

  switch (platform.toLowerCase()) {
    case 'steam':
      return <IconSteam className={className} aria-hidden />;
    case 'epic':
      return <IconEpic className={className} aria-hidden />;
    case 'microsoft':
    case 'xbox':
      return <IconMicrosoft className={className} aria-hidden />;
    default:
      return <IconGamepad className={className} aria-hidden />;
  }
}
