export async function handler(event) {
  try {
    const { text } = JSON.parse(event.body || "{}")

    if (!text || text.trim().length < 10) {
      return {
        statusCode: 200,
        body: JSON.stringify({ medicines: [], advice: [] }),
      }
    }

    const prompt = `
You are a medical prescription parser used in a real clinic.

Your task is to convert messy doctor dictation into STRUCTURED JSON.

CRITICAL RULES (DO NOT BREAK):
- Output JSON ONLY (no markdown, no explanation, no extra text)
- Medicines must be an ARRAY
- Advice must be an ARRAY
- NEVER merge multiple medicines into one
- If a NEW medicine name appears, create a NEW object
- Doctors may repeat medicines — REMOVE duplicates
- If any field is missing, return empty string ""

HOW TO IDENTIFY MEDICINES:
- A medicine usually starts with a drug name (Metformin, Paracetamol, Multivitamin, Tryptomer, Sleep tablet, etc.)
- When the drug name changes → NEW medicine object
- Ignore repeated sentences for the same drug

HOW TO EXTRACT FIELDS:
- dose: look for mg, ml, tablet, capsule, drops
- frequency: once daily, twice daily, thrice daily, daily
- timing: before food, after food, bedtime, morning, night
- duration: for X days / weeks / months

ADVICE RULES:
- Advice are lifestyle instructions or tests
- Examples: walking, diet, blood tests, exercise
- Each advice must be ONE clean sentence
- Remove duplicates

RETURN THIS EXACT JSON STRUCTURE:
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
"Metformin 500 mg twice daily after meals for 7 days, sleep tablet once at night, multivitamin daily, morning walk, diabetic diet"

EXAMPLE OUTPUT:
{
  "medicines": [
    {
      "name": "Metformin",
      "dose": "500 mg",
      "frequency": "Twice daily",
      "timing": "After meals",
      "duration": "7 days"
    },
    {
      "name": "Sleep tablet",
      "dose": "",
      "frequency": "Once daily",
      "timing": "At night",
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
  "advice": [
    "Morning walk",
    "Follow diabetic diet"
  ]
}

NOW PARSE THIS TEXT CAREFULLY:
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

    const rawOutput =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || ""

    // STRICT JSON SAFETY
    let parsed
    try {
      parsed = JSON.parse(rawOutput)
    } catch {
      return {
        statusCode: 200,
        body: JSON.stringify({
          medicines: [],
          advice: [],
          error: "AI did not return valid JSON",
        }),
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify(parsed),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
