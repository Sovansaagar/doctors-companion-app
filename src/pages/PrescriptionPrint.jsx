import { useEffect, useState } from "react"
import { supabase } from "../supabase"

// IMPORT ALL STYLES
import "../styles/print-classic.css"
import "../styles/print-modern.css"
import "../styles/print-minimal.css"
import "../styles/print-dense.css"

function PrescriptionPrint({ setPage, id }) {
  const [prescription, setPrescription] = useState(null)
  const [letterheadUrl, setLetterheadUrl] = useState(null)

  const [style, setStyle] = useState("classic")
  const [editMode, setEditMode] = useState("preview") // preview | ai | manual
  const [aiDraft, setAiDraft] = useState(null)

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

    const { data: { user } } = await supabase.auth.getUser()
    const path = `letterhead_${user.id}.jpg`

    const { data } = supabase
      .storage
      .from("letterheads")
      .getPublicUrl(path)

    setLetterheadUrl(data.publicUrl)
  }

  function handlePrint() {
    window.print()
  }

  // 🔹 FAKE AI FORMATTER (STEP 2.8)
  function formatWithFakeAI(pres) {
    return {
      ...pres,

      history: pres.history
        ? pres.history.replace(/\./g, ".\n")
        : "",

      diagnosis: pres.diagnosis
        ? pres.diagnosis.replace(/\./g, ".\n")
        : "",

      medicines: pres.medicines
        ? pres.medicines
            .split(/,| and /i)
            .map((m, i) => `${i + 1}. ${m.trim()}`)
            .join("\n")
        : "",

      advice: pres.advice
        ? pres.advice
            .split(/,| and /i)
            .map(a => `• ${a.trim()}`)
            .join("\n")
        : "",
    }
  }

  if (!prescription) return null

  const displayData =
    editMode === "ai" && aiDraft ? aiDraft : prescription

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
          <div><strong>Patient:</strong> {displayData.patient_name}</div>
          <div><strong>Age:</strong> {displayData.age}</div>
          <div><strong>Gender:</strong> {displayData.gender}</div>
          <div>
            <strong>Date:</strong>{" "}
            {new Date(displayData.visit_date).toLocaleDateString()}
          </div>
        </div>

        {/* CLINICAL BODY */}
        <div className="clinical-grid">
          <div className="left">
            <h4>History</h4>
            <pre>{displayData.history}</pre>

            <h4>Vitals</h4>
            <pre>{displayData.vitals}</pre>

            <h4>Diagnosis</h4>
            <pre>{displayData.diagnosis}</pre>
          </div>

          <div className="divider"></div>

          <div className="right">
            <h4>Medicines</h4>
            <pre>{displayData.medicines}</pre>

            <h4 className="advice">Advice</h4>
            <pre>{displayData.advice}</pre>
          </div>
        </div>

        <div className="signature">
          Doctor Signature<br />
          ____________________
        </div>
      </div>

      {/* CONTROLS */}
      <div className="no-print">

        {/* STYLE SWITCHER */}
        <div style={{ marginBottom: 10 }}>
          <button onClick={() => setStyle("classic")}>Classic</button>{" "}
          <button onClick={() => setStyle("modern")}>Modern</button>{" "}
          <button onClick={() => setStyle("minimal")}>Minimal</button>{" "}
          <button onClick={() => setStyle("dense")}>Dense</button>
        </div>

        {/* EDIT FLOW */}
        <div style={{ marginBottom: 10 }}>
          <button
            onClick={() => {
              const formatted = formatWithFakeAI(prescription)
              setAiDraft(formatted)
              setEditMode("ai")
            }}
          >
            EDIT WITH AI
          </button>{" "}

          <button onClick={() => setEditMode("manual")}>
            MANUAL EDIT
          </button>
        </div>

        <button onClick={handlePrint}>Print</button>

        <button onClick={() => setPage({ name: "prescription_list" })}>
          Back
        </button>
      </div>
    </>
  )
}

export default PrescriptionPrint
