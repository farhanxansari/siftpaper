import os
import shutil
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.vector_store import search, create_collection, index_chunks
from app.generator import generate_answer
from app.ingestion import chunk_pdf
from app.config import qdrant, COLLECTION_NAME

app = FastAPI(title="SiftPaper API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://siftpaper.vercel.app",
        "https://siftpaper-farhanxansari.vercel.app",
        "http://localhost:3000",
        "*",  # fallback
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

PAPERS_DIR = "./papers"

class QueryRequest(BaseModel):
    question: str
    top_k: int = 5
    rerank: bool = False

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/query")
def query(req: QueryRequest):
    chunks = search(req.question, top_k=req.top_k, rerank=req.rerank)
    answer = generate_answer(req.question, chunks)
    return {
        "question": req.question,
        "answer": answer,
        "sources": [
            {
                "source": c["source"],
                "page": c["page"],
                "score": round(c.get("rerank_score", c["score"]), 3),
            }
            for c in chunks
        ],
    }

@app.get("/papers")
def list_papers():
    """List indexed PDF filenames."""
    if not os.path.exists(PAPERS_DIR):
        return {"papers": [], "count": 0}
    files = sorted(f for f in os.listdir(PAPERS_DIR) if f.endswith(".pdf"))
    return {"papers": files, "count": len(files)}

@app.post("/ingest")
async def ingest(file: UploadFile = File(...)):
    """Upload a PDF, chunk it, embed it, and index it."""
    os.makedirs(PAPERS_DIR, exist_ok=True)
    dest = os.path.join(PAPERS_DIR, file.filename)

    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    create_collection()  # no-op if it already exists
    chunks = chunk_pdf(dest)
    index_chunks(chunks)

    return {
        "filename": file.filename,
        "chunks_indexed": len(chunks),
        "status": "success",
    }