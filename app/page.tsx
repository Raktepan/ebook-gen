"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [form, setForm] = useState({
    topic: "",
    language: "en",
    audience: "",
    tone: "friendly",
    chapters: 5,
    wordsPerChapter: 400,
    includeExamples: false,
  });
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value, type } = target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (target as HTMLInputElement).checked
          : type === "number"
          ? Number(value)
          : value,
    }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMarkdown("");
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setMarkdown(data.markdown || "");
    setLoading(false);
  };

  const downloadMd = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ebook.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadDocx = async () => {
    const res = await fetch("/api/export/docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ebook.docx";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold">eBook Generator</h1>
      <div className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium mb-1">
              Topic
            </label>
            <input
              id="topic"
              className="input"
              placeholder="Topic"
              name="topic"
              value={form.topic}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="audience" className="block text-sm font-medium mb-1">
              Audience
            </label>
            <input
              id="audience"
              className="input"
              placeholder="Audience"
              name="audience"
              value={form.audience}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="language" className="block text-sm font-medium mb-1">
                Language
              </label>
              <select
                id="language"
                name="language"
                value={form.language}
                onChange={handleChange}
                className="input"
              >
                <option value="en">English</option>
                <option value="th">ไทย</option>
              </select>
            </div>
            <div>
              <label htmlFor="tone" className="block text-sm font-medium mb-1">
                Tone
              </label>
              <select
                id="tone"
                name="tone"
                value={form.tone}
                onChange={handleChange}
                className="input"
              >
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="chapters"
                className="block text-sm font-medium mb-1"
              >
                Chapters
              </label>
              <input
                type="number"
                id="chapters"
                name="chapters"
                min={5}
                max={12}
                value={form.chapters}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label
                htmlFor="wordsPerChapter"
                className="block text-sm font-medium mb-1"
              >
                Words/Chapter
              </label>
              <input
                type="number"
                id="wordsPerChapter"
                name="wordsPerChapter"
                min={400}
                max={800}
                value={form.wordsPerChapter}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="includeExamples"
              checked={form.includeExamples}
              onChange={handleChange}
            />
            Include examples
          </label>
          <button type="submit" className="btn" disabled={loading}>
            Generate
          </button>
        </form>
        <div>
          {loading && <p>Generating...</p>}

          {markdown && !loading && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button onClick={downloadMd} className="btn-secondary">
                  Download .md
                </button>
                <button onClick={downloadDocx} className="btn-secondary">
                  Download .docx
                </button>
              </div>
              <article className="prose max-w-none lg:prose-lg">
                <ReactMarkdown>{markdown}</ReactMarkdown>
              </article>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
