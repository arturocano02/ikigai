import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { IkigaiDimension, ConversationMessage } from "@/types/ikigai";

const client = new Anthropic();

function cleanDashes(text: string): string {
  return text.replace(/—/g, " - ");
}

export async function POST(req: NextRequest) {
  const { insights, messages, userContext } = await req.json() as {
    progress: Record<IkigaiDimension, number>;
    insights: Record<IkigaiDimension, string[]>;
    messages: ConversationMessage[];
    userContext?: { age?: string; currentRole?: string; currentChallenge?: string };
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

  const userContextBlock = userContext && (userContext.age || userContext.currentRole || userContext.currentChallenge)
    ? `\nUSER CONTEXT:\n${[
        userContext.age ? `Age: ${userContext.age}` : "",
        userContext.currentRole ? `Current situation: ${userContext.currentRole}` : "",
        userContext.currentChallenge ? `What they are trying to figure out: ${userContext.currentChallenge}` : "",
      ].filter(Boolean).join("\n")}\n`
    : "";

  const prompt = `Based on this Ikigai discovery conversation, synthesize a brutally honest, deeply personal Ikigai profile.
${userContextBlock}
CONVERSATION:
${conversationSummary}

GATHERED INSIGHTS:
${insightsSummary}

ANALYTICAL LENS. Use Kamiya's 7 psychological needs (survival, growth, future/goals, influence, freedom, self-fulfillment, meaning) as your analytical backbone. Identify which needs are currently being met and which are not, based on what the person said. Do not mention Kamiya or use that name anywhere in your output. Write the kamiyaNeeds values in plain language the user will understand.

PERSONALITY ANALYSIS RULES. THIS IS THE MOST IMPORTANT PART:
- Don't restate what they said. Tell them what it MEANS about them that they don't already know.
- Take a real stance. Not "you seem to enjoy creativity". Say "you're someone who can't function in environments that value process over output, and this has probably caused real friction."
- Point out the tension or contradiction in what they said. Most people have one. Find it.
- Be the person who sees them clearly and says it plainly. Not a therapist. Not a coach. Just honest.
- One paragraph should feel slightly uncomfortable, like someone who actually paid attention.
- Reference specifics from the conversation. Not generic observations.

Return a JSON object with this exact structure (no markdown, raw JSON only):
{
  "title": "2-4 word unique Ikigai title (e.g. 'Systems Storyteller', 'AI Clarity Builder'). Evocative, not generic.",
  "subtitle": "One sentence capturing the essence. Should feel shockingly accurate, not flattering.",
  "highlights": [
    "3-5 word punchy phrase",
    "Another 3-5 word phrase",
    "A third one",
    "Optional fourth"
  ],
  "explanation": "3-4 paragraphs. First: what makes them tick beneath the surface, the real pattern not the surface interest. Second: name the tension or blind spot you observed. Third: what they are actually building toward. Fourth: what they need to stop waiting for. Use 'you' throughout. No filler, no affirmations. Be direct.",
  "patterns": ["3-5 recurring themes observed in the conversation", "..."],
  "strengths": ["4-6 natural strengths. Be specific, not generic. Not 'good communicator' but 'can translate complex things for people who have already given up trying to understand'", "..."],
  "idealEnvironments": ["3-4 specific environments where they would do their best work", "..."],
  "motivations": ["3-5 core motivations. The real ones, not the socially acceptable answer they gave", "..."],
  "deepDive": [
    {
      "heading": "6-10 word insight title. Intriguing, personal, slightly provocative. Like 'The contradiction that makes you powerful' or 'Why you get frustrated with most teams'",
      "detail": "2-3 sentences of sharp, personal insight referencing specifics from the conversation. Should feel like something only someone who really listened could say."
    },
    { "heading": "Another insight headline", "detail": "..." },
    { "heading": "A third insight", "detail": "..." },
    { "heading": "A fourth insight", "detail": "..." }
  ],
  "careerKeywords": ["5-8 descriptive keywords describing the role", "..."],
  "jobSearchTerms": ["musician", "content creator", "songwriter"],
  "quadrantItems": {
    "love": ["2-3 specific things this person loves, based on what they said. Short phrases."],
    "skill": ["2-3 specific things they are naturally good at. Short phrases."],
    "world": ["2-3 specific ways they can contribute to the world. Short phrases."],
    "paid": ["2-3 things they could realistically be paid for. Short phrases."]
  },
  "kamiyaNeeds": {
    "met": [
      "Name one of the 7 needs and explain in one sentence why it is currently being met. e.g. 'Growth and Change: you are constantly learning new things through your work.'"
    ],
    "unmet": [
      "Name one of the 7 needs and explain in one sentence why it is not currently being met. e.g. 'Influence: the work you do does not feel necessary to the people around you.'"
    ]
  },
  "sideQuests": [
    "Specific, concrete action they can take this week or month to start living their Ikigai. Not advice, an actual thing to do. e.g. 'Reach out to one person doing the work you described and ask for 20 minutes'",
    "Another concrete side quest",
    "A third, slightly bolder",
    "A fourth that tests the edges of their comfort zone"
  ],
  "careerTransition": {
    "steps": [
      "Concrete step 1, specific to their current situation and where they want to go",
      "Step 2",
      "Step 3",
      "Step 4. The one most people skip."
    ],
    "timeline": "Realistic timeframe e.g. '6-18 months depending on how fast you move'"
  },
  "purposeAdvice": [
    "Piece of life/purpose advice specific to them. Not career advice, broader. The kind of thing a mentor who knew them well would say.",
    "Another one. Can be about relationships, habits, mindset.",
    "A third. Possibly the most important one they need to hear."
  ]
}

jobSearchTerms: 3-5 simple, standard job titles (1-3 words each) that a mainstream job board like LinkedIn or Indeed would return results for. NOT creative phrases. Real job titles (e.g. "software engineer", "product manager", "UX designer", "musician", "marketing manager"). These are used to query real job APIs.
highlights: Ultra-short viral phrases. The kind a person would put in their bio. Think "Teaches through building", "Turns AI human", "Systems thinker with soul". Not generic.
quadrantItems: Short phrases only. 3-5 words max each. These appear inside the Ikigai Venn diagram.
kamiyaNeeds: 2-4 met needs and 2-4 unmet needs. Be selective. Only include the most meaningful ones.
sideQuests: Real, doable actions. Not "find your passion" or "try new things". Specific things they can actually do.
careerTransition: Reference their current role/situation if known. Steps should be honest about what is hard, not just optimistic.
purposeAdvice: Not about jobs. About how to live. Direct. Not preachy.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2800,
    messages: [{ role: "user", content: prompt }],
  });

  const rawText = cleanDashes((response.content[0] as { type: string; text: string }).text);

  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    const synthesis = JSON.parse(jsonMatch[0]);
    if (!synthesis.highlights) synthesis.highlights = [];
    if (!synthesis.deepDive) synthesis.deepDive = [];
    if (!synthesis.jobSearchTerms) synthesis.jobSearchTerms = synthesis.careerKeywords?.slice(0, 3) || [];
    if (!synthesis.sideQuests) synthesis.sideQuests = [];
    if (!synthesis.careerTransition) synthesis.careerTransition = { steps: [], timeline: "" };
    if (!synthesis.purposeAdvice) synthesis.purposeAdvice = [];
    if (!synthesis.quadrantItems) synthesis.quadrantItems = { love: [], skill: [], world: [], paid: [] };
    if (!synthesis.kamiyaNeeds) synthesis.kamiyaNeeds = { met: [], unmet: [] };
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
        quadrantItems: { love: [], skill: [], world: [], paid: [] },
        kamiyaNeeds: { met: [], unmet: [] },
      },
      { status: 200 }
    );
  }
}
