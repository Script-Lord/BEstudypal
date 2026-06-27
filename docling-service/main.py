from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.base_models import ConversionStatus, InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions, TesseractCliOcrOptions
import tempfile
import os
import logging
import shutil

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Docling Document Parser", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


def create_converter() -> DocumentConverter:
    pdf_options = PdfPipelineOptions()

    # RapidOCR auto-select is brittle across versions; prefer Tesseract when available
    # (installed in the Docker image). Digital PDFs still parse with do_ocr=False.
    if shutil.which("tesseract"):
        pdf_options.do_ocr = True
        pdf_options.ocr_options = TesseractCliOcrOptions()
        logger.info("PDF OCR: using Tesseract CLI")
    else:
        pdf_options.do_ocr = False
        logger.info("PDF OCR: disabled (Tesseract not found; digital PDFs only)")

    return DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pdf_options),
        }
    )


converter = create_converter()


def build_pages(doc, markdown: str, result) -> list[dict]:
    """Extract page metadata from a Docling v2 document."""
    pages: list[dict] = []
    raw_pages = getattr(doc, "pages", None) or {}

    # Docling v2 stores pages as a dict keyed by page number.
    if isinstance(raw_pages, dict):
        for key in sorted(raw_pages.keys(), key=lambda k: int(k) if str(k).isdigit() else str(k)):
            item = raw_pages[key]
            pages.append({
                "page_number": getattr(item, "page_no", int(key) if str(key).isdigit() else len(pages) + 1),
                "text": "",
            })
    elif raw_pages:
        for page in raw_pages:
            page_text = ""
            if hasattr(page, "export_to_markdown"):
                page_text = page.export_to_markdown() or ""
            elif hasattr(page, "text"):
                page_text = page.text or ""

            pages.append({
                "page_number": getattr(page, "page_no", getattr(page, "page_number", len(pages) + 1)),
                "text": page_text,
            })

    if not pages:
        input_doc = getattr(result, "input", None)
        page_count = getattr(input_doc, "page_count", 0) if input_doc else 0
        if page_count and page_count > 0:
            pages = [{"page_number": i, "text": ""} for i in range(1, page_count + 1)]
        elif markdown.strip():
            pages = [{"page_number": 1, "text": markdown}]

    return pages


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
            detail=f"Unsupported file type: {suffix}. Supported: {', '.join(sorted(supported))}"
        )

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        logger.info(f"Parsing {file.filename} ({len(content)} bytes)")

        result = converter.convert(tmp_path)

        if result.status not in (ConversionStatus.SUCCESS, ConversionStatus.PARTIAL_SUCCESS):
            raise HTTPException(status_code=500, detail=f"Conversion failed: {result.status}")

        doc = result.document
        if doc is None:
            raise HTTPException(status_code=500, detail="Conversion returned no document")

        markdown = doc.export_to_markdown() or ""
        pages = build_pages(doc, markdown, result)

        if not markdown.strip():
            raise HTTPException(status_code=500, detail="Docling returned empty content")

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
