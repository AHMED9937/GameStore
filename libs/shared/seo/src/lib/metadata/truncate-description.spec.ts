import { truncateDescription } from './truncate-description';

describe('truncateDescription', () => {
  it('returns empty string for blank input', () => {
    expect(truncateDescription('   ')).toBe('');
  });

  it('returns short text unchanged', () => {
    expect(truncateDescription('Short description.')).toBe('Short description.');
  });

  it('truncates long text with ellipsis', () => {
    const long = 'word '.repeat(60).trim();
    const result = truncateDescription(long, 40);
    expect(result.length).toBeLessThanOrEqual(41);
    expect(result.endsWith('…')).toBe(true);
  });
});
