import { useState, useEffect } from "react"
import { supabase } from "../supabase"

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition

export default function Prescription({ setPage, id }) {
  const [form, setForm] = useState({
    patient_name: "",
    age: "",
    gender: "",
    history: "",
    vitals: "",
    diagnosis: "",
    medicines: "",
    advice: "",
  })

  const [loading, setLoading] = useState(false)
  const [savedId, setSavedId] = useState(null)

  // 🎤 VOICE CONTROL STATES
  const [activeMic, setActiveMic] = useState(null)
  const [recognitionInstance, setRecognitionInstance] = useState(null)

  useEffect(() => {
    if (id) loadPrescription()
  }, [id])

  async function loadPrescription() {
    const { data } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("id", id)
      .single()

    if (data) {
      setForm({
        patient_name: data.patient_name || "",
        age: data.age || "",
        gender: data.gender || "",
        history: data.history || "",
        vitals: data.vitals || "",
        diagnosis: data.diagnosis || "",
        medicines: data.medicines || "",
        advice: data.advice || "",
      })
      setSavedId(data.id)
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // 🎤 START LISTENING (CONTINUOUS)
  function startListening(field) {
    if (!SpeechRecognition) {
      alert("Speech recognition not supported")
      return
    }

    if (recognitionInstance) {
      recognitionInstance.stop()
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "en-IN"
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onresult = (event) => {
      let transcript =
        event.results[event.results.length - 1][0].transcript.trim()

      // AGE CLEANUP
      if (field === "age") {
        const match = transcript.match(/\d+/)
        transcript = match ? match[0] : ""
      }

      // GENDER NORMALIZATION
      if (field === "gender") {
        const t = transcript.toLowerCase()
        if (t.includes("male")) transcript = "Male"
        else if (t.includes("female")) transcript = "Female"
        else transcript = "Other"
      }

      setForm((prev) => ({
        ...prev,
        [field]: prev[field]
          ? prev[field] + " " + transcript
          : transcript,
      }))
    }

    recognition.onerror = () => stopListening()
    recognition.start()

    setRecognitionInstance(recognition)
    setActiveMic(field)
  }

  // 💾 STOP LISTENING
  function stopListening() {
    if (recognitionInstance) {
      recognitionInstance.stop()
      setRecognitionInstance(null)
    }
    setActiveMic(null)
  }

  async function savePrescription() {
    if (activeMic) {
      alert("Please save the recording before saving prescription")
      return
    }

    setLoading(true)

    if (!form.patient_name || !form.age || !form.gender) {
      alert("Patient name, age and gender are required")
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    let result

    if (id) {
      result = await supabase
        .from("prescriptions")
        .update(form)
        .eq("id", id)
        .select()
        .single()
    } else {
      result = await supabase
        .from("prescriptions")
        .insert([
          {
            doctor_id: user.id,
            ...form,
            visit_date: new Date(),
          },
        ])
        .select()
        .single()
    }

    if (result.error) {
      alert("Save failed: " + result.error.message)
      setLoading(false)
      return
    }

    setSavedId(result.data.id)
    setLoading(false)
    alert("Prescription saved")
  }

  // 🔁 REUSABLE FIELD UI
  function VoiceField({ label, name, type = "text", textarea }) {
    return (
      <>
        {textarea ? (
          <textarea
            name={name}
            placeholder={label}
            value={form[name]}
            onChange={handleChange}
          />
        ) : (
          <input
            type={type}
            name={name}
            placeholder={label}
            value={form[name]}
            onChange={handleChange}
          />
        )}
        <br />
        {activeMic === name ? (
          <button onClick={stopListening}>💾 Save Recording</button>
        ) : (
          <button onClick={() => startListening(name)}>
            🎤 Speak {label}
          </button>
        )}
        <br /><br />
      </>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>{id ? "Edit Prescription" : "Create Prescription"}</h2>

      <VoiceField label="Patient Name" name="patient_name" />
      <VoiceField label="Age" name="age" type="number" />
      <VoiceField label="Gender" name="gender" />
      <VoiceField label="History" name="history" textarea />
      <VoiceField label="Vitals" name="vitals" textarea />
      <VoiceField label="Diagnosis" name="diagnosis" textarea />
      <VoiceField label="Medicines" name="medicines" textarea />
      <VoiceField label="Advice" name="advice" textarea />

      <button onClick={savePrescription} disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </button>

      <br /><br />

      <button
        disabled={!savedId}
        onClick={() =>
          setPage({ name: "prescription_print", id: savedId })
        }
      >
        Print Prescription
      </button>

      <br /><br />

      <button onClick={() => setPage({ name: "prescription_list" })}>
        Back
      </button>
    </div>
  )
}
