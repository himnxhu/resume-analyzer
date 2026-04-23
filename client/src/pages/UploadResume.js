import axios from "axios";
import { useMemo, useRef, useState } from "react";
import "./UploadResume.css";

const emptyReport = {
  score: 0,
  match: 0,
  skills: [],
  missing: [],
  suggestions: [],
  sections: [],
  raw: "",
};

function getUploadErrorMessage(err) {
  const message = err.response?.data?.error || err.message || "Upload failed.";
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("googlegenerativeai error") ||
    lowerMessage.includes("service unavailable") ||
    lowerMessage.includes("high demand")
  ) {
    return "The AI service is temporarily busy. Please try again in a minute.";
  }

  return message;
}

function parseAnalysis(analysis) {
  const text = analysis || "";

  if (!text.trim()) {
    return emptyReport;
  }

  const scoreMatch = text.match(/(?:ATS\s*)?Score\s*:?\s*(\d{1,3})(?:\s*\/\s*100|\s*%)?/i);
  const keywordMatch = text.match(/Keyword\s*Match\s*:?\s*(\d{1,3})\s*%?/i);
  const score = Math.min(Number(scoreMatch?.[1]) || 0, 100);
  const match = Math.min(Number(keywordMatch?.[1]) || 0, 100);

  return {
    score,
    match,
    skills: extractList(text, "Skills Found"),
    missing: extractList(text, "Missing Keywords"),
    suggestions: extractList(text, "AI Suggestions"),
    sections: extractSections(text),
    raw: text,
  };
}

function extractList(text, heading) {
  const pattern = new RegExp(`${heading}\\s*\\n([\\s\\S]*?)(?:\\n\\s*\\n|$)`, "i");
  const section = text.match(pattern)?.[1];

  if (!section) {
    return [];
  }

  return section
    .split("\n")
    .map((line) => line.replace(/^[-*+\d.)\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 6);
}

function extractSections(text) {
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.slice(0, 6).map((block, index) => {
    const lines = block
      .split("\n")
      .map((line) => line.replace(/^[-*+\d.)\s]+/, "").trim())
      .filter(Boolean);
    const firstLine = lines[0] || `Insight ${index + 1}`;
    const hasHeading = firstLine.length <= 42 && lines.length > 1;

    return {
      title: hasHeading ? firstLine.replace(/:$/, "") : `Insight ${index + 1}`,
      points: hasHeading ? lines.slice(1, 4) : lines.slice(0, 3),
    };
  });
}

function EmptyState({ label = "Null" }) {
  return <span className="empty-state">{label}</span>;
}

