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
    <main className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">eBook Generator</h1>
      <form onSubmit={handleGenerate} className="space-y-2 max-w-md">
        <input
          className="w-full border p-2"
          placeholder="Topic"
          name="topic"
          value={form.topic}
          onChange={handleChange}
          required
        />
        <input
          className="w-full border p-2"
          placeholder="Audience"
          name="audience"
          value={form.audience}
          onChange={handleChange}
          required
        />
        <div className="flex gap-2">
          <label className="flex flex-col text-sm">
            Language
            <select
              name="language"
              value={form.language}
              onChange={handleChange}
              className="border p-2"
            >
              <option value="en">English</option>
              <option value="th">ไทย</option>
            </select>
          </label>
          <label className="flex flex-col text-sm">
            Tone
            <select
              name="tone"
              value={form.tone}
              onChange={handleChange}
              className="border p-2"
            >
              <option value="friendly">Friendly</option>
              <option value="professional">Professional</option>
            </select>
          </label>
        </div>
        <div className="flex gap-2">
          <label className="flex flex-col text-sm">
            Chapters
            <input
              type="number"
              name="chapters"
              min={5}
              max={12}
              value={form.chapters}
              onChange={handleChange}
              className="border p-2"
            />
          </label>
          <label className="flex flex-col text-sm">
            Words/Chapter
            <input
              type="number"
              name="wordsPerChapter"
              min={400}
              max={800}
              value={form.wordsPerChapter}
              onChange={handleChange}
              className="border p-2"
            />
          </label>
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
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
          disabled={loading}
        >
          Generate
        </button>
      </form>

      {loading && <p>Generating...</p>}

      {markdown && !loading && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={downloadMd} className="px-3 py-1 bg-gray-200 rounded">
              Download .md
            </button>
            <button onClick={downloadDocx} className="px-3 py-1 bg-gray-200 rounded">
              Download .docx
            </button>
          </div>
          <div className="prose max-w-none">
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>
        </div>
      )}
    </main>
  );
}
