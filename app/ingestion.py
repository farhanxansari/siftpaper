import os
import pymupdf as fitz
from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=100,
    separators=["\n\n", "\n", ". ", " ", ""],
)

def extract_text_by_page(pdf_path):
    doc = fitz.open(pdf_path)
    pages = []
    for page_num, page in enumerate(doc, 1):
        text = page.get_text()
        if text.strip():
            pages.append((page_num, text))
    doc.close()
    return pages

def is_reference_page(text):
    """Skip pages that are mostly bibliography/references."""
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    if not lines:
        return True
    # Count lines that look like citations [1], [2] or numbered refs
    ref_lines = sum(1 for l in lines if l.startswith("[") or l[:2].strip().isdigit())
    return ref_lines / len(lines) > 0.4   # >40% citation lines = reference page

def chunk_pdf(pdf_path):
    """Returns a list of dicts: {text, source, page, chunk_id}"""
    filename = os.path.basename(pdf_path)
    pages = extract_text_by_page(pdf_path)
    chunks = []
    chunk_id = 0
    skipped = 0
    for page_num, text in pages:
        if is_reference_page(text):
            skipped += 1
            continue
        for piece in splitter.split_text(text):
            chunks.append({
                "text": piece,
                "source": filename,
                "page": page_num,
                "chunk_id": chunk_id,
            })
            chunk_id += 1
    if skipped:
        print(f"  [{os.path.basename(pdf_path)}] Skipped {skipped} reference/bibliography pages")
    return chunks

def chunk_all_papers(folder="./papers"):
    all_chunks = []
    for f in os.listdir(folder):
        if f.endswith(".pdf"):
            all_chunks.extend(chunk_pdf(os.path.join(folder, f)))
    print(f"Total chunks created: {len(all_chunks)}")
    return all_chunks