import uuid
import time
from qdrant_client.models import Distance, VectorParams, PointStruct
from app.config import qdrant, get_embedder, COLLECTION_NAME, EMBED_DIM

def create_collection():
    existing = [c.name for c in qdrant.get_collections().collections]
    if COLLECTION_NAME not in existing:
        qdrant.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=EMBED_DIM, distance=Distance.COSINE),
        )
        print(f"Created collection: {COLLECTION_NAME}")
    else:
        print(f"Collection already exists: {COLLECTION_NAME}")

def index_chunks(chunks, batch_size=32):
    embedder = get_embedder()
    texts = [c["text"] for c in chunks]
    print("Embedding chunks...")
    vectors = embedder.encode(texts, batch_size=64, show_progress_bar=True)
    points = []
    for chunk, vector in zip(chunks, vectors):
        points.append(PointStruct(
            id=str(uuid.uuid4()),
            vector=vector.tolist(),
            payload=chunk,
        ))
    total_batches = (len(points) + batch_size - 1) // batch_size
    print(f"Uploading {len(points)} chunks in {total_batches} batches...")
    for i in range(0, len(points), batch_size):
        batch = points[i:i+batch_size]
        batch_num = i // batch_size + 1
        for attempt in range(5):
            try:
                qdrant.upsert(collection_name=COLLECTION_NAME, points=batch)
                print(f"  Batch {batch_num}/{total_batches} uploaded ✓")
                break
            except Exception as e:
                if attempt < 4:
                    wait = 2 ** attempt
                    print(f"  Batch {batch_num} failed, retrying in {wait}s...")
                    time.sleep(wait)
                else:
                    print(f"  Batch {batch_num} FAILED after 5 attempts.")
    info = qdrant.get_collection(COLLECTION_NAME)
    print(f"\nDone. {info.points_count} points in Qdrant.")

def search(query, top_k=5, rerank=False, candidates=20):
    embedder = get_embedder()
    fetch_k = candidates if rerank else top_k
    query_vec = embedder.encode(query).tolist()
    results = qdrant.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vec,
        limit=fetch_k,
    ).points
    chunks = [
        {
            "text": r.payload["text"],
            "source": r.payload["source"],
            "page": r.payload["page"],
            "score": r.score,
        }
        for r in results
    ]
    if rerank:
        from app.reranker import rerank as rerank_fn
        chunks = rerank_fn(query, chunks, top_k=top_k)
    return chunks