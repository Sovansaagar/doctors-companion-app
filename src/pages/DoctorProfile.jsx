import { useEffect, useState } from "react"
import { supabase } from "../supabase"

function DoctorProfile({ setPage }) {
  const [clinicName, setClinicName] = useState("")
  const [language, setLanguage] = useState("en")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data } = await supabase
      .from("doctors")
      .select("clinic_name, default_language")
      .eq("id", user.id)
      .single()

    if (data) {
      setClinicName(data.clinic_name || "")
      setLanguage(data.default_language || "en")
    }
  }

  async function saveProfile() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase
      .from("doctors")
      .update({
        clinic_name: clinicName,
        default_language: language,
      })
      .eq("id", user.id)

    setLoading(false)
    alert("Profile saved")
    setPage({ name: "dashboard" })
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Doctor Profile</h2>

      <label>Clinic Name (optional)</label><br />
      <input
        value={clinicName}
        onChange={(e) => setClinicName(e.target.value)}
        placeholder="Clinic / Hospital Name"
      />
      <br /><br />

      <label>Default Language</label><br />
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="en">English</option>
        <option value="hi">Hindi</option>
      </select>

      <br /><br />

      <button onClick={saveProfile} disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </button>

      <br /><br />

      <button onClick={() => setPage({ name: "dashboard" })}>
        Back
      </button>
    </div>
  )
}

export default DoctorProfile
