import { useEffect, useState } from "react"
import { supabase } from "../supabase"

export default function Dashboard({ setPage }) {
  const [doctor, setDoctor] = useState(null)

  useEffect(() => {
    fetchDoctor()
  }, [])

  async function fetchDoctor() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data } = await supabase
      .from("doctors")
      .select("full_name, designation")
      .eq("id", user.id)
      .single()

    setDoctor(data)
  }

  async function logout() {
    await supabase.auth.signOut()
    window.location.reload()
  }

  // helper to navigate pages with optional data
  const goToPage = (name, extra = {}) => setPage({ name, ...extra })

  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome Dr. {doctor?.full_name}</h2>
      <p>{doctor?.designation}</p>

      <br />

      <button onClick={() => goToPage("prescription")}>
        Create Prescription
      </button>

      <br /><br />

      <button onClick={() => goToPage("prescription_list")}>
        My Prescriptions
      </button>

      <br /><br />

      <button onClick={() => goToPage("letterhead_upload")}>
        Upload Letterhead
      </button>

      <br /><br />

      <button onClick={() => setPage({ name: "doctor_profile" })}>
  Profile / Settings
</button>

<br /><br />


      <button onClick={logout}>Logout</button>
    </div>
  )
}
