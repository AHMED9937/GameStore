export function formatPlatformLabel(platform: string): string {
  switch (platform.trim().toLowerCase()) {
    case 'steam':
      return 'Steam';
    case 'epic':
      return 'Epic Games';
    case 'microsoft':
      return 'Microsoft';
    case 'ubisoft':
      return 'Ubisoft';
    default:
      return platform.trim() || 'PC';
  }
}
