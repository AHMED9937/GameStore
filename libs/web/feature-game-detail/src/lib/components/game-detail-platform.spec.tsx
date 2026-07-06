import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameDetailPlatformStrip } from './game-detail-platform-strip';

describe('GameDetailPlatformStrip', () => {
  it('renders platform label with offline badge in buy panel strip', () => {
    render(<GameDetailPlatformStrip platform="steam" />);

    expect(screen.getByTestId('game-detail-platform-strip')).toBeTruthy();
    expect(screen.getByText('Steam')).toBeTruthy();
    expect(screen.getByText('Offline')).toBeTruthy();
  });
});
