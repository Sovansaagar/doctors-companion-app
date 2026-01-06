export async function handler(event) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing GEMINI_API_KEY" }),
      }
    }

    const { text } = JSON.parse(event.body || "{}")

    if (!text || text.trim().length < 10) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          medicines: [],
          advice: [],
        }),
      }
    }

    const prompt = `
You are a senior clinical assistant.

Your task is to STRUCTURE the doctor's prescription text into VALID JSON.

VERY IMPORTANT RULES:
- Output ONLY valid JSON
- No markdown
- No explanations
- No backticks
- No extra text before or after JSON
- Always return arrays (even if empty)

JSON FORMAT (STRICT):
{
  "medicines": [
    {
      "name": "",
      "dose": "",
      "frequency": "",
      "timing": "",
      "duration": ""
    }
  ],
  "advice": []
}

Doctor text:
${text}
`

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    )

    const data = await response.json()

    const rawOutput =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || ""

    // 🔒 SAFETY: Extract JSON even if Gemini adds junk
    const jsonMatch = rawOutput.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          medicines: [],
          advice: [],
          _debug: "No JSON found in Gemini response",
          _raw: rawOutput,
        }),
      }
    }

    let parsed
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch (e) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          medicines: [],
          advice: [],
          _debug: "JSON parse failed",
          _raw: jsonMatch[0],
        }),
      }
    }

    // Final hard guarantee
    return {
      statusCode: 200,
      body: JSON.stringify({
        medicines: Array.isArray(parsed.medicines)
          ? parsed.medicines
          : [],
        advice: Array.isArray(parsed.advice)
          ? parsed.advice
          : [],
      }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Function crashed",
        message: err.message,
      }),
    }
  }
}
