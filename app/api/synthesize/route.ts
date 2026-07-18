import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { IkigaiDimension, ConversationMessage } from "@/types/ikigai";

const client = new Anthropic();

function cleanDashes(text: string): string {
  return text.replace(/—/g, " - ");
}

export async function POST(req: NextRequest) {
  const { insights, messages, userContext, language = "en" } = await req.json() as {
    progress: Record<IkigaiDimension, number>;
    insights: Record<IkigaiDimension, string[]>;
    messages: ConversationMessage[];
    userContext?: { age?: string; currentRole?: string; currentChallenge?: string };
    language?: "en" | "es";
  };

  const SPANISH_PREFIX = language === "es"
    ? "INSTRUCCIÓN CRÍTICA: Escribe TODO el output en español de España. Los valores JSON deben estar en español. Las claves JSON se quedan en inglés. Usa un español natural, directo y conversacional. NO mezcles idiomas.\n\n"
    : "";

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

  const prompt = `${SPANISH_PREFIX}Based on this Ikigai discovery conversation, synthesize a brutally honest, deeply personal Ikigai profile.
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
  "title": "2-3 word title that will define this person's identity for life. Must be instantly memorable - the kind of thing they'll say when someone asks 'what do you do?' and mean it at soul level. Use unexpected word combinations that feel specific to THEM, not a job title. Think: 'Chaos Architect', 'Quiet Revolutionary', 'Bridge Between Worlds', 'The Honest Mirror'. No corporate language. No generic descriptors. If you could tattoo it, would it mean something?",
  "subtitle": "One direct, declarative sentence - a verdict, not a hedge or a question. Should feel shockingly accurate.",
  "highlights": [
    "3-5 word punchy phrase",
    "Another 3-5 word phrase",
    "A third one",
    "Optional fourth"
  ],
  "explanation": "2-3 SHORT paragraphs (2-3 sentences each, never more). Punchy and conversational, like a smart friend talking to you, not an essay. Should feel shockingly accurate and emotionally resonant. Reference specific things they said. Use 'you' throughout. No filler sentences.",
  "patterns": ["3-5 recurring themes observed in the conversation", "..."],
  "strengths": ["4-6 natural strengths. Be specific, not generic. Not 'good communicator' but 'can translate complex things for people who have already given up trying to understand'", "..."],
  "idealEnvironments": ["3-4 specific environments where they would do their best work", "..."],
  "motivations": ["3-5 core motivations. The real ones, not the socially acceptable answer they gave", "..."],
  "deepDive": [
    {
      "heading": "6-10 word insight title (like an article headline)",
      "detail": "1-2 SHORT, punchy sentences of deep, personal insight referencing specifics from the conversation. No padding."
    },
    {
      "heading": "Another insight headline",
      "detail": "..."
    },
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
  "vennDetails": {
    "love": ["2-4 specific bullet points about what this person truly loves, drawn from the conversation. Full sentences, emotionally resonant."],
    "skill": ["2-4 bullet points about their real natural strengths, with examples where possible."],
    "world": ["2-4 bullet points about what the world actually needs from them specifically."],
    "paid": ["2-4 bullet points about what they can realistically be paid for and why the market values it."],
    "passion": ["2-3 sentences explaining what their PASSION is - the overlap of love and skill. What does it look like when they're in flow?"],
    "mission": ["2-3 sentences on their MISSION - how their love and what the world needs intersect. What cause are they here to serve?"],
    "profession": ["2-3 sentences on their PROFESSION - where their skills meet what people pay for. What's the professional expression of this?"],
    "vocation": ["2-3 sentences on their VOCATION - where world needs and getting paid connect. What role do they fill for others?"],
    "ikigai": ["3-4 bullet points explaining WHY this specific title is their Ikigai. Reference things they said. Make it feel earned, not assigned."]
  },
  "sideQuests": [
    "Specific, concrete action they can take this week or month to start living their Ikigai. Not advice, an actual thing to do. e.g. 'Reach out to one person doing the work you described and ask for 20 minutes'",
    "Another concrete side quest",
    "A third, slightly bolder",
    "A fourth that tests the edges of their comfort zone"
  ],
  "careerPaths": [
    {
      "title": "Path title - evocative 2-4 words (e.g. 'The Builder', 'The Quiet Expert', 'The Bridge')",
      "tagline": "One sentence describing this future and why it fits them specifically.",
      "timeline": "X years or X-Y years ONLY. No months, no sentences. Examples: '1 year', '2-3 years', '3 years'.",
      "milestones": [
        { "period": "Month 1-3", "action": "Concrete first step, specific to their situation" },
        { "period": "Month 3-6", "action": "Next concrete step" },
        { "period": "Year 1", "action": "What they should have achieved by now" },
        { "period": "Year 2", "action": "Where the path leads" },
        { "period": "Year 3+", "action": "The long-term vision for this path" }
      ],
      "searchTerms": ["job title 1", "job title 2"]
    },
    {
      "title": "Second path - meaningfully different from the first",
      "tagline": "...",
      "timeline": "...",
      "milestones": [
        { "period": "Month 1-3", "action": "..." },
        { "period": "Month 6-12", "action": "..." },
        { "period": "Year 1-2", "action": "..." },
        { "period": "Year 3+", "action": "..." }
      ],
      "searchTerms": ["job title 1", "job title 2"]
    },
    {
      "title": "Third path - the unconventional one",
      "tagline": "...",
      "timeline": "...",
      "milestones": [
        { "period": "Month 1", "action": "..." },
        { "period": "Month 3-6", "action": "..." },
        { "period": "Year 1", "action": "..." },
        { "period": "Year 2+", "action": "..." }
      ],
      "searchTerms": ["job title 1"]
    },
    {
      "title": "Fourth path - the bold bet",
      "tagline": "...",
      "timeline": "3-5 years ONLY. No sentences.",
      "milestones": [
        { "period": "Now", "action": "..." },
        { "period": "6 months", "action": "..." },
        { "period": "Year 1-2", "action": "..." },
        { "period": "Year 3-5", "action": "..." }
      ],
      "searchTerms": ["job title 1"]
    }
  ],
  "purposeAdvice": [
    "Piece of life/purpose advice specific to them. Not career advice, broader. The kind of thing a mentor who knew them well would say.",
    "Another one. Can be about relationships, habits, mindset.",
    "A third. Possibly the most important one they need to hear."
  ],
  "ikigaiScore": {
    "score": "Integer 0-100. Be honest. Soul-crushing job, no side projects: 15-25. Meaningful work but underpaid/unfulfilled: 40-55. Mostly aligned, missing one element: 60-75. Genuinely living it: 80+. Most people: 25-60. Do not be generous.",
    "reasoning": "One sentence, max 12 words. The single biggest reason for this score. e.g. 'You love the work but the money is still missing.'",
    "detail": "2-3 sentences. What's already aligned, what gap is keeping the score from being higher, and what would change the number most. Reference specific things they said. Direct, not preachy."
  }
}

jobSearchTerms: 3-5 simple, standard job titles (1-3 words each) that a mainstream job board like LinkedIn or Indeed would actually return results for. NOT creative phrases - real job titles (e.g. "software engineer", "product manager", "UX designer", "musician", "marketing manager"). These are used to query real job APIs.

highlights: Ultra-short viral phrases - the kind a person would put in their bio. Think "Teaches through building", "Turns AI human", "Systems thinker with soul". Not generic.
deepDive headings: Intriguing, personal, slightly provocative. Like "The contradiction that makes you powerful" or "Why you get frustrated with most teams". Deep dives should feel like insights only someone who really listened could give.

EVERY list item (patterns, strengths, idealEnvironments, motivations) must be a single short phrase, max ~8 words. No run-on sentences. These render as scannable bullet points, not prose - keep them tight and punchy.

quadrantItems: Short phrases only. 3-5 words max each. These appear as labels inside the Ikigai Venn diagram circles.
vennDetails: This is what appears when users TAP each area of the Venn diagram. Make it genuinely illuminating - the kind of thing that makes someone stop and say "that's exactly right". Full sentences for passion/mission/profession/vocation/ikigai. Bullet points for the 4 circles.
careerPaths: MUST be 4 genuinely different futures - not variations of the same idea. One should be conventional, one creative, one entrepreneurial, one bold/risky. Each must feel tailor-made for THIS person, referencing specifics from the conversation. The milestones should be honest about what is hard, not just optimistic.
kamiyaNeeds: 2-4 met needs and 2-4 unmet needs. Be selective.
sideQuests: Real, doable actions. Not "find your passion". Specific things to actually do.
purposeAdvice: Not about jobs. About how to live. Direct. Not preachy.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
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
    if (!synthesis.purposeAdvice) synthesis.purposeAdvice = [];
    if (!synthesis.quadrantItems) synthesis.quadrantItems = { love: [], skill: [], world: [], paid: [] };
    if (!synthesis.vennDetails) synthesis.vennDetails = null;
    if (!synthesis.careerPaths) synthesis.careerPaths = [];
    if (!synthesis.kamiyaNeeds) synthesis.kamiyaNeeds = { met: [], unmet: [] };
    if (synthesis.ikigaiScore) {
      synthesis.ikigaiScore.score = Math.min(100, Math.max(0, Math.round(Number(synthesis.ikigaiScore.score))));
    }
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
        vennDetails: null,
        careerPaths: [],
        kamiyaNeeds: { met: [], unmet: [] },
      },
      { status: 200 }
    );
  }
}
