import express from "express";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { PDFParse } from "pdf-parse";
import analyzeResume from "../utils/analyzeResume.js";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "..", "uploads");
const upload = multer({ dest: uploadDir });

router.post("/upload", upload.single("resume"), async (req, res) => {
  let parser;

  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Please upload a PDF resume file."
      });
    }

    const dataBuffer = await fs.readFile(req.file.path);

    parser = new PDFParse({ data: dataBuffer });
    const pdfData = await parser.getText();

    const resumeText = pdfData.text?.trim();

    if (!resumeText) {
      return res.status(400).json({
        error: "Could not read text from this PDF. Try a text-based PDF resume."
      });
    }

    const analysis = await analyzeResume(resumeText);

    res.json({
      analysis: analysis
    });

  } catch (err) {

    console.error("Resume analysis error:", err);

    res.status(err.status || 500).json({
      error: err.message
    });

  } finally {
    await Promise.allSettled([
      parser?.destroy(),
      req.file ? fs.rm(req.file.path, { force: true }) : Promise.resolve()
    ]);
  }
});

export default router;
