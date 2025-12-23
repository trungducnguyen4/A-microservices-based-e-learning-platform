# Groq Speech-to-Text Configuration Guide

## Overview

This application uses Groq's Whisper API for real-time speech-to-text transcription during live classroom sessions.

## Getting Started

### 1. Create a Groq Account

Visit [Groq Console](https://console.groq.com/) and sign up for a free account.

### 2. Generate API Key

1. Navigate to [API Keys](https://console.groq.com/keys)
2. Click "Create API Key"
3. Copy your API key

### 3. Configure Environment

Add your API key to the `.env` file in the `client` folder:

```env
VITE_GROQ_API_KEY=gsk_your_api_key_here
```

**Important**: Never commit your `.env` file to version control.

### 4. Restart Development Server

After adding the API key, restart your development server:

```bash
cd client
npm run dev
```

## Features

### Recording Controls

- **Auto-start**: Recording button appears for room hosts
- **10-minute limit**: Recordings stop automatically after 10 minutes
- **Real-time processing**: Audio chunks are sent every 30 seconds
- **Timer display**: Shows recording duration in MM:SS format

### Transcription Panel

- **Live updates**: Transcript appears as audio is processed
- **Timestamps**: Each segment includes time information
- **Export**: Download full transcript as `.txt` file
- **Clear**: Remove all transcript segments

### Requirements

- Must be room **host** to access recording features
- Microphone must be **unmuted** to start recording
- Room must be **connected** (Live status)

## API Limits

Groq's free tier includes:

- 14,400 requests per day
- Rate limiting: Consider 30-second chunks optimal

Each 10-minute recording = approximately 20 API requests (one per 30 seconds)

## Supported Languages

Current configuration: **Vietnamese** (`vi`)

To change language, edit `client/src/hooks/useTranscription.ts`:

```typescript
const result = await transcribeAudio(audioBlob, {
  language: 'en', // Change to 'en' for English, or remove for auto-detect
  temperature: 0,
  responseFormat: 'json',
});
```

Supported languages: en, es, fr, de, it, pt, nl, pl, ru, zh, ja, ko, **vi**, and more.

## Troubleshooting

### "Speech-to-Text is not configured" warning

- Verify `VITE_GROQ_API_KEY` is set in `.env`
- Check API key is valid (test at Groq Console)
- Restart development server

### "No audio track available" error

- Enable microphone in browser
- Check LiveKit connection status
- Verify microphone is not muted in app

### Transcription not appearing

- Wait 30 seconds for first chunk to process
- Check browser console for errors
- Verify Groq API quota is not exceeded
- Ensure audio is being captured (speak louder)

### API Rate Limit errors

- Wait before starting new recording
- Reduce `CHUNK_DURATION` if needed (in `useTranscription.ts`)
- Upgrade Groq plan for higher limits

## Best Practices

1. **Test first**: Try with short recordings before full lectures
2. **Monitor usage**: Check Groq dashboard for API usage
3. **Export regularly**: Download transcripts after each session
4. **Clear old data**: Use "Clear" button to free memory
5. **Quality audio**: Speak clearly, minimize background noise

## Privacy & Security

- Audio is processed by Groq's servers
- Transcripts are stored locally in browser only
- No data is persisted in backend databases
- Export files contain only transcript text

## Cost Optimization

- 10-minute automatic limit saves API credits
- 30-second chunks balance latency and requests
- Only host can record (prevents duplicate transcriptions)
- Manual stop available for shorter sessions

## Technical Details

### Architecture

```
LiveKit Audio → MediaRecorder → Audio Chunks → Groq API → Transcript Display
                     ↓
                Every 30s
```

### Files

- `client/src/services/groqService.ts` - Groq API integration
- `client/src/hooks/useTranscription.ts` - Recording & transcription logic
- `client/src/pages/Classroom.tsx` - UI components

### Audio Format

- **Input**: WebM audio from LiveKit
- **Model**: Whisper Large V3 (via Groq)
- **Output**: JSON with text + metadata

## Support

For issues with:

- **Groq API**: Visit [Groq Support](https://console.groq.com/support)
- **Application**: Check browser console and verify configuration
- **LiveKit**: Ensure audio tracks are published correctly

## Example Usage

1. Join classroom as host
2. Unmute microphone
3. Click "Record Lecture" in header
4. Lecture content appears in transcript panel
5. Recording stops at 10 minutes or when clicked "Stop"
6. Click "Export" to download transcript file
7. Share transcript with students or use for notes

---

**Note**: This feature requires an active internet connection and valid Groq API key.
