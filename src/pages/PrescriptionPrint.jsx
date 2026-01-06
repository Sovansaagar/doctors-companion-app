import { useEffect, useState } from "react"
import { supabase } from "../supabase"

// PRINT STYLES
import "../styles/print-classic.css"
import "../styles/print-modern.css"
import "../styles/print-minimal.css"
import "../styles/print-dense.css"

function PrescriptionPrint({ setPage, id }) {
  const [prescription, setPrescription] = useState(null)
  const [letterheadUrl, setLetterheadUrl] = useState(null)

  const [style, setStyle] = useState("classic")
  const [editMode, setEditMode] = useState("preview") // preview | ai
  const [aiDraft, setAiDraft] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: pres } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("id", id)
      .single()

    setPrescription(pres)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const path = `letterhead_${user.id}.jpg`

    const { data } = supabase
      .storage
      .from("letterheads")
      .getPublicUrl(path)

    setLetterheadUrl(data.publicUrl)
  }

  async function runAIEdit() {
    if (!prescription) return

    setAiLoading(true)

    const rawText = `
History: ${prescription.history || ""}

Vitals: ${prescription.vitals || ""}

Diagnosis: ${prescription.diagnosis || ""}

Medicines: ${prescription.medicines || ""}

Advice: ${prescription.advice || ""}
`

    const res = await fetch("/.netlify/functions/ai-structure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: rawText }),
    })

    const aiResponse = await res.json()

    // 🔴 IMPORTANT: normalize AI response shape
    const structured = aiResponse.structured
      ? aiResponse.structured
      : aiResponse

    await supabase
      .from("prescriptions")
      .update({
        ai_raw_text: rawText,
        ai_structured_json: structured,
      })
      .eq("id", prescription.id)

    setAiDraft(structured)
    setEditMode("ai")
    setAiLoading(false)
  }

  function handlePrint() {
    window.print()
  }

  if (!prescription) return null

  return (
    <>
      {/* PRINT PAGE */}
      <div className={`print-page ${style}`}>
        {letterheadUrl && (
          <img
            src={letterheadUrl}
            className="letterhead"
            alt="Letterhead"
          />
        )}

        <div className="letterhead-divider"></div>

        {/* PATIENT INFO */}
        <div className="patient-box">
          <div>
            <strong>Patient:</strong> {prescription.patient_name}
          </div>
          <div>
            <strong>Age:</strong> {prescription.age}
          </div>
          <div>
            <strong>Gender:</strong> {prescription.gender}
          </div>
          <div>
            <strong>Date:</strong>{" "}
            {new Date(prescription.visit_date).toLocaleDateString()}
          </div>
        </div>

        {/* CLINICAL BODY */}
        <div className="clinical-grid">
          <div className="left">
            <h4>History</h4>
            <pre>{prescription.history}</pre>

            <h4>Vitals</h4>
            <pre>{prescription.vitals}</pre>

            <h4>Diagnosis</h4>
            <pre>{prescription.diagnosis}</pre>
          </div>

          <div className="divider"></div>

          <div className="right">
            <h4>Medicines</h4>

            {editMode === "ai" && aiDraft?.medicines ? (
              <ol>
                {aiDraft.medicines.map((m, i) => (
                  <li key={i}>
                    {m.name}
                    {m.dose && ` ${m.dose}`}
                    {m.frequency && ` — ${m.frequency}`}
                    {m.timing && ` (${m.timing})`}
                    {m.duration && ` for ${m.duration}`}
                  </li>
                ))}
              </ol>
            ) : (
              <pre>{prescription.medicines}</pre>
            )}

            <h4 className="advice">Advice</h4>

            {editMode === "ai" && aiDraft?.advice ? (
              <ul>
                {aiDraft.advice.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            ) : (
              <pre>{prescription.advice}</pre>
            )}
          </div>
        </div>

        <div className="signature">
          Doctor Signature
          <br />
          ____________________
        </div>
      </div>

      {/* CONTROLS */}
      <div className="no-print">
        <div style={{ marginBottom: 10 }}>
          <button onClick={() => setStyle("classic")}>Classic</button>{" "}
          <button onClick={() => setStyle("modern")}>Modern</button>{" "}
          <button onClick={() => setStyle("minimal")}>Minimal</button>{" "}
          <button onClick={() => setStyle("dense")}>Dense</button>
        </div>

        <div style={{ marginBottom: 10 }}>
          <button onClick={runAIEdit} disabled={aiLoading}>
            {aiLoading ? "AI is structuring..." : "EDIT WITH AI"}
          </button>
        </div>

        <button onClick={handlePrint} disabled={!aiDraft}>
          Print
        </button>

        <button onClick={() => setPage({ name: "prescription_list" })}>
          Back
        </button>

        {editMode === "ai" && (
          <div style={{ color: "green", marginTop: 10 }}>
            AI structured prescription – please review before printing
          </div>
        )}

        {/* 🔴 FINAL DIAGNOSTIC BLOCK – DO NOT REMOVE YET */}
        {editMode === "ai" && aiDraft && (
          <pre
            style={{
              marginTop: 20,
              padding: 10,
              background: "#111",
              color: "#0f0",
              fontSize: 12,
              maxHeight: 300,
              overflow: "auto",
            }}
          >
            {JSON.stringify(aiDraft, null, 2)}
          </pre>
        )}
      </div>
    </>
  )
}

export default PrescriptionPrint
