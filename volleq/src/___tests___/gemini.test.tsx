import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeTeam } from '../api/teamcreation';

const mockAnalyzeTeam = vi.fn();

vi.mock('../pages/api', () => ({
  analyzeTeam: mockAnalyzeTeam,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('analyzeTeam', () => {
  it('returns the analysis string on success', async () => {
    mockAnalyzeTeam.mockResolvedValue({ analysis: 'Great performance overall!' });

    const result = await analyzeTeam('team-1');

    expect(result).toBe('Great performance overall!');
    expect(mockAnalyzeTeam).toHaveBeenCalledWith('team-1');
    expect(mockAnalyzeTeam).toHaveBeenCalledTimes(1);
  });

  it('throws if teamId is empty', async () => {
    await expect(analyzeTeam('')).rejects.toThrow('teamId is required');
    expect(mockAnalyzeTeam).not.toHaveBeenCalled();
  });

  it('throws if api.analyzeTeam fails', async () => {
    mockAnalyzeTeam.mockRejectedValue(new Error('Network error'));

    await expect(analyzeTeam('team-1')).rejects.toThrow('Network error');
  });

  it('throws if analysis is empty', async () => {
    mockAnalyzeTeam.mockResolvedValue({ analysis: '' });

    await expect(analyzeTeam('team-1')).rejects.toThrow('No analysis returned');
  });
});