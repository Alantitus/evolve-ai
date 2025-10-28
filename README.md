# Evolve AI - AI-Powered Presentation Generator

An intelligent chat-based application for generating and editing PowerPoint presentations using Google's Gemini AI. Create professional presentations with natural language commands and export them in multiple formats.

## ✨ Features

- 🤖 **AI-Powered Content Generation** - Using Google's Gemini 2.0 Flash Experimental model
- 📊 **Streaming PPT Generation** - Real-time progress with visual feedback
- 📄 **Multiple Export Formats** - PPTX download and PowerPoint Online
- 🎨 **Slide Preview & Editing** - Visual preview with live editing capabilities
- 🔐 **Authentication** - Supabase integration for multi-user support
- 💬 **Chat-Based Interface** - Natural language commands for slide creation
- 📱 **Mobile Responsive** - Fully optimized for mobile and tablet devices

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js) or **yarn**
- **Git** for cloning the repository

### Installation

1. **Clone the repository:**

```bash
git clone <repository-url>
cd evolve-ai
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables:**

Create a `.env.local` file in the root directory:

```env
# Required: Gemini AI API Key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Supabase Configuration (for cloud features)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Getting your Gemini API Key:**

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy the generated key
5. Paste it in your `.env.local` file

**Setting up Supabase (Optional):**
The app works perfectly without Supabase using localStorage. If you want cloud features:

1. Create an account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy your Project URL and anon/public key
5. Add them to your `.env.local` file
6. Set up database tables (the app will create them automatically on first use)
7. **Run the development server:**

```bash
npm run dev
```

5. **Open your browser:**

Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Building for Production

```bash
npm run build
npm start
```

The production build will be optimized and ready to deploy.

## 🚀 Deploying to Vercel

Vercel is the recommended hosting platform for Next.js applications.

### Option 1: Deploy via GitHub Integration

1. **Push your code to GitHub**
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "Add New Project"
4. Import your GitHub repository
5. Add environment variables:
   - `NEXT_PUBLIC_GEMINI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL` (optional)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (optional)
6. Click "Deploy"

Your app will be live in minutes!

### Option 2: Deploy via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

Then add your environment variables in the Vercel dashboard.

## 📖 Usage Guide

### Creating Presentations

1. **Start a new presentation:**

   - Type your presentation topic in the chat (e.g., "Create a presentation about ai")
   - The AI will analyze your request and generate structured slide content
   - Watch the progress bar as slides are created in real-time
2. **Preview your slides:**

   - View all generated slides in the right panel
   - Each slide shows title and bullet points
   - Click on any slide to preview full content

### Editing Slides

Use natural language to edit your presentation:

- **"Add more details about neural networks"** - Enhances existing content
- **"Make the introduction slide shorter"** - Condenses information
- **"Add a conclusion slide"** - Adds new slides
- **"Remove the third slide"** - Deletes slides
- **"Change the title to 'Machine Learning Basics'"** - Edits specific content

### Exporting Presentations

After generating your presentation, you have multiple export options:

- **PPTX (Download Button)** - Download as PowerPoint file (.pptx)
- **Preview (Eye Icon)** - View full presentation preview
- **Edit (Edit Icon)** - Manually edit slide content

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Google Gemini AI** - Advanced AI content generation (gemini-2.0-flash-exp)
- **pptxgenjs** - PowerPoint file generation
- **Supabase** - Backend (optional) for storage and auth
- **Lucide React** - Beautiful icon library

## 🏗️ Project Structure

```
evolve-ai/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Auth.tsx          # Authentication UI
│   ├── ChatInterface.tsx # Main chat interface
│   ├── InputBar.tsx      # Message input
│   ├── MessageList.tsx   # Chat messages
│   ├── Sidebar.tsx       # Session sidebar
│   ├── SlideEditor.tsx   # Slide editing UI
│   ├── SlidePreview.tsx  # Slide preview
│   └── Providers.tsx     # Context providers
├── contexts/             # React contexts
│   ├── AuthContext.tsx   # Authentication state
│   └── ChatContext.tsx   # Chat and AI logic
├── lib/                  # Utilities
│   ├── supabase.ts       # Supabase client
│   └── test-supabase.ts  # Connection testing
└── types/                # TypeScript types
    ├── message.ts        # Message types
    └── slide.ts          # Slide types
```

### API Key Issues

- Verify your `.env.local` file exists in the root directory
- Check that the API key is correctly formatted (no spaces)
- Restart the development server after adding environment variables
- For production, add variables in your hosting platform (Vercel, etc.)

### Build Errors

- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Ensure all dependencies are installed: `npm install`
