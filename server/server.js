import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

import resumeRoutes from "./routes/resume.js"

dotenv.config()

const app = express()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientBuildPath = path.join(__dirname, "../client/build")
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.use("/", resumeRoutes)
app.use(express.static(clientBuildPath))

app.get("/api/health", (req,res)=>{
    res.send("Resume Analyzer API running")
})

app.use((req, res, next) => {
    if (req.method !== "GET") {
        return next()
    }

    res.sendFile(path.join(clientBuildPath, "index.html"), (err) => {
        if (err) {
            res.status(200).send("Resume Analyzer API running")
        }
    })
})

app.listen(port,()=>{
    console.log(`Server running on port ${port}`)
})
