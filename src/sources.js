// Registre des sources, regroupées par verticale.
// category: "ia" | "media" | "design"

// Flux RSS officiels — uniquement ceux validés au run (les morts ont migré vers Google News).
export const RSS_SOURCES = [
  { name: "OpenAI", url: "https://openai.com/news/rss.xml", category: "ia" },
  { name: "Google DeepMind", url: "https://deepmind.google/blog/rss.xml", category: "ia" },
  { name: "Hugging Face", url: "https://huggingface.co/blog/feed.xml", category: "ia" },
  { name: "Last Week in AI", url: "https://lastweekin.ai/feed", category: "ia" },
  { name: "Ahead of AI (Raschka)", url: "https://magazine.sebastianraschka.com/feed", category: "ia" },
  { name: "The Verge — AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", category: "ia" },
  { name: "Sidebar", url: "https://sidebar.io/feed.xml", category: "design" },
  { name: "Smashing Magazine", url: "https://www.smashingmagazine.com/feed/", category: "design" },
  { name: "arXiv cs.CL", url: "http://export.arxiv.org/rss/cs.CL", category: "ia", lowPriority: true },
  { name: "arXiv cs.AI", url: "http://export.arxiv.org/rss/cs.AI", category: "ia", lowPriority: true },
];

// Google News RSS : couvre les acteurs sans flux fiable + capte les annonces X/Discord via la presse.
export const GOOGLE_NEWS_QUERIES = [
  { query: "Anthropic Claude", category: "ia" },
  { query: "Mistral AI model", category: "ia" },
  { query: "Meta Llama AI", category: "ia" },
  { query: "Google Gemini model", category: "ia" },
  { query: "AI video generation", category: "media" },
  { query: "Runway AI video", category: "media" },
  { query: "Kling AI video", category: "media" },
  { query: "OpenAI Sora", category: "media" },
  { query: "Midjourney", category: "media" },
  { query: "Black Forest Labs Flux image", category: "media" },
  { query: "ElevenLabs AI voice", category: "media" },
  { query: "Figma AI design tool", category: "design" },
  { query: "Framer AI website", category: "design" },
];

export const GITHUB_REPOS = [
  { repo: "ollama/ollama", category: "ia" },
  { repo: "vllm-project/vllm", category: "ia" },
  { repo: "ggml-org/llama.cpp", category: "ia" },
  { repo: "huggingface/transformers", category: "ia" },
  { repo: "comfyanonymous/ComfyUI", category: "media" },
  { repo: "Wan-Video/Wan2.2", category: "media" },
  { repo: "vercel/next.js", category: "design" },
];

export const HN_QUERIES = [
  { query: "LLM", category: "ia", minPoints: 100 },
  { query: "language model", category: "ia", minPoints: 100 },
  { query: "diffusion model", category: "media", minPoints: 80 },
  { query: "video generation", category: "media", minPoints: 80 },
];

export const REDDIT_SUBS = [
  { sub: "LocalLLaMA", category: "ia", minScore: 200 },
  { sub: "StableDiffusion", category: "media", minScore: 200 },
  { sub: "aivideo", category: "media", minScore: 80 },
];

export const CATEGORY_LABELS = { ia: "IA / LLM", media: "Photo & Vidéo", design: "Design & outils" };
