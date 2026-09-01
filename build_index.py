from app.ingestion import chunk_all_papers
from app.vector_store import create_collection, index_chunks

if __name__ == "__main__":
    create_collection()
    chunks = chunk_all_papers("./papers")
    index_chunks(chunks)
    print("Index build complete.")