# Evolve AI - AI-Powered Presentation Generator

An intelligent chat-based application for generating and editing PowerPoint presentations using Google's Gemini AI. Create professional presentations with natural language commands and export them in multiple formats.

## ✨ Features

- 🤖 **AI-Powered Content Generation** - Using Google's Gemini Reasoning Model
- 📊 **Streaming PPT Generation** - Real-time progress with visual feedback
- 📄 **Multiple Export Formats** - PPTX, PDF (planned), and PowerPoint Online
- 🎨 **Slide Preview & Editing** - Visual preview with live editing capabilities
- 🔐 ** Authentication** - Supabase integration for multi-user support
- 💬 **Chat-Based Interface** - Natural language commands for slide creation

## 🚀 Getting Started

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


4. **Run the development server:**

```bash
npm run dev
```

5. **Open your browser:**

Navigate to [http://localhost:3000](http://localhost:3000)

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

- **PPTX (Green Button)** - Download as PowerPoint file (.pptx)


### Authentication 

- **Sign In** - Credentials
email- john@yopmail.com
password- John@123

