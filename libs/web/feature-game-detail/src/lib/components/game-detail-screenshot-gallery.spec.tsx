import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameDetailScreenshotGallery } from './game-detail-screenshot-gallery';

const shots = [
  {
    id: 's1',
    type: 'screenshot',
    url: '/shot-1.png',
    title: 'Overworld',
    sortOrder: 0,
  },
  {
    id: 's2',
    type: 'screenshot',
    url: '/shot-2.png',
    title: 'Combat',
    sortOrder: 1,
  },
];

describe('GameDetailScreenshotGallery', () => {
  it('opens a lightbox when a screenshot is clicked', () => {
    render(<GameDetailScreenshotGallery screenshots={shots} title="Demo Game" />);

    fireEvent.click(screen.getByRole('button', { name: /View Overworld larger/i }));

    const lightbox = screen.getByTestId('game-detail-screenshot-lightbox');
    expect(within(lightbox).getByRole('img', { name: 'Overworld' })).toBeTruthy();
    expect(within(lightbox).getByText('1 / 2')).toBeTruthy();
  });

  it('navigates to the next screenshot in the lightbox', () => {
    render(<GameDetailScreenshotGallery screenshots={shots} title="Demo Game" />);

    fireEvent.click(screen.getByRole('button', { name: /View Overworld larger/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Next screenshot' }));

    const lightbox = screen.getByTestId('game-detail-screenshot-lightbox');
    expect(within(lightbox).getByRole('img', { name: 'Combat' })).toBeTruthy();
    expect(within(lightbox).getByText('2 / 2')).toBeTruthy();
  });

  it('closes the lightbox with the close button', () => {
    render(<GameDetailScreenshotGallery screenshots={shots} title="Demo Game" />);

    fireEvent.click(screen.getByRole('button', { name: /View Overworld larger/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Close screenshot' }));

    expect(screen.queryByTestId('game-detail-screenshot-lightbox')).toBeNull();
  });
});
