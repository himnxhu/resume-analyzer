import express from "express";
import multer from "multer";
import fs from "fs";
import { createRequire } from "module";
import analyzeResume from "../utils/analyzeResume.js";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse").default;

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("resume"), async (req, res) => {
  try {

    const dataBuffer = fs.readFileSync(req.file.path);

    const pdfData = await pdfParse(dataBuffer);

    const resumeText = pdfData.text;

    const analysis = await analyzeResume(resumeText);

    res.json({
      analysis: analysis
    });

  } catch (err) {

    console.error("Resume analysis error:", err);

    res.status(500).json({
      error: err.message
    });

  }
});

export default router;