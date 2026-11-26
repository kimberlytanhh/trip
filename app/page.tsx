"use client";

import { useEffect, useRef, useState } from "react";

function uid() {
  return Math.random().toString(36).slice(2);
}

type Memory = {
  destination: string | null;
  days: string | null;
  date: string | null;
  budget: string | null;
  style: string | null;
  companions: string | null;
};

const defaultMemory: Memory = {
  destination: null,
  days: null,
  date: null,
  budget: null,
  style: null,
  companions: null,
};

export default function Home() {
  const [messages, setMessages] = useState<any[]>([
    { id: uid(), role: "ai", type: "text", text: "Hello! I'm your travel planner ✈️ Where would you like to go?" },
  ]);

  const [memory, setMemory] = useState<Memory>(defaultMemory);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* Helper - push message */
  const pushMessage = (msg: any) => setMessages((p) => [...p, { id: uid(), ...msg }]);

  /* Called when user types text and presses send/enter */
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    pushMessage({ role: "user", type: "text", text });
    setInput("");

    // Try to detect destination/days quickly from free text so UX is smoother
    const mem = { ...memory };

    // Destination detection (simple)
    if (!mem.destination && /^[a-zA-Z\s]{3,}$/.test(text.trim())) {
      mem.destination = text.trim();
    }

    // Days detection
    if (!mem.days) {
      const m = text.match(/(\d+)\s*(day|days)?/i);
      if (m) mem.days = m[1];
    }

    // If user used a "Skip" or specific keywords for optional fields, capture them as Not specified
    const lower = text.toLowerCase().trim();
    if (!mem.date && ["skip", "not specified"].includes(lower)) mem.date = "Not specified";
    if (!mem.budget && ["skip", "not specified"].includes(lower)) mem.budget = "Not specified";
    if (!mem.style && ["skip", "not specified"].includes(lower)) mem.style = "Not specified";
    if (!mem.companions && ["skip", "not specified"].includes(lower)) mem.companions = "Not specified";

    setMemory(mem);
    await callBackend(text, mem);
  };

  /* Called when user clicks an option button (field, value) */
  const handleSelect = async (field: keyof Memory, value: string) => {
    const updated = { ...memory, [field]: value === "Skip" ? "Not specified" : value };
    setMemory(updated);

    // show user's selection in chat
    pushMessage({ role: "user", type: "text", text: value });

    // send to backend (backend will examine memory)
    await callBackend(value, updated);
  };

  /* Main backend call: sends current memory and the latest message */
  const callBackend = async (userText: string, mem: Memory) => {
    try {
      setLoading(true);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, memory: mem }),
      });

      const data = await res.json();

      // Defensive: if unexpected shape, show raw reply
      if (!data || !data.payload) {
        pushMessage({ role: "ai", type: "text", text: "No response from server." });
        setLoading(false);
        return;
      }

      const p = data.payload;

      // If backend suggests updating memory, merge it
      if (p.update) {
        setMemory((prev) => ({ ...prev, ...p.update }));
      }

      if (p.type === "question") {
        pushMessage({
          role: "ai",
          type: "question",
          text: p.text,
          field: p.field,
          options: p.options || [],
        });
      } else if (p.type === "itinerary") {
        // Make sure itinerary has days array to prevent crashes
        const itinerary = p.itinerary || { days: [] };
        if (!Array.isArray(itinerary.days)) itinerary.days = [];
      
        pushMessage({
          role: "ai",
          type: "itinerary",
          itinerary,
        });
      } else if (p.type === "error") {
        pushMessage({
          role: "ai",
          type: "text",
          text: p.text || "Something went wrong. Please try again.",
        });
      } else if (p.reply) {
        // backward compatibility: simple text reply (older backends)
        pushMessage({ role: "ai", type: "text", text: p.reply });
      } else {
        pushMessage({ role: "ai", type: "text", text: "Unexpected response from server." });
      }
    } catch (err) {
      console.error("callBackend error:", err);
      pushMessage({ role: "ai", type: "text", text: "Server error. Check console." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex justify-center p-4 bg-gray-100 min-h-screen">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow flex flex-col h-[90vh]">
        <div className="p-4 border-b text-xl font-semibold">Travel Itinerary Planner</div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} msg={msg} onSelect={handleSelect} />
          ))}

          {loading && <div className="text-gray-500">Thinking…</div>}

          <div ref={scrollRef}></div>
        </div>

        <div className="p-4 border-t flex gap-2">
          <input
            className="flex-1 border p-3 rounded"
            placeholder="Type here…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          />
          <button
            onClick={() => sendMessage(input)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}

/* ChatBubble component */
function ChatBubble({ msg, onSelect }: any) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-blue-600 text-white p-3 rounded-xl max-w-[75%]">{msg.text}</div>
      </div>
    );
  }

  if (msg.type === "text") {
    return (
      <div className="flex">
        <div className="bg-gray-200 p-3 rounded-xl max-w-[75%]">{msg.text}</div>
      </div>
    );
  }

  if (msg.type === "question") {
    return (
      <div className="flex flex-col max-w-[75%]">
        <div className="bg-gray-200 p-3 rounded-xl">{msg.text}</div>

        <div className="flex flex-wrap gap-3 mt-3">
          {msg.options?.map((opt: string) => (
            <button
              key={opt}
              onClick={() => onSelect(msg.field, opt)}
              className="px-4 py-2 border rounded bg-white hover:bg-gray-100"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (msg.type === "itinerary") {
    return <Itinerary itinerary={msg.itinerary} />;
  }

  return null;
}

/* Itinerary components */
function Itinerary({ itinerary }: any) {
  const days = Array.isArray(itinerary?.days) ? itinerary.days : [];

  if (days.length === 0) {
    return (
      <div className="bg-yellow-50 border p-3 rounded">
        <div className="font-semibold">No itinerary days returned.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {days.map((day: any, i: number) => (
        <DayCard key={i} day={day} />
      ))}
    </div>
  );
}

function DayCard({ day }: any) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded p-4 bg-white shadow">
      <div className="flex justify-between items-center">
        <div className="font-semibold">{day.title || "Day"}</div>
        <button onClick={() => setOpen((v) => !v)} className="border px-3 py-1 rounded">
          {open ? "Hide" : "Expand"}
        </button>
      </div>

      {open && (
        <div className="mt-2 space-y-2">
          {day.morning && <p><b>Morning:</b> {day.morning}</p>}
          {day.afternoon && <p><b>Afternoon:</b> {day.afternoon}</p>}
          {day.evening && <p><b>Evening:</b> {day.evening}</p>}
          {day.budget && <p><b>Budget:</b> {day.budget}</p>}
          {Array.isArray(day.activities) && day.activities.length > 0 && (
            <div>
              <b>Activities:</b>
              <div className="mt-2 space-y-2">
                {day.activities.map((a: any, idx: number) => (
                  <div key={idx} className="border p-2 rounded flex justify-between">
                    <div>
                      <div className="font-semibold">{a.name}</div>
                      {a.description && <div className="text-sm text-gray-500">{a.description}</div>}
                    </div>
                    {a.price && <div className="font-semibold">{a.price}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
