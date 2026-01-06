import { useState } from "react"
import { supabase } from "../supabase"

export default function Signup() {
  const [fullName, setFullName] = useState("")
  const [designation, setDesignation] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSignup = async (e) => {
    e.preventDefault()

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      alert(error.message)
      return
    }

    const user = data.user

    const { error: profileError } = await supabase
      .from("doctors")
      .insert({
        id: user.id,
        full_name: fullName,
        designation,
        email
      })

    if (profileError) {
      console.error(profileError)
      alert(profileError.message)
      return
    }

    alert("Doctor profile created successfully")
  }

  return (
    <form onSubmit={handleSignup}>
      <input placeholder="Full Name" onChange={e => setFullName(e.target.value)} />
      <input placeholder="Designation" onChange={e => setDesignation(e.target.value)} />
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
      <button type="submit">Signup</button>
    </form>
  )
}
