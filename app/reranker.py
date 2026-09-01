from sentence_transformers import CrossEncoder

# Loaded once, reused. ~90MB download on first run.
reranker_model = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

def rerank(query, chunks, top_k=5):
    """Re-score chunks against the query with a cross-encoder, return top_k."""
    if not chunks:
        return chunks
    pairs = [(query, c["text"]) for c in chunks]
    scores = reranker_model.predict(pairs)
    for c, s in zip(chunks, scores):
        c["rerank_score"] = float(s)
    ranked = sorted(chunks, key=lambda c: c["rerank_score"], reverse=True)
    return ranked[:top_k]