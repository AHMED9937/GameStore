import { HomeFeaturedGrid } from './components/home-featured-grid';
import { HomeHero } from './components/home-hero';
import { HomePromoBanner } from './components/home-promo-banner';

export function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeFeaturedGrid />
      <HomePromoBanner />
    </>
  );
}
