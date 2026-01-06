export async function handler(event) {
  try {
    const body = JSON.parse(event.body || "{}")
    const text = body.text || ""

    if (!text || text.trim().length < 5) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No valid text provided" }),
      }
    }

    // -----------------------------
    // PRE-PROCESSING (THE FIX)
    // -----------------------------

    const lines = text
      .replace(/\n+/g, "\n")
      .split(/[,.\n]/)
      .map(l => l.trim())
      .filter(Boolean)

    let medicineLines = []
    let adviceLines = []

    for (const line of lines) {
      const lower = line.toLowerCase()

      if (
        lower.includes("tablet") ||
        lower.includes("mg") ||
        lower.includes("syrup") ||
        lower.includes("capsule") ||
        lower.includes("once") ||
        lower.includes("twice") ||
        lower.includes("daily")
      ) {
        medicineLines.push(`MEDICINE_LINE: ${line}`)
      } else {
        adviceLines.push(`ADVICE_LINE: ${line}`)
      }
    }

    const structuredInput = `
${medicineLines.join("\n")}

${adviceLines.join("\n")}
`

    // -----------------------------
    // GEMINI PROMPT
    // -----------------------------

    const prompt = `
You are a medical prescription structuring engine.

You will receive text with EXPLICIT markers.

RULES (MANDATORY):
- Each MEDICINE_LINE represents ONE medicine
- NEVER merge medicines
- Extract name, dose, frequency, timing, duration
- Each ADVICE_LINE is ONE advice item
- Output MUST be VALID JSON ONLY
- NO markdown
- NO explanations
- NO extra text

JSON FORMAT (FOLLOW EXACTLY):
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
    } catch (err) {
      return {
        statusCode: 422,
        body: JSON.stringify({
          error: "AI returned invalid JSON",
          raw_output: raw,
        }),
      }
    }

    if (!Array.isArray(structured.medicines)) structured.medicines = []
    if (!Array.isArray(structured.advice)) structured.advice = []

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(structured),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
