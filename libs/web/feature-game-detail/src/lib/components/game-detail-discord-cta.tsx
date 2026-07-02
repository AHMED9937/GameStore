import { IconArrowRight, IconDiscord } from './game-detail-icons';

const discordInviteUrl =
  process.env['NEXT_PUBLIC_DISCORD_INVITE_URL']?.trim() || 'https://discord.gg/';

export function GameDetailDiscordCta() {
  return (
    <section className="support-cta" aria-labelledby="game-detail-discord-heading">
      <div className="support-cta-body">
        <div className="support-cta-icon" aria-hidden>
          <IconDiscord className="btn-discord-icon" />
        </div>
        <div className="support-cta-text">
          <h3 className="support-cta-title" id="game-detail-discord-heading">
            Need help? Join our Discord
          </h3>
          <p className="support-cta-description">
            Questions or setup issues? Our team is online in Discord — join the community for
            fast support and updates.
          </p>
        </div>
      </div>
      <a
        href={discordInviteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-discord"
      >
        <IconDiscord className="btn-discord-icon" />
        Join Discord
        <IconArrowRight className="btn-discord-icon" />
      </a>
    </section>
  );
}
