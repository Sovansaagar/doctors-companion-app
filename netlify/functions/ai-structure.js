export async function handler(event) {
  try {
    const { text } = JSON.parse(event.body)

    const prompt = `
You are a medical data structuring engine.

Your task:
Convert the doctor's text into STRICT VALID JSON.

ABSOLUTE RULES:
- Output ONLY JSON
- No explanations
- No comments
- No markdown
- No extra text
- No diagnostic messages

JSON FORMAT (must match exactly):

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
        }),
      }
    )

    const data = await response.json()

    let outputText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || ""

    // 🔴 HARD JSON EXTRACTION (CRITICAL)
    const jsonStart = outputText.indexOf("{")
    const jsonEnd = outputText.lastIndexOf("}")

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("AI did not return JSON")
    }

    const jsonString = outputText.slice(jsonStart, jsonEnd + 1)
    const parsed = JSON.parse(jsonString)

    return {
      statusCode: 200,
      body: JSON.stringify(parsed),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message,
      }),
    }
  }
}
