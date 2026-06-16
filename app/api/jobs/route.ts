import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { JobMatch, IkigaiSynthesis } from "@/types/ikigai";

const client = new Anthropic();

// Countries to try in order — stops when we have enough results
const ADZUNA_COUNTRIES = ["us", "gb", "au", "ca"];

export async function POST(req: NextRequest) {
  const { keywords, synthesis, country } = await req.json() as {
    keywords: string;
    synthesis?: IkigaiSynthesis;
    country?: string; // single country code: "us" | "gb" | "au" | "ca"
  };

  // Use simple, searchable job titles if available; otherwise extract first word of each keyword
  const searchTerms: string[] = synthesis?.jobSearchTerms?.length
    ? synthesis.jobSearchTerms
    : keywords.split(",").map((k) => k.trim().split(/\s+/).slice(0, 2).join(" ")).filter(Boolean);

  const jobs: JobMatch[] = [];
  let totalFound = 0;

  // Country list: single country if specified, else multi-country fallback
  const countriesToSearch = country ? [country] : ADZUNA_COUNTRIES;

  // Adzuna — try each search term across countries until we have 6+ results
  if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) {
    for (const term of searchTerms.slice(0, 4)) {
      if (jobs.length >= 6) break;
      for (const c of countriesToSearch) {
        if (jobs.length >= 8) break;
        try {
          const url =
            `https://api.adzuna.com/v1/api/jobs/${c}/search/1` +
            `?app_id=${process.env.ADZUNA_APP_ID}` +
            `&app_key=${process.env.ADZUNA_APP_KEY}` +
            `&results_per_page=4` +
            `&what=${encodeURIComponent(term)}` +
            `&content-type=application/json`;

          const res = await fetch(url, { next: { revalidate: 3600 } });
          if (!res.ok) continue;

          const data = await res.json();
          // Accumulate total available count from Adzuna
          if (typeof data.count === "number") totalFound += data.count;

          for (const job of data.results || []) {
            if (jobs.some((j) => j.id === job.id)) continue; // dedupe
            jobs.push({
              id: job.id,
              title: job.title,
              company: job.company?.display_name || "Unknown",
              location: job.location?.display_name || "Remote",
              salary:
                job.salary_min && job.salary_max
                  ? formatSalary(job.salary_min, job.salary_max, c)
                  : null,
              url: job.redirect_url,
              ikigaiAlignment: "",
              matchScore: 0,
              skills: extractSkills(job.description),
              fitReasons: [],
              source: "Adzuna",
              _description: (job.description || "").slice(0, 400),
            } as JobMatch & { _description: string });
          }
          if (jobs.filter((j) => j.source === "Adzuna").length >= 4) break;
        } catch {
          // continue to next country
        }
      }
    }
  }

  // RemoteOK — fills gaps with remote roles (skip if a specific country was requested)
  if (!country && jobs.length < 6) {
    for (const term of searchTerms.slice(0, 3)) {
      if (jobs.length >= 8) break;
      try {
        const res = await fetch(
          `https://remoteok.com/api?tag=${encodeURIComponent(term)}`,
          { headers: { "User-Agent": "Ikigai/1.0" }, next: { revalidate: 3600 } }
        );
        if (!res.ok) continue;
        const data = await res.json();
        const listings = Array.isArray(data) ? data.slice(1, 6) : [];
        for (const job of listings) {
          if (!job.position || !job.company) continue;
          if (jobs.some((j) => j.id === String(job.id))) continue;
          jobs.push({
            id: job.id?.toString() || Math.random().toString(),
            title: job.position,
            company: job.company,
            location: "Remote",
            salary: job.salary || null,
            url: job.url || `https://remoteok.com/l/${job.slug}`,
            ikigaiAlignment: "",
            matchScore: 0,
            skills: (job.tags || []).slice(0, 5),
            fitReasons: [],
            source: "RemoteOK",
            _description: (job.description || "").slice(0, 400),
          } as JobMatch & { _description: string });
        }
      } catch {
        // continue
      }
    }
  }

  const trimmedJobs = jobs.slice(0, 9);

  // No real jobs found — use demo fallback
  if (trimmedJobs.length === 0) {
    return NextResponse.json({ jobs: getDemoJobs(synthesis) });
  }

  // Single LLM call: score relevance + generate personalized fit reasons
  if (synthesis) {
    try {
      const jobList = trimmedJobs
        .map((j, i) => {
          const desc = (j as JobMatch & { _description?: string })._description || "";
          return `${i + 1}. "${j.title}" at ${j.company} (${j.location})${desc ? ` - "${desc.slice(0, 120)}..."` : ""}`;
        })
        .join("\n");

      const prompt = `Person's Ikigai profile:
Title: ${synthesis.title}
Strengths: ${synthesis.strengths.slice(0, 4).join(", ")}
Core motivations: ${synthesis.motivations.slice(0, 3).join(", ")}
Highlights: ${synthesis.highlights?.join(", ") || ""}
Patterns: ${synthesis.patterns.slice(0, 3).join(", ")}

Job listings:
${jobList}

For each job:
1. Rate match 60-100 (how well this role fits the person's Ikigai)
2. Write 2 short bullets (under 14 words each) explaining specifically WHY this person fits - reference their actual strengths/motivations by name, not generic phrases

Return only valid JSON:
{"results": [{"index": 1, "score": 85, "reasons": ["bullet one", "bullet two"]}, ...]}`;

      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 700,
        messages: [{ role: "user", content: prompt }],
      });

      const raw = (response.content[0] as { type: string; text: string }).text;
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as {
          results: { index: number; score: number; reasons: string[] }[];
        };
        for (const item of parsed.results) {
          const job = trimmedJobs[item.index - 1];
          if (job) {
            job.matchScore = Math.min(100, Math.max(60, item.score));
            job.fitReasons = item.reasons || [];
            job.ikigaiAlignment = item.reasons[0] || "";
          }
        }
      }
    } catch {
      // LLM failed - set fallback scores
      trimmedJobs.forEach((job, i) => {
        job.matchScore = 85 - i * 3;
        job.ikigaiAlignment = "Strong alignment with your profile.";
      });
    }
  } else {
    trimmedJobs.forEach((job, i) => {
      job.matchScore = 85 - i * 3;
    });
  }

  // Sort by match score, remove internal _description field
  const sorted = trimmedJobs
    .sort((a, b) => b.matchScore - a.matchScore)
    .map(({ ...job }) => {
      delete (job as Record<string, unknown>)._description;
      return job;
    });

  return NextResponse.json({ jobs: sorted, totalFound });
}

