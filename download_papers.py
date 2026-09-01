import arxiv

def download_papers(max_results=50):
    client = arxiv.Client()
    search = arxiv.Search(
        query="cat:cs.AI",
        max_results=max_results,
        sort_by=arxiv.SortCriterion.SubmittedDate,
    )
    for i, result in enumerate(client.results(search), 1):
        short_id = result.get_short_id().replace("/", "_")
        filename = f"{short_id}.pdf"
        try:
            result.download_pdf(dirpath="./papers", filename=filename)
            print(f"[{i}] Downloaded: {result.title[:60]}...")
        except Exception as e:
            print(f"[{i}] Failed: {e}")

if __name__ == "__main__":
    download_papers(50)