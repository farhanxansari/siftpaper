import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

COLLECTION_NAME = "arxiv_papers"
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"
EMBED_DIM = 384          # all-MiniLM-L6-v2 outputs 384-dim vectors
LLM_MODEL = "qwen/qwen3.6-27b"

# Load embedding model once (reused everywhere)
embedder = SentenceTransformer(EMBED_MODEL_NAME)

# Qdrant client
qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)