function formatSalary(min: number, max: number, country: string): string {
  const sym = country === "gb" ? "£" : country === "au" ? "A$" : country === "ca" ? "C$" : "$";
  return `${sym}${Math.round(min / 1000)}k-${sym}${Math.round(max / 1000)}k`;
}

function extractSkills(description: string = ""): string[] {
  const common = [
    "communication", "leadership", "strategy", "design", "writing",
    "analytics", "product", "engineering", "marketing", "research",
    "collaboration", "problem-solving", "creativity", "management",
  ];
  const lower = description.toLowerCase();
  return common.filter((s) => lower.includes(s)).slice(0, 5);
}

function getDemoJobs(synthesis?: IkigaiSynthesis): JobMatch[] {
  const title = synthesis?.title || "Your Ikigai";
  return [
    {
      id: "demo-1",
      title: "Head of Creative Strategy",
      company: "Studio Somewhere",
      location: "London / Remote",
      salary: "£65k-£85k",
      url: "https://www.linkedin.com/jobs/search/?keywords=creative+strategy+head",
      ikigaiAlignment: `Rare blend of strategic thinking that fits ${title}.`,
      matchScore: 88,
      skills: ["strategy", "storytelling", "leadership", "creativity"],
      fitReasons: [`Directly matches your strength profile`, `Aligns with your core motivation`],
      source: "Demo",
    },
    {
      id: "demo-2",
      title: "Product Experience Lead",
      company: "Thoughtful Co.",
      location: "Remote",
      salary: "£70k-£90k",
      url: "https://www.linkedin.com/jobs/search/?keywords=product+experience+lead",
      ikigaiAlignment: "Combines systems thinking with a human-centered approach.",
      matchScore: 84,
      skills: ["product", "UX", "leadership", "research"],
      fitReasons: ["Your pattern of turning complexity into clarity fits perfectly", "This role rewards your natural systems thinking"],
      source: "Demo",
    },
    {
      id: "demo-3",
      title: "Innovation Consultant",
      company: "Future Forward",
      location: "London",
      salary: "£60k-£80k",
      url: "https://www.linkedin.com/jobs/search/?keywords=innovation+consultant",
      ikigaiAlignment: "Translates complex problems into clear, impactful solutions.",
      matchScore: 80,
      skills: ["consulting", "strategy", "communication", "problem-solving"],
      fitReasons: ["Your drive for meaningful impact is exactly what clients pay for", "Your ability to communicate across audiences is rare here"],
      source: "Demo",
    },
  ];
}
