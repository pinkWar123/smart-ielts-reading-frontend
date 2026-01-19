// Claude API service for converting images to text
// Note: This should be called through a backend proxy to keep API key secure

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: Array<{
    type: 'text' | 'image';
    text?: string;
    source?: {
      type: 'base64';
      media_type: string;
      data: string;
    };
  }>;
}

export interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
}

export interface ImageToTextRequest {
  images: File[];
  prompt?: string;
}

export interface ImageToTextResponse {
  text: string;
  success: boolean;
  error?: string;
}

/**
 * Convert image files to base64 strings
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Convert images to text using Claude API
 * This should ideally be called through a backend proxy endpoint
 */
export const convertImagesToText = async (
  request: ImageToTextRequest
): Promise<ImageToTextResponse> => {
  try {
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;

    if (!apiKey) {
      throw new Error('Claude API key not configured');
    }

    // Convert all images to base64
    const imageContents = await Promise.all(
      request.images.map(async (file) => {
        const base64 = await fileToBase64(file);
        const mediaType = file.type || 'image/jpeg';

        return {
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: mediaType,
            data: base64,
          },
        };
      })
    );

    const prompt = request.prompt || `Please extract the text from this IELTS reading passage image(s). 
    
Format the output as follows:
1. First, provide the passage title
2. Then the full passage text with proper paragraphs
3. Then all questions in order, grouped by question type
4. For multiple choice questions, include all options (A, B, C, D)

Please maintain the original structure and formatting as much as possible.`;

    const message: ClaudeMessage = {
      role: 'user',
      content: [
        {
          type: 'text',
          text: prompt,
        },
        ...imageContents,
      ],
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [message],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to convert images');
    }

    const data: ClaudeResponse = await response.json();
    const extractedText = data.content[0]?.text || '';

    return {
      text: extractedText,
      success: true,
    };
  } catch (error) {
    console.error('Error converting images to text:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Parse the extracted text to structured format
 * This is a helper function to parse Claude's response
 */
export const parseExtractedText = (text: string) => {
  // This will need custom parsing logic based on Claude's output format
  // For now, return the raw text
  return text;
};

