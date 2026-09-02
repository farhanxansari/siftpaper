import re
from app.config import GROQ_API_KEY, LLM_MODEL

_client = None

def get_client():
    global _client
    if _client is None:
        from groq import Groq
        _client = Groq(api_key=GROQ_API_KEY)
    return _client

PROMPT_TEMPLATE = """You are a precise research assistant. Answer the question ONLY using the context below.
If the answer is not in the context, say "I don't know based on the provided papers."
Always cite sources inline like [Source: filename, Page X].

Context:
{context}

Question: {question}

Answer:"""

def build_context(chunks):
    blocks = []
    for c in chunks:
        blocks.append(f"[Source: {c['source']}, Page {c['page']}]\n{c['text']}")
    return "\n\n---\n\n".join(blocks)

def generate_answer(question, chunks):
    context = build_context(chunks)
    prompt = PROMPT_TEMPLATE.format(context=context, question=question)
    resp = get_client().chat.completions.create(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        reasoning_effort="none",
    )
    answer = resp.choices[0].message.content
    answer = re.sub(r"<think>.*?</think>", "", answer, flags=re.DOTALL).strip()
    return answer