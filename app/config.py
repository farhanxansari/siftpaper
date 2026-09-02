import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

COLLECTION_NAME = "arxiv_papers"
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"
EMBED_DIM = 384
LLM_MODEL = "qwen/qwen3.6-27b"

qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

# Lazy loader — model loads on first use, not at startup
_embedder = None

def get_embedder():
    global _embedder
    if _embedder is None:
        from sentence_transformers import SentenceTransformer
        _embedder = SentenceTransformer(EMBED_MODEL_NAME)
    return _embedder