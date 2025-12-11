import Groq from "groq-sdk";

export async function GET() {
  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY! });
    const response = await client.models.list();
    return Response.json(response.data);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Unable to list models" });
  }
}

