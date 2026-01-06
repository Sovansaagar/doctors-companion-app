export async function handler(event) {
  try {
    const { text } = JSON.parse(event.body || "{}")

    if (!text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No text provided" }),
      }
    }

    const prompt = `
You are a medical assistant.

Your job is to convert doctor's free speech into STRICT JSON.

Rules (must follow):
- Output MUST be valid JSON
- Do NOT use markdown
- Do NOT add explanations
- Medicines MUST be an array
- Each medicine MUST be a separate object
- Advice MUST be an array
- If a field is unknown, return empty string

Format:
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
        statusCode: 400,
        body: JSON.stringify({
          error: "AI returned invalid JSON",
          raw,
        }),
      }
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
