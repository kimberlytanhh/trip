# TripGenie — AI Travel Itinerary Planner

TripGenie is an AI-powered travel itinerary planner that helps users create personalised travel plans through an interactive chatbot. Users provide their travel preferences, and the application generates a structured itinerary with suggested activities for each day.

## Features

- **Conversational Travel Planning** — Interact with an AI chatbot to plan your trip.
- **Destination Selection** — Specify your preferred travel destination.
- **Flexible Trip Duration** — Choose how many days you plan to travel.
- **Personalised Preferences** — Provide your travel date, budget, travel style and travel companions.
- **AI-Generated Itineraries** — Generate daily travel plans with morning, afternoon and evening activities.
- **Expandable Daily Plans** — Expand or collapse each day to view itinerary details.

## Technologies Used

| Technology | Purpose |
|---|---|
| Next.js 16 | Full-stack web framework |
| React 19 | User interface |
| TypeScript | Application development |
| Tailwind CSS 4 | Styling |
| Groq SDK | AI model integration |
| Llama 3.3 70B Versatile | Itinerary generation |

## How It Works

1. Start a conversation with the TripGenie chatbot.
2. Enter your travel destination.
3. Select your trip duration.
4. Answer questions about your travel date, budget, travel style and companions.
5. TripGenie uses the collected information to generate a personalised itinerary.
6. Expand each day to explore the suggested activities.

## Project Structure

```text
trip/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
├── .gitignore
├── next.config.ts
├── package.json
├── package-lock.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js
- npm
- A Groq API key

### 1. Clone the repository

```bash
git clone https://github.com/kimberlytanhh/trip.git
```

### 2. Navigate to the project folder

```bash
cd trip
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a file named `.env.local` in the root directory and add:

```env
GROQ_API_KEY=your_groq_api_key
```

Replace `your_groq_api_key` with your own API key.

**Important:** Never upload your actual API key to GitHub.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server |
| `npm run build` | Builds the application |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint checks |

## Environment Variables

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | API key used to access the Groq AI service |

## Future Improvements

- Improve itinerary recommendations with more detailed travel information.
- Add options to save and revisit generated itineraries.
- Enhance the chatbot interface and user experience.
- Introduce additional travel preferences and customisation options.

## Author

**Kimberly Tan**

- GitHub: [@kimberlytanhh](https://github.com/kimberlytanhh)

---

*Built with Next.js, React, TypeScript and AI ♡*
