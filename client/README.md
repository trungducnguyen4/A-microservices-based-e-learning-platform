# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/7337d500-aceb-45ef-a7d5-0260eb21ec7f

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/7337d500-aceb-45ef-a7d5-0260eb21ec7f) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- LiveKit - Real-time video/audio
- Groq API - Speech-to-Text transcription

## Speech-to-Text Feature

This project includes a live lecture transcription feature using Groq's Whisper API.

### Setup Groq API

1. Create an account at [Groq Console](https://console.groq.com/)
2. Generate an API key from [API Keys page](https://console.groq.com/keys)
3. Add the key to your `.env` file:

```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```

### How it works

- **Only for hosts**: The recording button appears in the classroom header for room hosts
- **10-minute limit**: Recordings automatically stop after 10 minutes to conserve API quota
- **Real-time transcription**: Audio is processed in 30-second chunks for near real-time results
- **Vietnamese support**: Configured for Vietnamese language by default (can be changed in `useTranscription.ts`)
- **Export**: Download the full transcript as a text file

### Usage

1. Join a classroom as host
2. Unmute your microphone
3. Click "Record Lecture" button in the header
4. Speak naturally - the transcript will appear in the panel
5. Click "Stop" or wait for auto-stop after 10 minutes
6. Export the transcript using the "Export" button

**Note**: Microphone must be enabled to start recording.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/7337d500-aceb-45ef-a7d5-0260eb21ec7f) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
