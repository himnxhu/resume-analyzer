import { GoogleGenerativeAI } from "@google/generative-ai"

async function analyzeResume(resumeText){
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set. Set it before starting the server.")
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

    const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash"
    })

    const prompt = `
Analyze this resume and give:

1. ATS score out of 100
2. Missing skills
3. Resume improvement suggestions

Resume:
${resumeText}
`

    const result = await model.generateContent(prompt)

    return result.response.text()
}

export default analyzeResume
