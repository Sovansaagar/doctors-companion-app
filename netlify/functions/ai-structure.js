export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}")
    const text = body.text || ""

    if (!text || text.trim().length < 5) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No valid text provided" }),
      }
    }

    // ---------------------------------
    // STEP A: PRE-PROCESS INPUT (KEY FIX)
    // ---------------------------------
    const parts = text
      .replace(/\n+/g, "\n")
      .split(/[,.\n]/)
      .map(p => p.trim())
      .filter(Boolean)

    const medicineLines = []
    const adviceLines = []

    for (const p of parts) {
      const l = p.toLowerCase()

      if (
        l.includes("mg") ||
        l.includes("tablet") ||
        l.includes("syrup") ||
        l.includes("capsule") ||
        l.includes("once") ||
        l.includes("twice") ||
        l.includes("daily") ||
        l.includes("night")
      ) {
        medicineLines.push(`MEDICINE_LINE: ${p}`)
      } else {
        adviceLines.push(`ADVICE_LINE: ${p}`)
      }
    }

    const structuredInput = `
${medicineLines.join("\n")}

${adviceLines.join("\n")}
`

    // ---------------------------------
    // STEP B: GEMINI PROMPT
    // ---------------------------------
    const prompt = `
You are a medical prescription structuring engine.

You will receive text with EXPLICIT markers.

STRICT RULES:
- Each MEDICINE_LINE is ONE medicine
- NEVER merge medicines
- Extract name, dose, frequency, timing, duration
- Each ADVICE_LINE is ONE advice
- Output VALID JSON ONLY
- No markdown
- No explanations
- No extra text

JSON FORMAT:
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

INPUT:
${structuredInput}
`

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    )

    const data = await response.json()
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || ""

    let structured
    try {
      structured = JSON.parse(raw)
    } catch {
      return {
        statusCode: 422,
        body: JSON.stringify({
          error: "Invalid JSON from AI",
          raw,
        }),
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structured,
        debug: {
          medicinesDetected: medicineLines.length,
          adviceDetected: adviceLines.length,
        },
      }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
