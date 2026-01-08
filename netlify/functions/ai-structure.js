export async function handler(event) {
  try {
    const { text } = JSON.parse(event.body || "{}")

    if (!text || text.trim().length < 5) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No valid text provided" }),
      }
    }

    const prompt = `
You are a medical data extraction engine.

Your task is to convert the doctor's text into STRICT JSON.

RULES (VERY IMPORTANT):
- Output ONLY valid JSON
- Do NOT add explanations
- Do NOT add markdown
- Do NOT add text before or after JSON
- Medicines MUST be an array
- Each medicine MUST be a separate object
- Advice MUST be an array
- If something is unknown, use empty string ""
- NEVER merge multiple medicines into one
- NEVER return null

RETURN FORMAT (EXACT):

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
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0,
            topP: 0.1,
            topK: 1,
            maxOutputTokens: 512,
          },
        }),
      }
    )

    const data = await response.json()
    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || ""

    // 🔐 SAFE JSON EXTRACTION
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          medicines: [],
          advice: [],
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
        }),
      }
    }

    // 🛡️ HARD STRUCTURE VALIDATION
    const medicines = Array.isArray(parsed.medicines)
      ? parsed.medicines.map(m => ({
          name: m.name || "",
          dose: m.dose || "",
          frequency: m.frequency || "",
          timing: m.timing || "",
          duration: m.duration || "",
        }))
      : []

    const advice = Array.isArray(parsed.advice)
      ? parsed.advice.filter(a => typeof a === "string")
      : []

    return {
      statusCode: 200,
      body: JSON.stringify({
        medicines,
        advice,
      }),
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
