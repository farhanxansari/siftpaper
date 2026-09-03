<div align="center">

# SiftPaper

**RAG-powered Q&A over arXiv CS.AI papers with cross-encoder re-ranking**

[![Live Demo](https://img.shields.io/badge/Live_Demo-siftpaper.vercel.app-blue?style=flat-square)](https://siftpaper.vercel.app)
[![API Docs](https://img.shields.io/badge/API_Docs-Swagger-green?style=flat-square)](https://siftpaper-production.up.railway.app/docs)
[![Python](https://img.shields.io/badge/Python-3.11-yellow?style=flat-square&logo=python)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-teal?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)

[Live Demo](https://siftpaper.vercel.app) · [API Docs](https://siftpaper-production.up.railway.app/docs) · [Architecture](#architecture) · [Evaluation](#evaluation) · [Setup](#setup)

</div>

---

## What it does ?

SiftPaper is a production-grade **Retrieval-Augmented Generation (RAG)** system that lets you ask questions across 56+ arXiv CS.AI research papers and get cited, grounded answers.

- **Ask** a question in natural language
- **Retrieves** the most relevant passages using vector search + cross-encoder re-ranking
- **Generates** a grounded answer using an LLM — citing the exact paper and page number
- **Upload** new papers to expand the knowledge base in real-time
- **Evaluates** answer quality using RAGAS (faithfulness, relevancy, context precision)

---

## Demo

> Try it live at [siftpaper.vercel.app](https://siftpaper.vercel.app)

**Features:**
- Monochrome UI with light / dark / system theme toggle
- Cross-encoder re-ranking toggle to compare retrieval quality live
- LaTeX math rendering via KaTeX
- Drag-and-drop PDF upload with live indexing
- Clickable starter questions for quick exploration

---

## Architecture

```
                          ┌─────────────────────────────────────────────┐
                          │              SiftPaper                      │
                          └─────────────────────────────────────────────┘

  ┌──────────────┐              ┌──────────────────┐              ┌──────────────┐
  │   Next.js    │   question   │    FastAPI        │   embed      │ Qdrant Cloud │
  │   Frontend   │ ───────────► │    Backend        │ ───────────► │  Vector DB   │
  │   (Vercel)   │ ◄─────────── │    (Railway)      │ ◄─────────── │ 7,346 chunks │
  └──────────────┘  answer +    └────────┬─────────┘  top 20       └──────────────┘
                    sources              │
                                         │ re-rank top 20 → top 5
                                         ▼
                                ┌──────────────────┐
                                │  Cross-Encoder   │
                                │  ms-marco-MiniLM │
                                └────────┬─────────┘
                                         │
                                         ▼
                                ┌──────────────────┐
                                │    Groq LLM      │
                                │   Qwen3 27B      │
                                │  (with citations) │
                                └──────────────────┘
```

**Data Pipeline:**
```
56(increases as u upload) arXiv PDFs → PyMuPDF text extraction → Reference page filtering
→ RecursiveCharacterTextSplitter (800 tokens, 100 overlap)
→ all-MiniLM-L6-v2 embeddings → Qdrant Cloud (7,346 chunks)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS, KaTeX |
| **Backend** | FastAPI, Python 3.11 |
| **LLM** | Groq API (Qwen3-27B) |
| **Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` (384-dim) |
| **Re-ranking** | `cross-encoder/ms-marco-MiniLM-L-6-v2` |
| **Vector DB** | Qdrant Cloud (free tier, 1GB) |
| **Evaluation** | RAGAS (Faithfulness, Relevancy, Context Precision) |
| **Deployment** | Vercel (frontend) + Railway (backend) |

---

## Evaluation

Evaluated on 10 ground-truth QA pairs using [RAGAS](https://github.com/explodinggradients/ragas). Cross-encoder re-ranking improved all three metrics:

| Metric | Baseline (vector only) | With Re-ranking | Improvement |
|---|---|---|---|
| **Faithfulness** | 0.5648 | **0.7917** | +40% |
| **Answer Relevancy** | 0.5716 | **0.7759** | +36% |
| **Context Precision** | 0.5087 | **0.6964** | +37% |

**How re-ranking works:** Vector search retrieves the top 20 candidates by cosine similarity. A cross-encoder (`ms-marco-MiniLM-L-6-v2`) then reads each chunk alongside the query and re-scores them. The top 5 after re-ranking are passed to the LLM. This two-stage approach combines the speed of dense retrieval with the precision of cross-attention.

---

## Features

- **Semantic search** across 55+ arXiv CS.AI papers (7,346 chunks)
- **Cross-encoder re-ranking** — toggle on/off to compare retrieval strategies live
- **Inline citations** — every answer cites `[Source: filename, Page X]`
- **PDF upload** — drag-and-drop new papers into the knowledge base
- **Live paper count** — updates dynamically as papers are added
- **Light / Dark / System** theme toggle
- **LaTeX math rendering** — equations rendered via KaTeX
- **Reference page filtering** — bibliography pages auto-skipped during ingestion
- **RAGAS evaluation** — reproducible quality metrics with before/after comparison
- **Starter questions** — clickable prompts for quick exploration

---

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Groq API key](https://console.groq.com) (free)
- [Qdrant Cloud](https://cloud.qdrant.io) cluster (free tier)

### Backend

```bash
git clone https://github.com/farhanxansari/siftpaper.git
cd siftpaper

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Fill in GROQ_API_KEY, QDRANT_URL, QDRANT_API_KEY
```

Download papers and build the index:

```bash
python download_papers.py       # downloads 55 arXiv CS.AI papers
python build_index.py           # chunks, embeds, indexes into Qdrant
```

Start the API:

```bash
uvicorn app.main:app --reload
# API docs at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# UI at http://localhost:3000
```

### Environment Variables

```env
GROQ_API_KEY=your_groq_api_key
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/query` | Ask a question → answer + sources |
| `GET` | `/papers` | List indexed papers with count |
| `POST` | `/ingest` | Upload and index a new PDF |

**Example request:**

```bash
curl -X POST https://siftpaper-production.up.railway.app/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What is attention?", "top_k": 5, "rerank": true}'
```

---

## Project Structure

```
siftpaper/
├── app/
│   ├── config.py            # Qdrant + embedding model config
│   ├── ingestion.py         # PDF parsing, reference filtering, chunking
│   ├── vector_store.py      # Qdrant operations, search, indexing
│   ├── reranker.py          # Cross-encoder re-ranking
│   ├── generator.py         # LLM prompt construction + Groq API
│   └── main.py              # FastAPI app with CORS
├── evaluation/
│   ├── test_questions.json   # 10 ground-truth QA pairs
│   └── run_ragas.py          # RAGAS evaluation script
├── frontend/
│   ├── app/
│   │   ├── page.tsx          # Chat interface with starter questions
│   │   ├── upload/page.tsx   # PDF upload with drag-and-drop
│   │   ├── layout.tsx        # Theme provider + metadata
│   │   └── globals.css       # Monochrome + blue accent theme
│   ├── components/
│   │   ├── SourceCard.tsx    # Citation card component
│   │   ├── ThemeToggle.tsx   # Light/dark/system toggle
│   │   └── ThemeProvider.tsx # next-themes wrapper
│   └── lib/api.ts            # Type-safe API client
├── Dockerfile                # Production container
├── requirements-prod.txt     # Minimal production dependencies
├── requirements.txt          # Full development dependencies
├── build_index.py            # One-time index builder
└── download_papers.py        # arXiv paper downloader
```

---

## Known Limitations

- **Cold starts:** Railway free tier may take 30-60s on first request while ML models load into memory
- **Ephemeral storage:** Uploaded PDFs are stored in the container filesystem — they persist in Qdrant (searchable) but the file listing resets on redeployment
- **Token limits:** Groq free tier has daily token limits (~200K TPD) which may throttle heavy usage

---

## Built by Me ~ Farhan Ansari [GitHub](https://github.com/farhanxansari)


<div align="center">
<sub>Built with FastAPI · Next.js · Qdrant · Groq · sentence-transformers · RAGAS</sub>
</div>
