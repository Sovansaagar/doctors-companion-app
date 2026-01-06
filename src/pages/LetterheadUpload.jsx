import { useState } from "react"
import { supabase } from "../supabase"

export default function LetterheadUpload({ setPage }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleUpload() {
    if (!file) {
      alert("Please select a file first")
      return
    }

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const fileExt = file.name.split(".").pop()
    const fileName = `letterhead_${user.id}.${fileExt}`

    const { error } = await supabase.storage
      .from("letterheads")
      .upload(fileName, file, { upsert: true })

    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      alert("Letterhead uploaded successfully")
      setPage({ name: "dashboard" })
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Upload Letterhead</h2>

      <input
        type="file"
        accept=".png,.jpg,.jpeg,.pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <br /><br />

      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload"}
      </button>

      <br /><br />

      <button onClick={() => setPage({ name: "dashboard" })}>
        Back
      </button>
    </div>
  )
}