function UploadResume() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const report = useMemo(() => parseAnalysis(result), [result]);
  const hasResult = Boolean(result.trim());

  const selectFile = (selectedFile) => {
    setError("");
    setFile(selectedFile || null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please choose a PDF resume first.");
      setResult("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult("");

      const formData = new FormData();
      formData.append("resume", file);

      const apiBaseUrl = process.env.REACT_APP_API_URL || "";
      const res = await axios.post(`${apiBaseUrl}/upload`, formData);

      setResult(res.data.analysis);
    } catch (err) {
      setError(getUploadErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  return (
    <main className="resume-app">
      <nav className="navbar">
        <a className="text-logo" href="#top" aria-label="AI Resume Analyzer home">
          AI Resume Analyzer
        </a>
        <div className="nav-links" aria-label="Primary navigation">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it Works</a>
          <a href="https://github.com/himnxhu/resume-analyzer" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </nav>

      <section className="hero section-shell" id="top">
        <div className="hero-copy">
          <span className="eyebrow">AI-powered resume intelligence</span>
          <h1>Improve Your Resume With AI</h1>
          <p>
            Get ATS score, keyword insights and practical suggestions instantly
            using our AI resume analyzer.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#upload">
              Upload Resume
            </a>
          </div>
        </div>

        <aside className="preview-card" aria-label="Resume analysis preview">
          <div className="preview-header">
            <span>Resume Analysis Preview</span>
            <span className="live-pill">Preview</span>
          </div>
          <div className="score-preview">
            <div className="score-ring" style={{ "--score": 84 }}>
              <span>84</span>
            </div>
            <div>
              <p>ATS Score</p>
              <strong>Good Resume</strong>
            </div>
          </div>
          <div className="metric-row">
            <span>Keyword Match</span>
            <strong>80%</strong>
          </div>
          <div className="progress-track">
            <span style={{ width: "80%" }} />
          </div>
          <div className="skill-cloud">
            <span>Python</span>
            <span>SQL</span>
            <span>Machine Learning</span>
          </div>
        </aside>
      </section>

      <section className="upload-section section-shell" id="upload">
        <div className="section-heading">
          <span className="eyebrow">Main interaction</span>
          <h2>Upload Your Resume</h2>
          <p>Your resume is analyzed for structure, keywords, ATS readiness and impact.</p>
        </div>

        <div
          className={`upload-card ${isDragging ? "is-dragging" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex="0"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            className="file-input"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => selectFile(event.target.files[0])}
          />
          <div className="upload-icon" aria-hidden="true">
            ^
          </div>
          <h3>Drag & Drop Resume Here</h3>
          <p>or click to upload</p>
          <span>{file ? file.name : "PDF supported"}</span>
        </div>

        <div className="upload-actions">
          <button className="primary-button" type="button" onClick={handleUpload} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Resume"}
          </button>
          <div className="trust-notes">
            <span>Your resume is never stored</span>
            <span>AI analysis in under 10 seconds</span>
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}
      </section>

      {loading && (
        <section className="processing-card section-shell" aria-live="polite">
          <h2>Analyzing Resume...</h2>
          <div className="processing-grid">
            {[
              "Parsing Resume Structure",
              "Extracting Skills",
              "Checking ATS Compatibility",
              "Comparing Job Keywords",
              "Generating Suggestions",
            ].map((step) => (
              <span key={step}>Done: {step}</span>
            ))}
          </div>
          <div className="processing-bar">
            <span />
          </div>
        </section>
      )}

      <section className="results section-shell" id="how-it-works">
        <div className="section-heading">
          <span className="eyebrow">Resume Analysis Report</span>
          <h2>Your AI Resume Report</h2>
        </div>

        <div className="dashboard-grid">
          <article className="score-card glass-card">
            <div className="animated-score" style={{ "--score": report.score }}>
              <span>{report.score}</span>
            </div>
            <h3>ATS Score</h3>
            <p>{hasResult ? (report.score >= 80 ? "Good Resume" : "Needs Improvement") : "Upload required"}</p>
          </article>

          <article className="glass-card">
            <div className="card-title-row">
              <h3>Keyword Match</h3>
              <strong>{report.match}%</strong>
            </div>
            <div className="progress-track large">
              <span style={{ width: `${report.match}%` }} />
            </div>
          </article>

          <article className="glass-card">
            <h3>Skills Found</h3>
            <div className="tag-list success">
              {report.skills.length ? report.skills.map((skill) => <span key={skill}>{skill}</span>) : <EmptyState />}
            </div>
          </article>

          <article className="glass-card">
            <h3>Missing Keywords</h3>
            <div className="tag-list warning">
              {report.missing.length ? (
                report.missing.map((keyword) => <span key={keyword}>{keyword}</span>)
              ) : (
                <EmptyState />
              )}
            </div>
          </article>

          <article className="glass-card suggestions-card">
            <h3>AI Suggestions</h3>
            {report.suggestions.length ? (
              <ul>
                {report.suggestions.map((suggestion) => (
                  <li key={suggestion}>{suggestion}</li>
                ))}
              </ul>
            ) : (
              <EmptyState label="Null - upload and analyze your resume to generate suggestions" />
            )}
          </article>
        </div>

        {hasResult && (
          <section className="analysis-panel">
            <div className="section-heading compact">
              <span className="eyebrow">Full Analysis</span>
              <h2>Detailed AI Breakdown</h2>
            </div>
            <div className="analysis-grid">
              {report.sections.map((section) => (
                <article className="analysis-card" key={section.title}>
                  <h3>{section.title}</h3>
                  <ul>
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>

      <section className="trust-section section-shell" id="features">
        <div>
          <span className="eyebrow">Why Use Our AI?</span>
          <h2>Built for fast, practical resume feedback.</h2>
        </div>
        <div className="trust-grid">
          <span>ATS optimized analysis</span>
          <span>Instant resume feedback</span>
          <span>Designed for students & developers</span>
          <strong>1000+ resumes analyzed</strong>
        </div>
      </section>

      <footer className="footer">
        <strong>AI Resume Analyzer</strong>
        <div>
          <a href="https://github.com/himnxhu/resume-analyzer" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="#top">Privacy</a>
          <a href="mailto:upadhyayhimanshu842@gmail.com">Contact</a>
        </div>
      </footer>
    </main>
  );
}

export default UploadResume;
