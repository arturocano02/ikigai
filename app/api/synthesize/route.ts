import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { IkigaiDimension, ConversationMessage } from "@/types/ikigai";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { insights, messages } = await req.json() as {
    progress: Record<IkigaiDimension, number>;
    insights: Record<IkigaiDimension, string[]>;
    messages: ConversationMessage[];
  };

  const conversationSummary = messages
    .slice(-30)
    .map((m) => `${m.role === "user" ? "Person" : "Guide"}: ${m.content}`)
    .join("\n");

  const insightsSummary = `
Love insights: ${insights.love.join(", ")}
Good insights: ${insights.good.join(", ")}
World insights: ${insights.world.join(", ")}
Paid insights: ${insights.paid.join(", ")}
`.trim();

  const prompt = `Based on this Ikigai discovery conversation, synthesize a deep, personalized Ikigai profile.

CONVERSATION:
${conversationSummary}

GATHERED INSIGHTS:
${insightsSummary}

Return a JSON object with this exact structure (no markdown, raw JSON only):
{
  "title": "2-4 word unique Ikigai title (e.g. 'Systems Storyteller', 'AI Clarity Builder'). Evocative, not generic.",
  "subtitle": "One sentence capturing the essence - should feel shockingly accurate",
  "highlights": [
    "3-5 word punchy phrase",
    "Another 3-5 word phrase",
    "A third one",
    "Optional fourth"
  ],
  "explanation": "3-4 paragraph deep explanation. Should feel shockingly accurate and emotionally resonant. Reference specific things they said. Use 'you' throughout.",
  "patterns": ["3-5 recurring themes observed in the conversation", "..."],
  "strengths": ["4-6 natural strengths identified from what they described", "..."],
  "idealEnvironments": ["3-4 specific environments where they'd do their best work", "..."],
  "motivations": ["3-5 core motivations driving them", "..."],
  "deepDive": [
    {
      "heading": "6-10 word insight title (like an article headline)",
      "detail": "2-3 sentences of deep, personal insight referencing specifics from the conversation"
    },
    {
      "heading": "Another insight headline",
      "detail": "..."
    },
    {
      "heading": "A third insight",
      "detail": "..."
    },
    {
      "heading": "A fourth insight",
      "detail": "..."
    }
  ],
  "careerKeywords": ["5-8 descriptive keywords describing the role", "..."],
  "jobSearchTerms": ["musician", "content creator", "songwriter"]
}

jobSearchTerms: 3-5 simple, standard job titles (1-3 words each) that a mainstream job board like LinkedIn or Indeed would actually return results for. NOT creative phrases - real job titles (e.g. "software engineer", "product manager", "UX designer", "musician", "marketing manager"). These are used to query real job APIs.

highlights: Ultra-short viral phrases - the kind a person would put in their bio. Think "Teaches through building", "Turns AI human", "Systems thinker with soul". Not generic.
deepDive headings: Intriguing, personal, slightly provocative. Like "The contradiction that makes you powerful" or "Why you get frustrated with most teams". Deep dives should feel like insights only someone who really listened could give.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1800,
    messages: [{ role: "user", content: prompt }],
  });

  const rawText = (response.content[0] as { type: string; text: string }).text;

  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    const synthesis = JSON.parse(jsonMatch[0]);
    // Ensure new fields have fallbacks
    if (!synthesis.highlights) synthesis.highlights = [];
    if (!synthesis.deepDive) synthesis.deepDive = [];
    if (!synthesis.jobSearchTerms) synthesis.jobSearchTerms = synthesis.careerKeywords?.slice(0, 3) || [];
    return NextResponse.json(synthesis);
  } catch {
    return NextResponse.json(
      {
        title: "Purpose Seeker",
        subtitle: "Still discovering your unique intersection.",
        highlights: ["Genuine curiosity", "Meaningful work", "Self-aware"],
        explanation: "Your conversation revealed deep thoughtfulness and genuine self-awareness.",
        patterns: ["Thoughtful and reflective", "Values meaningful work"],
        strengths: ["Self-awareness", "Genuine curiosity"],
        idealEnvironments: ["Collaborative, purposeful spaces"],
        motivations: ["Making a real difference"],
        deepDive: [
          { heading: "The depth you bring to everything", detail: "You don't skim the surface." }
        ],
        careerKeywords: ["meaningful work", "creative problem solving"],
      },
      { status: 200 }
    );
  }
}
