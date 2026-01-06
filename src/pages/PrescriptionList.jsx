import { useEffect, useState } from "react"
import { supabase } from "../supabase"

export default function PrescriptionList({ setPage }) {
  const [list, setList] = useState([])

  useEffect(() => {
    loadPrescriptions()
  }, [])

  async function loadPrescriptions() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data } = await supabase
      .from("prescriptions")
      .select("id, patient_name, created_at")
      .eq("doctor_id", user.id)
      .order("created_at", { ascending: false })

    setList(data || [])
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>My Prescriptions</h2>

      {list.map(p => (
        <div key={p.id} style={{ marginBottom: 10 }}>
          <b>{p.patient_name}</b>
          <br />
          <button
            onClick={() =>
              setPage({ name: "prescription", id: p.id })
            }
          >
            Edit
          </button>
        </div>
      ))}

      <br />
      <button onClick={() => setPage({ name: "dashboard" })}>
  Back
</button>
<button
  onClick={() =>
    setPage({ name: "prescription_print", id: p.id })
  }
>
  Print
</button>


    </div>
  )
}
