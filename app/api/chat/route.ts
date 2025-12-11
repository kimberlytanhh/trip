import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

type Memory = {
  destination?: string | null;
  days?: string | null;
  date?: string | null;
  budget?: string | null;
  style?: string | null;
  companions?: string | null;
};

function makeQuestion(text: string, field: string, options: string[] = [], update?: Memory) {
  return Response.json({
    payload: {
      type: "question",
      text,
      field,
      options,
      update: update || null,
    },
  });
}

function safeJsonParse(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    // Try to extract first {...} block
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message: string = (body?.message || "").toString();
    const memory: Memory = body?.memory || {};

    const lower = message.toLowerCase().trim();

    // Helper to check if a field is present and non-empty
    const has = (k: keyof Memory) => memory[k] !== undefined && memory[k] !== null && String(memory[k]).trim() !== "";

    // 1) Destination
    if (!has("destination")) {
      // If user typed a simple destination in message, accept it
      if (/^[a-zA-Z\s]{2,}$/.test(message.trim())) {
        memory.destination = message.trim();
      } else {
        return makeQuestion("Where would you like to go?", "destination", []);
      }
    }

    // 2) Days
    if (!has("days")) {
      const m = message.match(/(\d+)\s*(day|days)?/i);
      if (m) {
        memory.days = m[1];
      } else {
        return makeQuestion(`How many days will you stay in ${memory.destination}?`, "days", ["3", "5", "7"]);
      }
    }

    // The optional fields we will prompt for one-by-one: date, budget, style, companions
    // If frontend already set memory for them (e.g., via selection buttons), we'll pick them up.

    // 3) Date (optional)
    if (!has("date")) {
      const allowed = ["next month", "in 3 months", "summer", "winter", "skip"];
      if (allowed.includes(lower)) {
        memory.date = lower === "skip" ? "Not specified" : message;
      } else {
        return makeQuestion("When do you plan to travel? (Optional)", "date", ["Next month", "In 3 months", "Summer", "Winter", "Skip"], memory);
      }
    }

    // 4) Budget
    if (!has("budget")) {
      const allowed = ["budget", "mid-range", "midrange", "luxury", "skip"];
      if (allowed.includes(lower)) {
        memory.budget = lower === "skip" ? "Not specified" : message;
      } else {
        return makeQuestion("What is your budget range?", "budget", ["Budget", "Mid-range", "Luxury", "Skip"], memory);
      }
    }

    // 5) Style
    if (!has("style")) {
      const allowed = ["relaxed", "balanced", "packed", "skip"];
      if (allowed.includes(lower)) {
        memory.style = lower === "skip" ? "Not specified" : message;
      } else {
        return makeQuestion("What is your travel style?", "style", ["Relaxed", "Balanced", "Packed", "Skip"], memory);
      }
    }

    // 6) Companions
    if (!has("companions")) {
      const allowed = ["solo", "friends", "couple", "family", "skip"];
      if (allowed.includes(lower)) {
        memory.companions = lower === "skip" ? "Not specified" : message;
      } else {
        return makeQuestion("Who are you traveling with?", "companions", ["Solo", "Friends", "Couple", "Family", "Skip"], memory);
      }
    }

    // All required fields collected — call the model to generate itinerary
    const prompt = `
You are TripGenie. The backend collected all required travel details. Do NOT ask any questions.
The user has provided:
Destination: ${memory.destination}
Days: ${memory.days}
Date: ${memory.date}
Budget: ${memory.budget}
Style: ${memory.style}
Companions: ${memory.companions}

Your task: Generate an itinerary in JSON ONLY (no extra text). Format exactly like:

{
  "days": [
    {
      "title": "Day 1 — <brief title>",
      "morning": "Morning activities...",
      "afternoon": "Afternoon activities...",
      "evening": "Evening activities...",
      "budget": "<estimated budget for this day>",
      "activities": [
         { "name": "", "description": "", "price": "" }
      ]
    }
  ]
}

Make the number of days equal to the provided Days. Keep entries concise but useful.
`;

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are TripGenie. Do NOT ask questions. Output ONLY JSON when asked to produce itinerary." },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "";

    // Try parsing JSON robustly
    let parsed = safeJsonParse(raw);
    if (!parsed) {
      // If model returned something that isn't JSON (maybe it asked a question), return it as a 'question' reply for UI to display
      // We'll return the raw text as a reply so the frontend can show it if it's asking for clarification
      return Response.json({
        payload: {
          type: "question",
          text: raw,
          field: "ai_message",
          options: [],
        },
      });
    }

    // Ensure days array exists and has the correct length
    if (!Array.isArray(parsed.days)) parsed.days = [];
    const requestedDays = parseInt(String(memory.days || "0"), 10) || parsed.days.length || 1;

    // If days array is shorter than requestedDays, try to duplicate last day or pad simple placeholders
    while (parsed.days.length < requestedDays) {
      parsed.days.push({
        title: `Day ${parsed.days.length + 1}`,
        morning: "",
        afternoon: "",
        evening: "",
        budget: memory.budget || "",
        activities: [],
      });
    }

    // Ensure each day has budget property
    parsed.days = parsed.days.map((d: any) => ({
      title: d.title || "Untitled",
      morning: d.morning || "",
      afternoon: d.afternoon || "",
      evening: d.evening || "",
      budget: d.budget || memory.budget || "",
      activities: Array.isArray(d.activities) ? d.activities : [],
    }));

    return Response.json({
      payload: {
        type: "itinerary",
        itinerary: parsed,
      },
    });
  } catch (err) {
    console.error("route error:", err);
    return Response.json({ payload: { type: "error", text: "Server error" } });
  }
}