'use client';

import { useState } from 'react';
import type { GameDetail } from '@gamestore/web/data-access';
import {
  GAME_DETAIL_TABS,
  getActivationSteps,
  getImportantInformation,
  getProductDetails,
  type GameDetailTabId,
} from '../game-detail.constants';
import { splitMedia, toYoutubeEmbedUrl } from '../game-detail.utils';
import { GameDetailDescriptionPanel } from './game-detail-description-panel';
import { GameDetailDiscordCta } from './game-detail-discord-cta';
import { GameDetailInfoGrid } from './game-detail-info-grid';
import { GameDetailSpecs } from './game-detail-specs';
import { GameDetailStepFlow } from './game-detail-step-flow';

export type GameDetailTabsProps = {
  game: GameDetail;
};

export function GameDetailTabs({ game }: GameDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<GameDetailTabId>('product-details');
  const { activation } = splitMedia(game.media);
  const activationEmbed = activation ? toYoutubeEmbedUrl(activation.url) : null;

  return (
    <div className="detail-tabs" data-testid="game-detail-tabs">
      <div className="detail-tab-list" role="tablist" aria-label="Game information">
        {GAME_DETAIL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            className={
              activeTab === tab.id ? 'detail-tab detail-tab--active' : 'detail-tab'
            }
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id="panel-product-details"
        role="tabpanel"
        aria-labelledby="tab-product-details"
        hidden={activeTab !== 'product-details'}
        className="detail-tab-panel"
      >
        <section className="detail-section">
          <h2 className="detail-section-title">Product Description</h2>
          <p className="detail-section-lead">
            Everything included with your purchase — instant access, secure delivery, and ongoing
            support.
          </p>
          <GameDetailInfoGrid items={getProductDetails(game.platform)} />
        </section>

        <section className="detail-section">
          <h2 className="detail-section-title">Important Information</h2>
          <p className="detail-section-lead">
            Please read before buying. These terms apply to all shared-account products on our
            store.
          </p>
          <GameDetailInfoGrid
            items={getImportantInformation(game.platform)}
            variant="warning"
          />
        </section>

        <GameDetailDiscordCta />
      </div>

      <div
        id="panel-activation"
        role="tabpanel"
        aria-labelledby="tab-activation"
        hidden={activeTab !== 'activation'}
        className="detail-tab-panel"
      >
        <section className="detail-section">
          <h2 className="detail-section-title">Activation</h2>
          <p className="detail-section-lead">
            Follow these steps to activate {game.title} and start playing. Watch the guide below,
            then walk through each step in order.
          </p>

          {activationEmbed ? (
            <div className="detail-media">
              <iframe
                src={activationEmbed}
                title={activation?.title ?? `${game.title} activation`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ) : (
            <p className="detail-section-lead">Activation video will be available soon.</p>
          )}

          <GameDetailStepFlow steps={getActivationSteps(game.platform, game.title)} />
        </section>

        <GameDetailDiscordCta />
      </div>

      <div
        id="panel-game-description"
        role="tabpanel"
        aria-labelledby="tab-game-description"
        hidden={activeTab !== 'game-description'}
        className="detail-tab-panel"
      >
        <section className="detail-section">
          <h2 className="detail-section-title">Game Description</h2>
          <GameDetailDescriptionPanel
            description={game.description}
            genres={game.genres}
            releaseDate={game.releaseDate}
          />
        </section>
      </div>

      <div
        id="panel-requirements"
        role="tabpanel"
        aria-labelledby="tab-requirements"
        hidden={activeTab !== 'requirements'}
        className="detail-tab-panel"
      >
        <section className="detail-section">
          <h2 className="detail-section-title">Required configuration</h2>
          <p className="detail-section-lead">
            Make sure your PC meets these specs before purchase for the best experience.
          </p>
          <GameDetailSpecs
            minimum={game.requirementsMin}
            recommended={game.requirementsRecommended}
          />
        </section>

        <GameDetailDiscordCta />
      </div>
    </div>
  );
}
