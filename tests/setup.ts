// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: './env-test.txt' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing-only';

// Mock expensive external AI services for fast integration tests
// These services are mocked because they:
// - Are expensive to run (API costs)
// - Are slow (network latency)
// - May be unreliable (external dependencies)
// - Are not the core business logic we want to test

// For comprehensive E2E testing, consider separate test suites that use real services
jest.mock('../src/services/chat.js', () => ({
  generateChatCompletion: jest.fn().mockImplementation(async ({ messages, temperature }: any) => {
    // Check if the request is asking for something specific
    const lastMessage = messages[messages.length - 1].content.toLowerCase();
    
    let response = 'This is a mock response for testing. The actual AI service would provide more detailed and contextually appropriate responses.';
    
    // Handle specific test scenarios
    if (lastMessage.includes('what is 2+2') || lastMessage.includes('2+2')) {
      response = 'The answer is 4.';
    } else if (lastMessage.includes('polish') || lastMessage.includes('dzień dobry')) {
      response = 'Dzień dobry! Hello! I can help you with Polish language learning.';
    }
    
    return {
      response,
      usage: { prompt_tokens: 25, completion_tokens: 35, total_tokens: 60 }
    };
  })
}));

jest.mock('../src/services/tts.js', () => ({
  generateTTS: jest.fn().mockImplementation(async (options: any) => {
    // Validate language to simulate service-level validation
    if (options.language && !['en', 'pl'].includes(options.language)) {
      throw new Error(`Unsupported language: ${options.language}`);
    }
    return Buffer.from('RIFF\x24\x08\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x08\x00\x00');
  }),
  listVoices: jest.fn().mockResolvedValue([
    'Claribel Dervla',
    'Drew',
    'Paul',
    'Dora',
    'Thomas',
    'Emma',
    'Michael',
    'Laura'
  ])
}));

jest.mock('../src/services/images.js', () => ({
  generateImage: jest.fn().mockResolvedValue('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==')
}));

jest.mock('../src/services/translation.js', () => ({
  translate: jest.fn().mockImplementation(async ({ text, source, target }: { text: string, source: string, target: string }) => {
    // Provide realistic bidirectional mock translations
    const enToPlTranslations: Record<string, string> = {
      'Hello': 'Cześć',
      'Hello, how are you today?': 'Cześć, jak się masz dzisiaj?',
      'How are you?': 'Jak się masz?',
      'Thank you': 'Dziękuję',
      'Good morning, welcome to our school.': 'Dzień dobry, witamy w naszej szkole.',
      'Photosynthesis is the process by which plants convert sunlight into energy.': 'Fotosynteza jest procesem, w którym rośliny przekształcają światło słoneczne w energię.'
    };

    const plToEnTranslations: Record<string, string> = {
      'Cześć': 'Hello',
      'Cześć, jak się masz dzisiaj?': 'Hello, how are you today?',
      'Jak się masz?': 'How are you?',
      'Dziękuję': 'Thank you',
      'Dzień dobry, witamy w naszej szkole.': 'Good morning, welcome to our school.'
    };

    let mockTranslation: string;
    if (target === 'pl') {
      mockTranslation = enToPlTranslations[text] || `Tłumaczenie "${text}" na PL`;
    } else if (target === 'en') {
      mockTranslation = plToEnTranslations[text] || `Translation of "${text}" to EN`;
    } else {
      mockTranslation = `Mock translation of "${text}" to ${target.toUpperCase()}`;
    }

    return {
      translatedText: mockTranslation,
      detectedLanguage: source === 'auto' ? (target === 'pl' ? 'en' : 'pl') : source,
      confidence: 0.95
    };
  }),
  batchTranslate: jest.fn().mockImplementation(async (texts: string[], source: string, target: string) => {
    // Mock batch translate by calling translate for each text
    return texts.map(text => ({
      translatedText: `Mock translation of "${text}" to ${target.toUpperCase()}`,
      detectedLanguage: source,
      confidence: 0.95
    }));
  }),
  detectLanguage: jest.fn().mockImplementation(async (text: string) => {
    // Simple language detection mock with case-insensitive matching
    const lowerText = text.toLowerCase();
    if (lowerText.includes('cześć') || lowerText.includes('dziękuję') || lowerText.includes('dzień dobry')) {
      return { language: 'pl', confidence: 0.95 };
    }
    if (lowerText.includes('hola') || lowerText.includes('gracias')) {
      return { language: 'es', confidence: 0.95 };
    }
    if (lowerText.includes('bonjour') || lowerText.includes('merci') || lowerText.includes('allons')) {
      return { language: 'fr', confidence: 0.95 };
    }
    return { language: 'en', confidence: 0.95 };
  }),
  getSupportedLanguages: jest.fn().mockResolvedValue([
    { code: 'en', name: 'English' },
    { code: 'pl', name: 'Polish' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' }
  ])
}));