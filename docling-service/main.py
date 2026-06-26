from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from docling.document_converter import DocumentConverter
import tempfile
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Docling Document Parser", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

converter = DocumentConverter()


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/parse")
async def parse_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    suffix = os.path.splitext(file.filename)[1].lower()
    supported = {".pdf", ".docx", ".doc", ".pptx", ".ppt", ".png", ".jpg", ".jpeg", ".webp", ".txt", ".md"}

    if suffix not in supported:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {suffix}. Supported: {', '.join(supported)}"
        )

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        logger.info(f"Parsing {file.filename} ({len(content)} bytes)")

        result = converter.convert(tmp_path)
        doc = result.document

        markdown = doc.export_to_markdown()

        pages = []
        for page in getattr(doc, "pages", []):
            page_text = ""
            if hasattr(page, "export_to_markdown"):
                page_text = page.export_to_markdown()
            elif hasattr(page, "text"):
                page_text = page.text or ""

            pages.append({
                "page_number": getattr(page, "page_no", len(pages) + 1),
                "text": page_text,
            })

        logger.info(f"Parsed {file.filename}: {len(pages)} pages, {len(markdown)} chars")

        return {
            "markdown": markdown,
            "pages": pages,
            "metadata": {
                "page_count": len(pages),
                "char_count": len(markdown),
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Parse error for {file.filename}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
