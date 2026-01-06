export async function handler(event) {
  try {
    const { text } = JSON.parse(event.body)

    const prompt = `
You are a medical assistant.

Convert the following doctor's speech into STRICT JSON.

Rules:
- Medicines must be an ARRAY
- Each medicine must be separate
- Advice must be an ARRAY
- Do NOT merge medicines
- Do NOT write explanations
- Output JSON ONLY

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
    const output = data.candidates[0].content.parts[0].text

    return {
      statusCode: 200,
      body: output,
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
