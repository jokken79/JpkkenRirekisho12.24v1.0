"""
StaffHub UNS Pro - OCR Backend
FastAPI server with EasyOCR for document processing
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.ocr import router as ocr_router

app = FastAPI(
    title="StaffHub OCR API",
    description="OCR service for processing Zairyu cards and Rirekisho documents",
    version="1.0.0"
)

# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ocr_router, prefix="/api/ocr", tags=["OCR"])


@app.get("/")
async def root():
    return {
        "message": "StaffHub OCR API",
        "version": "1.0.0",
        "endpoints": {
            "process": "/api/ocr/process",
            "crop_face": "/api/ocr/crop-face",
            "health": "/api/ocr/health"
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
