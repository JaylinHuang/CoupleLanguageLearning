import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/md-to-pdf.mjs <path-to.md>");
  process.exit(1);
}

const inputPath = path.resolve(root, input);
const outputPath = inputPath.replace(/\.md$/i, ".pdf");
const md = fs.readFileSync(inputPath, "utf8");

const browserCandidates = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];

const executablePath = browserCandidates.find((p) => fs.existsSync(p));
if (!executablePath) {
  console.error("No Edge or Chrome found for PDF generation.");
  process.exit(1);
}

const htmlBody = marked.parse(md);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Erika User Guide</title>
  <style>
    @page { margin: 20mm 18mm; }
    body {
      font-family: "Segoe UI", Arial, sans-serif;
      color: #2d2a32;
      line-height: 1.55;
      font-size: 11pt;
      max-width: 100%;
    }
    h1 {
      color: #c45c7a;
      font-size: 22pt;
      border-bottom: 2px solid #f3c4d4;
      padding-bottom: 8px;
      margin-top: 0;
    }
    h2 {
      color: #8b4a62;
      font-size: 15pt;
      margin-top: 24px;
      page-break-after: avoid;
    }
    h3 {
      color: #5c4a52;
      font-size: 12pt;
      margin-top: 16px;
    }
    blockquote {
      background: #fff5f8;
      border-left: 4px solid #e8a0b4;
      margin: 12px 0;
      padding: 10px 14px;
      color: #5c4a52;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 16px;
      font-size: 10pt;
    }
    th, td {
      border: 1px solid #e8d8de;
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
    }
    th { background: #fff0f4; }
    tr:nth-child(even) td { background: #fdf8fa; }
    code {
      background: #f5eef1;
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 10pt;
    }
    ul, ol { padding-left: 22px; }
    li { margin: 4px 0; }
    hr {
      border: none;
      border-top: 1px solid #ecd8df;
      margin: 20px 0;
    }
    strong { color: #4a3540; }
    em { color: #6a5560; }
    p { margin: 8px 0; }
  </style>
</head>
<body>${htmlBody}</body>
</html>`;

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    margin: { top: "18mm", right: "16mm", bottom: "18mm", left: "16mm" },
  });
  console.log(`PDF created: ${outputPath}`);
} finally {
  await browser.close();
}
