import { Router } from "express";

const router = Router();

const prompt = `You are a bucket list planner assistant. Suggest one realistic and meaningful bucket list goal.
Include:
1. A short title (1 sentence max)
2. A brief summary (1-2 sentences) describing the goal and why it is worth doing.
Make sure it is achievable, safe, culturally appropriate, and not fictional.
Avoid hallucination. Use only real places and events. Try to generate a different suggestion each time.`;

router.post("/generate", async (req, res) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
    const output =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "Hmm... even bucket list bots get writer’s block sometimes!";

    res.json({ output });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
