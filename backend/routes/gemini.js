import { Router } from "express";

const router = Router();

const prompt = `You are a bucket list planner assistant. Your job is to suggest one realistic and meaningful bucket list goal.
Include:
1. A short title (1 sentence max)
2. A brief summary (1-2 sentences) describing the goal and why it is worth doing.
Make sure it is achievable, appropriate, and not fictional.
Avoid hallucination. Use only real places and events. Try to generate a different suggestion each time.
Always return **only one goal**.
Do not ask follow-up questions like "Would you like more ideas?"`;

let history = [{ role: "user", parts: [{ text: prompt }] }];

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
          contents: history,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 128,
          },
        }),
      }
    );

    const data = await response.json();
    console.log("Gemini raw response:", JSON.stringify(data, null, 2));

    history.push({
      role: "user",
      parts: [{ text: "Give me another idea." }],
    });

    if (history.length > 6) {
      history = history.slice(-6); // keep only last 6
    }
    const output =
      data?.candidates?.[0]?.content.parts?.[0]?.text ??
      "Hmm... even bucket list bots get writer’s block sometimes!";

    history.push({
      role: "model",
      parts: [{ text: output }],
    });

    res.json({ output });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
