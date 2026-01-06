import { useEffect, useState } from "react"
import { supabase } from "./supabase"

import Signup from "./pages/Signup"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Prescription from "./pages/Prescription"
import PrescriptionList from "./pages/PrescriptionList"
import LetterheadUpload from "./pages/LetterheadUpload"
import PrescriptionPrint from "./pages/PrescriptionPrint"
import DoctorProfile from "./pages/DoctorProfile"

function App() {
  const [session, setSession] = useState(null)
  const [page, setPage] = useState({ name: "dashboard" })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 🔐 Not logged in
  if (!session) {
    return (
      <>
        <Signup />
        <Login />
      </>
    )
  }

  // 🧭 Logged-in routing
  switch (page.name) {
    case "dashboard":
      return <Dashboard setPage={setPage} />

    case "doctor_profile":
      return <DoctorProfile setPage={setPage} />

    case "prescription":
      return <Prescription setPage={setPage} id={page.id} />

    case "prescription_list":
      return <PrescriptionList setPage={setPage} />

    case "letterhead_upload":
      return <LetterheadUpload setPage={setPage} />

    case "prescription_print":
      return <PrescriptionPrint setPage={setPage} id={page.id} />

    default:
      return <Dashboard setPage={setPage} />
  }
}

export default App
