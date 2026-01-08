import { useState } from "react"

/*
  NOTE:
  - This component assumes you ALREADY have voice-to-text working.
  - Replace `startVoiceListening()` with your existing mic logic.
*/

function PrescriptionEditor() {
  // ===== DATA STATE =====
  const [medicines, setMedicines] = useState([])
  const [advice, setAdvice] = useState([])

  const [currentMedicineText, setCurrentMedicineText] = useState("")
  const [currentAdviceText, setCurrentAdviceText] = useState("")

  // { type: "medicine" | "advice", id: string }
  const [replaceTarget, setReplaceTarget] = useState(null)

  const [activeInput, setActiveInput] = useState(null) 
  // "medicine" | "advice"

  // ===== VOICE HANDLER (CORE LOGIC) =====
  function onVoiceResult(transcript) {
    if (!transcript) return

    // 🔁 REPLACE MODE
    if (replaceTarget) {
      if (replaceTarget.type === "medicine") {
        setMedicines(prev =>
          prev.map(m =>
            m.id === replaceTarget.id
              ? { ...m, text: transcript }
              : m
          )
        )
      }

      if (replaceTarget.type === "advice") {
        setAdvice(prev =>
          prev.map(a =>
            a.id === replaceTarget.id
              ? { ...a, text: transcript }
              : a
          )
        )
      }

      setReplaceTarget(null)
      setActiveInput(null)
      return
    }

    // ➕ ADD MODE
    if (activeInput === "medicine") {
      setCurrentMedicineText(transcript)
    }

    if (activeInput === "advice") {
      setCurrentAdviceText(transcript)
    }
  }

  // ===== MIC STARTERS =====
  function startMedicineMic() {
    setActiveInput("medicine")
    startVoiceListening(onVoiceResult)
  }

  function startAdviceMic() {
    setActiveInput("advice")
    startVoiceListening(onVoiceResult)
  }

  function startReplaceMic(type, id) {
    setReplaceTarget({ type, id })
    startVoiceListening(onVoiceResult)
  }

  // ===== ADD BUTTONS =====
  function addNextMedicine() {
    if (!currentMedicineText.trim()) return

    setMedicines(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text: currentMedicineText,
      },
    ])

    setCurrentMedicineText("")
  }

  function addNextAdvice() {
    if (!currentAdviceText.trim()) return

    setAdvice(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text: currentAdviceText,
      },
    ])

    setCurrentAdviceText("")
  }

  return (
    <div style={{ padding: 16, maxWidth: 600, margin: "auto" }}>
      <h2>Prescription</h2>

      {/* ===== MEDICINES ===== */}
      <h3>Medicines</h3>

      {medicines.map((m, index) => (
        <div
          key={m.id}
          style={{
            border: "1px solid #ddd",
            padding: 8,
            marginBottom: 8,
          }}
        >
          <strong>{index + 1}.</strong> {m.text}
          <br />
          <button
            onClick={() => startReplaceMic("medicine", m.id)}
            style={{ marginTop: 4 }}
          >
            🎤 Replace
          </button>
        </div>
      ))}

      <textarea
        placeholder="Speak one medicine…"
        value={currentMedicineText}
        readOnly
        style={{ width: "100%", marginTop: 8 }}
      />

      <div style={{ marginTop: 6 }}>
        <button onClick={startMedicineMic}>🎤 Mic</button>{" "}
        <button onClick={addNextMedicine}>
          ➕ Add Next Medicine
        </button>
      </div>

      {/* ===== ADVICE ===== */}
      <h3 style={{ marginTop: 24 }}>Advice</h3>

      {advice.map((a, index) => (
        <div
          key={a.id}
          style={{
            border: "1px solid #ddd",
            padding: 8,
            marginBottom: 8,
          }}
        >
          • {a.text}
          <br />
          <button
            onClick={() => startReplaceMic("advice", a.id)}
            style={{ marginTop: 4 }}
          >
            🎤 Replace
          </button>
        </div>
      ))}

      <textarea
        placeholder="Speak one advice…"
        value={currentAdviceText}
        readOnly
        style={{ width: "100%", marginTop: 8 }}
      />

      <div style={{ marginTop: 6 }}>
        <button onClick={startAdviceMic}>🎤 Mic</button>{" "}
        <button onClick={addNextAdvice}>
          ➕ Add Next Advice
        </button>
      </div>

      {/* ===== REPLACE INDICATOR ===== */}
      {replaceTarget && (
        <div style={{ marginTop: 16, color: "red" }}>
          🎤 Listening for replacement…
        </div>
      )}
    </div>
  )
}

export default PrescriptionEditor

/*
================================================
PLACEHOLDER — CONNECT YOUR EXISTING MIC LOGIC
================================================

Replace this with your current voice input code.
Example using Web Speech API:

function startVoiceListening(onResult) {
  const recognition = new window.SpeechRecognition()
  recognition.lang = "en-IN"
  recognition.onresult = e => {
    const transcript = e.results[0][0].transcript
    onResult(transcript)
  }
  recognition.start()
}

*/
