import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

async function analyzeResume(resumeText){

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash"
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