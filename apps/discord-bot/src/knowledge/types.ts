export type SupportTier = 'A' | 'B' | 'C' | 'D';

export type KnowledgeDoc = {
  id: string;
  title: string;
  body: string;
  tier: SupportTier;
  tags: readonly string[];
  keywords: readonly string[];
  sitePath?: string;
  discordChannel?: string;
};
