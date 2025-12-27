"""
OCR API Routes
Endpoints for document processing and face extraction
"""

from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from typing import Optional
from services.ocr_service import process_image, process_zairyu_card, process_rirekisho
from services.face_service import crop_face_to_base64, detect_and_crop_face
import base64

router = APIRouter()


@router.get("/health")
async def health_check():
    """Check if OCR service is ready."""
    try:
        from services.ocr_service import get_reader
        # This will initialize the reader if not already done
        get_reader()
        return {"status": "ready", "message": "EasyOCR reader initialized"}
    except Exception as e:
        return {"status": "initializing", "message": str(e)}


@router.post("/process")
async def process_document(
    file: UploadFile = File(...),
    document_type: Optional[str] = Form(default="auto")
):
    """
    Process a document image and extract text/data using OCR.

    Args:
        file: Image file (JPEG, PNG, etc.)
        document_type: Type of document - 'zairyu', 'rirekisho', or 'auto'

    Returns:
        Extracted text and structured data
    """
    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )

    try:
        # Read file content
        content = await file.read()

        # Process based on document type
        if document_type == "zairyu":
            result = process_zairyu_card(content)
        elif document_type == "rirekisho":
            result = process_rirekisho(content)
        else:
            result = process_image(content)

        return {
            "success": True,
            "filename": file.filename,
            "document_type": document_type,
            "data": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"OCR processing failed: {str(e)}"
        )


@router.post("/crop-face")
async def crop_face(
    file: UploadFile = File(...)
):
    """
    Detect and crop face from an ID card image.

    Args:
        file: Image file containing an ID card with photo

    Returns:
        Base64 encoded cropped face image
    """
    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )

    try:
        content = await file.read()
        face_base64 = crop_face_to_base64(content)

        if face_base64 is None:
            return {
                "success": False,
                "message": "No face detected in the image",
                "face_image": None
            }

        return {
            "success": True,
            "message": "Face detected and cropped successfully",
            "face_image": f"data:image/png;base64,{face_base64}"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Face detection failed: {str(e)}"
        )


@router.post("/batch-process")
async def batch_process(
    files: list[UploadFile] = File(...),
    document_type: Optional[str] = Form(default="auto")
):
    """
    Process multiple document images at once.

    Args:
        files: List of image files
        document_type: Type of documents

    Returns:
        List of extraction results
    """
    results = []

    for file in files:
        try:
            content = await file.read()
            result = process_image(content)
            results.append({
                "success": True,
                "filename": file.filename,
                "data": result
            })
        except Exception as e:
            results.append({
                "success": False,
                "filename": file.filename,
                "error": str(e)
            })

    return {
        "total": len(files),
        "successful": sum(1 for r in results if r["success"]),
        "failed": sum(1 for r in results if not r["success"]),
        "results": results
    }
