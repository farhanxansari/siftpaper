from app.vector_store import search
from app.generator import generate_answer

question = "How does attention mechanism work in transformers?"

chunks = search(question, top_k=5)
answer = generate_answer(question, chunks)

print("=" * 60)
print("QUESTION:", question)
print("=" * 60)
print("\nANSWER:\n", answer)
print("\n" + "=" * 60)
print("SOURCES USED:")
for c in chunks:
    print(f"  - {c['source']} | Page {c['page']} | Score {c['score']:.3f}")