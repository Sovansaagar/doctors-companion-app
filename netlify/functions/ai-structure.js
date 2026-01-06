export async function handler(event) {
  try {
    const { text } = JSON.parse(event.body)

    const prompt = `
You are a backend medical data extraction engine.

You MUST follow these rules strictly.

RULES:
- Respond ONLY with valid JSON
- No explanations
- No markdown
- No comments
- No extra text
- If unsure, return empty arrays
- If no medicines, medicines must be []
- If no advice, advice must be []

OUTPUT FORMAT (EXACT):

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

EXAMPLE INPUT:
"Paracetamol 650 mg twice daily for 3 days, walk daily"

EXAMPLE OUTPUT:
{
  "medicines": [
    {
      "name": "Paracetamol",
      "dose": "650 mg",
      "frequency": "Twice daily",
      "timing": "",
      "duration": "3 days"
    }
  ],
  "advice": [
    "Walk daily"
  ]
}

NOW PROCESS THIS INPUT:
${text}

REMEMBER:
RETURN ONLY JSON.
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
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    )

    const data = await response.json()

    let outputText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || ""

    // 🔒 STRICT JSON EXTRACTION
    const start = outputText.indexOf("{")
    const end = outputText.lastIndexOf("}")

    if (start === -1 || end === -1) {
      // SAFE FALLBACK
      return {
        statusCode: 200,
        body: JSON.stringify({
          medicines: [],
          advice: [],
        }),
      }
    }

    const jsonString = outputText.slice(start, end + 1)
    const parsed = JSON.parse(jsonString)

    return {
      statusCode: 200,
      body: JSON.stringify(parsed),
    }
  } catch (err) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        medicines: [],
        advice: [],
      }),
    }
  }
}
