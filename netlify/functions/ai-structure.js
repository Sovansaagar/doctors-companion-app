export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}")

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        MESSAGE: "DIAGNOSTIC MODE",
        RECEIVED_TEXT: body.text,
        TEXT_TYPE: typeof body.text,
        TEXT_LENGTH: body.text ? body.text.length : 0,
        RAW_EVENT_BODY: event.body,
      }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
