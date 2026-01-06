export async function handler(event) {
  try {
    const body = JSON.parse(event.body || "{}")
    const text = body.text

    if (!text || text.trim().length < 5) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No valid text provided" }),
      }
    }

    const prompt = `
You are a medical prescription structuring engine.

Your ONLY job is to convert doctor's spoken text into STRUCTURED JSON.

ABSOLUTE RULES (NO EXCEPTIONS):
- EVERY medicine mentioned MUST be a SEPARATE object
- NEVER merge two medicines into one
- EVEN IF medicines are spoken in ONE sentence, SPLIT them
- Advice MUST be split into individual points
- If a value is missing, return empty string ""
- Output MUST be VALID JSON ONLY
- NO markdown
- NO explanations
- NO extra text

IMPORTANT:
If doctor speech contains:
"tablet A ..., tablet B ..., syrup C ..."

Then medicines array MUST have 3 objects.

EXAMPLE (YOU MUST FOLLOW THIS BEHAVIOR):

Doctor speech:
"Paracetamol 650 mg twice daily for 3 days, cough syrup three times a day, multivitamin once daily"

Correct output:
{
  "medicines": [
    {
      "name": "Paracetamol",
      "dose": "650 mg",
      "frequency": "Twice daily",
      "timing": "",
      "duration": "3 days"
    },
    {
      "name": "Cough syrup",
      "dose": "",
      "frequency": "Three times a day",
      "timing": "",
      "duration": ""
    },
    {
      "name": "Multivitamin",
      "dose": "",
      "frequency": "Once daily",
      "timing": "",
      "duration": ""
    }
  ],
  "advice": []
}

JSON SCHEMA (STRICT – FOLLOW EXACTLY):
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

Doctor speech:
${text}
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

    // HARD VALIDATION (last safety net)
    if (!Array.isArray(structured.medicines)) {
      return {
        statusCode: 422,
        body: JSON.stringify({
          error: "Medicines is not an array",
          raw_output: structured,
        }),
      }
    }

    if (!Array.isArray(structured.advice)) {
      structured.advice = []
    }

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
