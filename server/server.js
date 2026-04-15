import express from "express"
import cors from "cors"
import dotenv from "dotenv"

import resumeRoutes from "./routes/resume.js"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.use("/", resumeRoutes)

app.get("/", (req,res)=>{
    res.send("Resume Analyzer API running")
})

app.listen(5000,()=>{
    console.log("Server running on port 5000")
})