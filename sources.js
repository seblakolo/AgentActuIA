// Registre des sources, regroupées par verticale.
// category: "ia" | "media" | "design"
// Pour ajouter/retirer une source, édite simplement ce fichier.

export const RSS_SOURCES = [
  // ---- IA / LLM : labos (cœur des "sorties majeures") ----
  { name: "Anthropic", url: "https://www.anthropic.com/news/rss.xml", category: "ia" },
  { name: "OpenAI", url: "https://openai.com/news/rss.xml", category: "ia" },
  { name: "Google DeepMind", url: "https://deepmind.google/blog/rss.xml", category: "ia" },
  { name: "Hugging Face", url: "https://huggingface.co/blog/feed.xml", category: "ia" },
  { name: "Mistral", url: "https://mistral.ai/news/feed.xml", category: "ia" },
  { name: "Meta AI", url: "https://ai.meta.com/blog/rss/", category: "ia" },
  // ---- IA / LLM : newsletters déjà curées (gros boost de signal) ----
  { name: "The Batch (DeepLearning.AI)", url: "https://www.deeplearning.ai/the-batch/rss.xml", category: "ia" },
  { name: "Ahead of AI (Raschka)", url: "https://magazine.sebastianraschka.com/feed", category: "ia" },
  { name: "Last Week in AI", url: "https://lastweekin.ai/feed", category: "ia" },
  { name: "The Verge — AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", category: "ia" },
  // ---- IA / LLM : recherche (volumineux, basse priorité) ----
  { name: "arXiv cs.CL", url: "http://export.arxiv.org/rss/cs.CL", category: "ia", lowPriority: true },
  { name: "arXiv cs.AI", url: "http://export.arxiv.org/rss/cs.AI", category: "ia", lowPriority: true },

  // ---- Photo / Vidéo ----
  { name: "Runway", url: "https://runwayml.com/research/rss.xml", category: "media" },
  { name: "Stability AI", url: "https://stability.ai/news?format=rss", category: "media" },
  { name: "ElevenLabs", url: "https://elevenlabs.io/blog/rss.xml", category: "media" },
  { name: "Black Forest Labs (Flux)", url: "https://bfl.ai/blog/rss.xml", category: "media" },

  // ---- Design / outils ----
  { name: "Sidebar", url: "https://sidebar.io/feed.xml", category: "design" },
  { name: "Smashing Magazine", url: "https://www.smashingmagazine.com/feed/", category: "design" },
  { name: "Figma", url: "https://www.figma.com/blog/feed/", category: "design" },
  { name: "Framer", url: "https://www.framer.com/blog/rss.xml", category: "design" },
];

// Releases GitHub (l'angle où GitHub est vraiment pertinent : le tooling).
export const GITHUB_REPOS = [
  { repo: "ollama/ollama", category: "ia" },
  { repo: "vllm-project/vllm", category: "ia" },
  { repo: "ggml-org/llama.cpp", category: "ia" },
  { repo: "huggingface/transformers", category: "ia" },
  { repo: "comfyanonymous/ComfyUI", category: "media" },
  { repo: "Wan-Video/Wan2.2", category: "media" },
  { repo: "vercel/next.js", category: "design" },
];

// Hacker News (API Algolia, gratuite) : seuil de points pour filtrer le bruit.
export const HN_QUERIES = [
  { query: "LLM", category: "ia", minPoints: 100 },
  { query: "language model", category: "ia", minPoints: 100 },
  { query: "diffusion model", category: "media", minPoints: 80 },
  { query: "video generation", category: "media", minPoints: 80 },
];

// Reddit (JSON public) : top de la semaine.
export const REDDIT_SUBS = [
  { sub: "LocalLLaMA", category: "ia", minScore: 200 },
  { sub: "StableDiffusion", category: "media", minScore: 200 },
  { sub: "aivideo", category: "media", minScore: 80 },
];

export const CATEGORY_LABELS = {
  ia: "IA / LLM",
  media: "Photo & Vidéo",
  design: "Design & outils",
};
