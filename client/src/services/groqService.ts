/**
 * Groq Service
 * Speech-to-Text using Groq API
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

export interface TranscriptionOptions {
  language?: string; // 'en' | 'vi' | auto-detect
  temperature?: number; // 0-1
  responseFormat?: 'json' | 'text' | 'verbose_json';
}

export interface TranscriptionResult {
  text: string;
  duration?: number;
  language?: string;
}

/**
 * Transcribe audio using Groq Whisper API
 * @param audioBlob - Audio blob to transcribe
 * @param options - Transcription options
 * @returns Transcription result
 */
export const transcribeAudio = async (
  audioBlob: Blob,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> => {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key is not configured. Please set VITE_GROQ_API_KEY in .env');
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-large-v3'); // Groq's Whisper model
  
  if (options.language) {
    formData.append('language', options.language);
  }
  
  if (options.temperature !== undefined) {
    formData.append('temperature', String(options.temperature));
  }
  
  formData.append('response_format', options.responseFormat || 'json');

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      text: result.text || '',
      duration: result.duration,
      language: result.language,
    };
  } catch (error) {
    console.error('[GroqService] Transcription error:', error);
    throw error;
  }
};

/**
 * Check if Groq API is configured
 */
export const isGroqConfigured = (): boolean => {
  return !!GROQ_API_KEY && GROQ_API_KEY.length > 0;
};

/**
 * Transcription segment type - exported for use in transcript helpers
 */
export interface TranscriptionSegment {
  id: string;
  text: string;
  timestamp: string;
}
