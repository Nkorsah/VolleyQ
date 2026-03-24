import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest';
import GeminiComponent from '../gemini/geminicomp';

vi.mock('@google/generative-ai');

const mockGenerateContent = vi.fn()

//setup for the tests
beforeEach(() => {
  mockGenerateContent.mockResolvedValue({
    response: { text: () => 'This is the mock' },
  });

  vi.mocked(GoogleGenerativeAI).mockImplementation(function() {
    return {
      getGenerativeModel: () => ({ generateContent: mockGenerateContent }),
    };
  } as unknown as typeof GoogleGenerativeAI);
});

//actual gemini component testing, all mocks so probably won't kill my google cloud account
describe('GeminiComponent', () => {
  //clearing stuff after each test
  afterEach(() => {
    vi.clearAllMocks();
  });
  //test for checking if gemini component can have a prompt inputted
  it('displays the AI response', async () => {
    render(<GeminiComponent/>);
    await userEvent.type(screen.getByRole('textbox', { name: /prompt/i }), 'Hello');
    await userEvent.click(screen.getByRole('button', { name: /ask/i }));
    console.log('generateContent called:', mockGenerateContent.mock.calls);

    await waitFor(() => {
      expect(screen.getByText('This is the mock')).toBeInTheDocument();
    });
  });
  //test to see if the component can handle api errors (likely hitting rate limit)
  it('handles API errors', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('API down'));

    render(<GeminiComponent/>);
    await userEvent.type(screen.getByRole('textbox', { name: /prompt/i }), 'Hello');
    await userEvent.click(screen.getByRole('button', { name: /ask/i }));
    console.log('generateContent called:', mockGenerateContent.mock.calls);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});