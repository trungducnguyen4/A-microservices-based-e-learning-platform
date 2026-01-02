/**
 * Helper functions for transcript summarization
 * Using Groq AI to generate summaries
 */

import { TranscriptionSegment } from '@/services/groqService';

export interface TranscriptSummary {
  summary: string;
  keyPoints: string[];
  duration: string;
  totalSegments: number;
  timestamp: string;
}

/**
 * Generate a summary from transcript segments using Groq AI
 */
export async function summarizeTranscript(
  transcript: TranscriptionSegment[],
  roomName: string
): Promise<TranscriptSummary> {
  if (transcript.length === 0) {
    throw new Error('Transcript is empty. Nothing to summarize.');
  }

  // Combine all transcript text
  const fullText = transcript
    .map(segment => `[${segment.timestamp}] ${segment.text}`)
    .join('\n\n');

  // Get first and last timestamps for duration
  const firstTimestamp = transcript[0].timestamp;
  const lastTimestamp = transcript[transcript.length - 1].timestamp;

  // Call Groq API to generate summary
  const summaryPrompt = `You are an AI assistant helping to summarize lecture transcripts.

Below is a transcript from a lecture/meeting in room "${roomName}".

TRANSCRIPT:
${fullText}

Please provide:
1. A comprehensive summary (2-3 paragraphs) of the main topics discussed
2. A list of key points (bullet points)

Format your response as JSON:
{
  "summary": "Your summary here...",
  "keyPoints": ["point 1", "point 2", "point 3"]
}`;

  try {
    // Use Groq to generate summary (reusing transcription method)
    const summaryResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // Fast model for summarization
        messages: [
          {
            role: 'system',
            content: 'You are an expert at summarizing lecture and meeting transcripts. Always respond with valid JSON only, no additional text.',
          },
          {
            role: 'user',
            content: summaryPrompt,
          },
        ],
        temperature: 0.3, // Low temperature for consistent summaries
        max_tokens: 1000,
        response_format: { type: 'json_object' }, // Force JSON response
      }),
    });

    if (!summaryResponse.ok) {
      const errorData = await summaryResponse.json().catch(() => ({}));
      console.error('[summarizeTranscript] Groq API error:', errorData);
      throw new Error(`Groq API error: ${summaryResponse.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await summaryResponse.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No summary generated from Groq API');
    }

    // Parse JSON response
    let parsedSummary: { summary: string; keyPoints: string[] };
    try {
      parsedSummary = JSON.parse(content);
    } catch {
      // Fallback: If not valid JSON, use the content as summary
      parsedSummary = {
        summary: content,
        keyPoints: ['Could not extract key points. Please review the summary above.'],
      };
    }

    return {
      summary: parsedSummary.summary,
      keyPoints: parsedSummary.keyPoints,
      duration: `${firstTimestamp} - ${lastTimestamp}`,
      totalSegments: transcript.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[summarizeTranscript] Error:', error);
    throw error;
  }
}

/**
 * Export transcript summary as a formatted text file
 */
export function exportTranscriptSummary(
  summary: TranscriptSummary,
  roomName: string,
  transcript: TranscriptionSegment[]
): void {
  const content = `
=================================================
LECTURE SUMMARY - ${roomName}
=================================================

Generated: ${new Date(summary.timestamp).toLocaleString()}
Duration: ${summary.duration}
Total Segments: ${summary.totalSegments}

-------------------------------------------------
SUMMARY
-------------------------------------------------

${summary.summary}

-------------------------------------------------
KEY POINTS
-------------------------------------------------

${summary.keyPoints.map((point, idx) => `${idx + 1}. ${point}`).join('\n')}

-------------------------------------------------
FULL TRANSCRIPT
-------------------------------------------------

${transcript.map(segment => `[${segment.timestamp}] ${segment.text}`).join('\n\n')}

=================================================
End of Summary
=================================================
`.trim();

  // Create and download file
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  // Format: Lecture_Summary_RoomName_2026-01-01_14-30.txt
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // 2026-01-01
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-').substring(0, 5); // 14-30
  const safeRoomName = roomName.replace(/[^a-zA-Z0-9-_]/g, '_'); // Remove special chars
  a.download = `Lecture_Summary_${safeRoomName}_${dateStr}_${timeStr}.txt`;
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export transcript without summary (original export function)
 */
export function exportTranscriptOnly(
  transcript: TranscriptionSegment[],
  roomName: string
): void {
  const text = transcript
    .map(segment => `[${segment.timestamp}] ${segment.text}`)
    .join('\n\n');
  
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transcript_${roomName}_${new Date().toISOString()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
