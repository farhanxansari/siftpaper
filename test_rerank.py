from app.vector_store import search

question = "What is the attention mechanism in transformers?"

print("=" * 60)
print("WITHOUT RE-RANKING")
print("=" * 60)
for c in search(question, top_k=5, rerank=False):
    print(f"  {c['source']} | Page {c['page']} | vec score {c['score']:.3f}")

print("\n" + "=" * 60)
print("WITH RE-RANKING")
print("=" * 60)
for c in search(question, top_k=5, rerank=True):
    print(f"  {c['source']} | Page {c['page']} | rerank score {c['rerank_score']:.3f}")