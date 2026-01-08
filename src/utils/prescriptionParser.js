export function splitPrescription(rawText = "") {
  const text = rawText.toLowerCase()

  let medicinesText = text
  let adviceText = ""

  // 🔹 Separate advice if keyword exists
  if (text.includes("advice")) {
    const parts = text.split("advice")
    medicinesText = parts[0]
    adviceText = parts[1]
  }

  // 🔹 Split medicines using commas and keywords
  const medicineChunks = medicinesText
    .split(/,|\band\b/gi)
    .map(t => t.trim())
    .filter(t =>
      /(mg|ml|tablet|capsule|tab|syrup|drops|once|twice|thrice|daily)/i.test(t)
    )

  // 🔹 Split advice
  const adviceChunks = adviceText
    .split(/,|\band\b/gi)
    .map(t => t.trim())
    .filter(t => t.length > 2)

  return {
    medicines: medicineChunks,
    advice: adviceChunks,
  }
}
