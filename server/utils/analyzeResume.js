import { GoogleGenerativeAI } from "@google/generative-ai"

const DEFAULT_MODEL = "gemini-2.5-flash"
const DEFAULT_FALLBACK_MODELS = ["gemini-2.5-flash-lite"]
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504])

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function getModelNames() {
    const configuredModel = process.env.GEMINI_MODEL || DEFAULT_MODEL
    const fallbackModels = (process.env.GEMINI_FALLBACK_MODELS || DEFAULT_FALLBACK_MODELS.join(","))
        .split(",")
        .map((model) => model.trim())
        .filter(Boolean)

    return [...new Set([configuredModel, ...fallbackModels])]
}

function getErrorStatus(error) {
    return error?.status || error?.statusCode || error?.response?.status
}

function isRetryableError(error) {
    const status = getErrorStatus(error)
    const message = String(error?.message || "").toLowerCase()

    return RETRYABLE_STATUS_CODES.has(status) ||
        message.includes("service unavailable") ||
        message.includes("high demand") ||
        message.includes("overloaded") ||
        message.includes("rate limit")
}

function createUserFacingError(error) {
    const status = getErrorStatus(error)

    if (status === 429) {
        const quotaError = new Error("The Gemini API rate limit or quota was reached. Check your API key quota/billing in Google AI Studio, then try again.")
        quotaError.status = 429
        return quotaError
    }

    if (isRetryableError(error)) {
        const friendlyError = new Error("The AI service is temporarily busy. Please try again in a minute.")
        friendlyError.status = status || 503
        return friendlyError
    }

    return error
}

async function analyzeResume(resumeText){
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set. Set it before starting the server.")
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

    const prompt = `
Analyze this resume for ATS readiness and return only valid JSON. Do not include markdown, code fences, or extra text.

Use this exact shape:
{
  "atsScore": 0,
  "keywordMatch": 0,
  "skillsFound": [],
  "missingKeywords": [],
  "suggestions": [],
  "summary": []
}

Rules:
- atsScore must be a number from 0 to 100.
- keywordMatch must be a number from 0 to 100.
- skillsFound must include skills, tools, technologies, and role-relevant keywords found in the resume.
- missingKeywords must include important missing skills or ATS keywords for the resume profile.
- suggestions must include practical improvements based on this exact resume.
- summary must include 3 to 5 short detailed insights.

Resume:
${resumeText}
`

    const modelNames = getModelNames()
    let lastError

    for (const modelName of modelNames) {
        const model = genAI.getGenerativeModel({
            model: modelName
        })

        for (let attempt = 1; attempt <= 3; attempt += 1) {
            try {
                const result = await model.generateContent(prompt)
                return result.response.text()
            } catch (error) {
                lastError = error

                if (!isRetryableError(error)) {
                    throw createUserFacingError(error)
                }

                console.warn(`Gemini model ${modelName} failed on attempt ${attempt}:`, error.message)

                if (attempt < 3) {
                    await sleep(750 * attempt)
                }
            }
        }
    }

    throw createUserFacingError(lastError)
}

export default analyzeResume
