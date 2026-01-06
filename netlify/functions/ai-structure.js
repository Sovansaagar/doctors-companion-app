export const handler = async (event) => {
  try {
    // 🔴 TEMP PROOF — confirms correct deployment
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "OK",
        message: "AI FUNCTION LIVE – ESM FIX APPLIED",
        timestamp: new Date().toISOString(),
      }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
