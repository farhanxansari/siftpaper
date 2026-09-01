import json
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datasets import Dataset
from ragas import evaluate
from ragas.metrics import Faithfulness, ResponseRelevancy, LLMContextPrecisionWithoutReference
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper
from ragas.run_config import RunConfig
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings

from app.vector_store import search
from app.generator import generate_answer
from app.config import GROQ_API_KEY

judge_llm = LangchainLLMWrapper(
    ChatGroq(
        model="openai/gpt-oss-20b",
        api_key=GROQ_API_KEY,
        temperature=0,
        max_tokens=2048,
    )
)

judge_embeddings = LangchainEmbeddingsWrapper(
    HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
)

def build_eval_dataset(test_file):
    with open(test_file, "r", encoding="utf-8") as f:
        tests = json.load(f)

    questions, answers, contexts, ground_truths = [], [], [], []
    for t in tests:
        q = t["question"]
        print(f"Running: {q[:60]}...")
        chunks = search(q, top_k=5, rerank=True)   
        answer = generate_answer(q, chunks)
        questions.append(q)
        answers.append(answer)
        contexts.append([c["text"] for c in chunks])
        ground_truths.append(t["ground_truth"])

    return Dataset.from_dict({
        "user_input": questions,
        "response": answers,
        "retrieved_contexts": contexts,
        "reference": ground_truths,
    })

if __name__ == "__main__":
    test_file = os.path.join(os.path.dirname(__file__), "test_questions.json")
    ds = build_eval_dataset(test_file)

    metrics = [
        Faithfulness(),
        ResponseRelevancy(strictness=1),
        LLMContextPrecisionWithoutReference(),
    ]

    print("\nRunning RAGAS evaluation (slowed down to respect Groq rate limits)...\n")
    result = evaluate(
        ds,
        metrics=metrics,
        llm=judge_llm,
        embeddings=judge_embeddings,
        run_config=RunConfig(
            max_workers=1,
            timeout=180,
            max_retries=10,
        ),
    )

    print("\n" + "=" * 50)
    print("RAGAS SCORES")
    print("=" * 50)
    print(result)

    df = result.to_pandas()
    df.to_csv(os.path.join(os.path.dirname(__file__), "ragas_results.csv"), index=False)
    print("\nSaved to evaluation/ragas_results.csv")