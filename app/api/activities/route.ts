import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { city, dates, ikigaiTitle, sideQuests, language = "en" } = await req.json() as {
    city: string;
    dates?: string;
    ikigaiTitle?: string;
    sideQuests?: string[];
    language?: "en" | "es";
  };

  if (!city?.trim()) {
    return NextResponse.json({ error: "City is required" }, { status: 400 });
  }

  const context = [
    ikigaiTitle ? `The person's Ikigai title: "${ikigaiTitle}"` : "",
    sideQuests?.length ? `Their side quests: ${sideQuests.slice(0, 3).join("; ")}` : "",
    dates ? `Dates: ${dates}` : "",
  ].filter(Boolean).join("\n");

  const prompt = `You are helping someone find real local activities in ${city}${dates ? ` around ${dates}` : ""} that align with their Ikigai.

${context ? `CONTEXT:\n${context}\n` : ""}

Generate 6 specific, concrete activity suggestions for ${city}. Each should feel like something real that exists there — reference actual types of venues, communities, or events that are common in that city (e.g. for Spain: Meetup España, Eventbrite ES, local ateneos, coworkings, asociaciones culturales). Mix online and in-person. Focus on activities that would genuinely help someone explore their purpose and connect with like-minded people.

${language === "es" ? "Write ALL output in Spanish (Spain dialect). Keep the JSON keys in English." : ""}

Return a JSON array (no markdown):
[
  {
    "title": "Short activity name",
    "description": "1-2 sentences. Why this is relevant to their Ikigai and what they'd actually do.",
    "type": "workshop | meetup | community | online | volunteer | creative",
    "where": "Type of venue or platform (e.g. 'Local makerspaces', 'Meetup.com', 'Eventbrite')",
    "action": "One concrete thing to do right now to find this (e.g. 'Search Meetup.com for...')"
  }
]`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (response.content[0] as { type: string; text: string }).text;
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON array");
    return NextResponse.json({ activities: JSON.parse(match[0]) });
  } catch {
    return NextResponse.json({ activities: [] }, { status: 200 });
  }
}
