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

  /* ============================
     RULE-BASED SAFE SPLITTERS
     ============================ */

  function splitMedicines(text = "") {
    if (!text.trim()) return []

    // Normalize
    let cleaned = text
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    // Strong medicine boundary words
    const separators = [
      ",",
      " then ",
      " followed by ",
      " after that ",
      " next ",
      " and then "
    ]

    separators.forEach(sep => {
      cleaned = cleaned.split(sep).join("|")
    })

    return cleaned
      .split("|")
      .map(m => m.trim())
      .filter(m => m.length > 2)
  }

  function splitAdvice(text = "") {
    if (!text.trim()) return []

    let cleaned = text
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    const separators = [
      ",",
      " and ",
      " also ",
      " plus ",
      " with "
    ]

    separators.forEach(sep => {
      cleaned = cleaned.split(sep).join("|")
    })

    return cleaned
      .split("|")
      .map(a => a.trim())
      .filter(a => a.length > 2)
  }

  if (!prescription) return null

  const medicines = splitMedicines(prescription.medicines)
  const advice = splitAdvice(prescription.advice)

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
          <div><strong>Patient:</strong> {prescription.patient_name}</div>
          <div><strong>Age:</strong> {prescription.age}</div>
          <div><strong>Gender:</strong> {prescription.gender}</div>
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
            {medicines.length > 0 ? (
              <ol>
                {medicines.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ol>
            ) : (
              <pre>{prescription.medicines}</pre>
            )}

            <h4 className="advice">Advice</h4>
            {advice.length > 0 ? (
              <ul>
                {advice.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            ) : (
              <pre>{prescription.advice}</pre>
            )}
          </div>
        </div>

        <div className="signature">
          Doctor Signature<br />
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

        <button onClick={handlePrint}>Print</button>

        <button onClick={() => setPage({ name: "prescription_list" })}>
          Back
        </button>
      </div>
    </>
  )
}

export default PrescriptionPrint
