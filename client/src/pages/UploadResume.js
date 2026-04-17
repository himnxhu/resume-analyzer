import axios from "axios";
import { useState } from "react";

function UploadResume() {

  const [file,setFile] = useState(null)
  const [result,setResult] = useState("")
  const [error,setError] = useState("")
  const [loading,setLoading] = useState(false)

  const handleUpload = async () => {
    if (!file) {
      setError("Please choose a PDF resume first.")
      setResult("")
      return
    }

    try {
      setLoading(true)
      setError("")
      setResult("")

      const formData = new FormData()
      formData.append("resume", file)

      const res = await axios.post(
        "http://localhost:5000/upload",
        formData
      )

      setResult(res.data.analysis)
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Upload failed.")
    } finally {
      setLoading(false)
    }
  }

  return (

    <div style={{padding:"40px"}}>

      <h1>AI Resume Analyzer</h1>

      <input
        type="file"
        onChange={(e)=>setFile(e.target.files[0])}
      />

      <br/><br/>

      <button onClick={handleUpload}>
        {loading ? "Analyzing..." : "Analyze Resume"}
      </button>

      <br/><br/>

      {error && <p style={{color:"crimson"}}>{error}</p>}

      <pre>{result}</pre>

    </div>

  )

}

export default UploadResume
