import { useEffect, useRef, useState } from "react"
import { supabase } from "../supabase"

function PrescriptionEditor({ setPage, id }) {
  const [prescription, setPrescription] = useState(null)

  const [medicines, setMedicines] = useState([])
  const [advice, setAdvice] = useState([])

  const recognitionRef = useRef(null)
  const [listeningFor, setListeningFor] = useState(null)
  const [replaceIndex, setReplaceIndex] = useState(null)

  useEffect(() => {
    loadPrescription()
  }, [])

  async function loadPrescription() {
    const { data } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("id", id)
      .single()

    setPrescription(data)
    setMedicines(data.medicines || [])
    setAdvice(data.advice || [])
  }

  function startListening(mode, index = null) {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported")
      return
    }

    const recognition = new window.webkitSpeechRecognition()
    recognition.lang = "en-IN"
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript.trim()

      if (mode === "medicine") {
        if (index === null) {
          setMedicines((prev) => [...prev, text])
        } else {
          setMedicines((prev) =>
            prev.map((m, i) => (i === index ? text : m))
          )
        }
      }

      if (mode === "advice") {
        if (index === null) {
          setAdvice((prev) => [...prev, text])
        } else {
          setAdvice((prev) =>
            prev.map((a, i) => (i === index ? text : a))
          )
        }
      }

      setListeningFor(null)
      setReplaceIndex(null)
    }

    recognition.onerror = () => {
      setListeningFor(null)
      setReplaceIndex(null)
    }

    recognition.start()
    recognitionRef.current = recognition
    setListeningFor(mode)
    setReplaceIndex(index)
  }

  async function savePrescription() {
    await supabase
      .from("prescriptions")
      .update({
        medicines,
        advice,
      })
      .eq("id", id)

    alert("Prescription saved")
  }

  if (!prescription) return null

  return (
    <div style={{ padding: 20 }}>
      <h2>Prescription Editor</h2>

      {/* MEDICINES */}
      <section style={{ marginBottom: 30 }}>
        <h3>Medicines</h3>

        <ol>
          {medicines.map((m, i) => (
            <li key={i} style={{ marginBottom: 10 }}>
              {m}
              <br />
              <button
                onClick={() => startListening("medicine", i)}
                style={{ marginTop: 5 }}
              >
                Delete & Replace (Voice)
              </button>
            </li>
          ))}
        </ol>

        <button onClick={() => startListening("medicine")}>
          ➕ Add Next Medicine (Voice)
        </button>
      </section>

      {/* ADVICE */}
      <section style={{ marginBottom: 30 }}>
        <h3>Advice</h3>

        <ul>
          {advice.map((a, i) => (
            <li key={i} style={{ marginBottom: 10 }}>
              {a}
              <br />
              <button
                onClick={() => startListening("advice", i)}
                style={{ marginTop: 5 }}
              >
                Delete & Replace (Voice)
              </button>
            </li>
          ))}
        </ul>

        <button onClick={() => startListening("advice")}>
          ➕ Add Next Advice (Voice)
        </button>
      </section>

      {/* STATUS */}
      {listeningFor && (
        <div style={{ color: "green", marginBottom: 20 }}>
          🎙 Listening for {listeningFor}...
        </div>
      )}

      {/* ACTIONS */}
      <button onClick={savePrescription}>Save</button>{" "}
      <button onClick={() => setPage({ name: "prescription_print", id })}>
        Preview & Print
      </button>{" "}
      <button onClick={() => setPage({ name: "prescription_list" })}>
        Back
      </button>
    </div>
  )
}

export default PrescriptionEditor
