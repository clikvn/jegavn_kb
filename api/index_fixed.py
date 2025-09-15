#!/usr/bin/env python3
"""
Fixed version of the Flowise integration
"""

import os
import json
import logging
import aiohttp
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
from dotenv import load_dotenv
import google.generativeai as genai
from google.genai import types
import re

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="JEGA Knowledge Base API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Google GenAI
try:
    if os.path.exists("service-account.json"):
        genai.configure(credentials="service-account.json")
        logger.info("🔐 Using local service account file (current directory)")
    else:
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        logger.info("🔐 Using API key from environment")
    
    model = genai.GenerativeModel('gemini-1.5-flash')
    logger.info("✅ GenAI client initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize GenAI: {e}")
    model = None

@app.get("/")
async def root():
    return {"message": "JEGA Knowledge Base API is running!"}

@app.post("/api/flowise")
async def flowise_chat(request: dict):
    """Handle Flowise chat requests - simple non-streaming fallback"""
    try:
        # Handle encoding issues with Vietnamese text
        try:
            question = request.get("question", "")
        except UnicodeDecodeError:
            # Try to decode with different encoding
            question = request.get("question", "").encode('latin1').decode('utf-8')
        
        if not question:
            raise HTTPException(status_code=400, detail="Question is required")
        
        logger.info(f"🔍 [FLOWISE] Processing question: '{question[:50]}...'")
        
        # Flowise API configuration - no need for Bubble config
        flowise_url = "https://langchain-ui.clik.vn/api/v1/prediction/40f982a3-ad4f-4df4-9999-8033ec570672"
        
        # Get session ID from request if available
        session_id = request.get("sessionId", "")
        chat_id = request.get("chatId", "")
        uploads = request.get("uploads", [])
        
        # Simple payload - include session info if available
        payload = {
            "question": question,
            "streaming": False  # Use non-streaming for fallback
        }
        
        # Add session context if available
        if session_id:
            payload["sessionId"] = session_id
        if chat_id:
            payload["chatId"] = chat_id
            
        # Add image uploads if provided
        if uploads:
            # Convert uploads to the format expected by Flowise (based on official example)
            flowise_uploads = []
            for upload in uploads:
                # Ensure data is in the correct format: data:mime_type;base64,encoded_data
                data = upload.get('data', '')
                if not data.startswith('data:'):
                    # If data doesn't have the data: prefix, add it
                    mime_type = upload.get('mime', 'image/png')
                    data = f"data:{mime_type};base64,{data}"
                
                flowise_upload = {
                    "data": data,
                    "type": "file",  # Flowise expects "file" not "image"
                    "name": upload.get('name', ''),
                    "mime": upload.get('mime', 'image/png')
                }
                flowise_uploads.append(flowise_upload)
            
            payload["uploads"] = flowise_uploads
            logger.info(f"🔍 [FLOWISE] Processing {len(uploads)} image upload(s)")
            for i, upload in enumerate(uploads):
                logger.info(f"🔍 [FLOWISE] Upload {i+1}: type={upload.get('type')}, name={upload.get('name')}, mime={upload.get('mime')}, data_length={len(upload.get('data', ''))}")
                logger.info(f"🔍 [FLOWISE] CONVERTED: Original type='{upload.get('type')}' -> Flowise type='file'")
                logger.info(f"🔍 [FLOWISE] Flowise upload {i+1}: {flowise_uploads[i]}")
        
        logger.info(f"🔍 Sending query to Flowise: {question[:50]}... (streaming: False)")
        logger.info(f"🔍 [FLOWISE PAYLOAD] Full payload being sent: {json.dumps(payload, indent=2)[:1000]}...")
        
        # Make request to Flowise
        timeout = aiohttp.ClientTimeout(total=120)  # 2 minutes timeout
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(flowise_url, json=payload) as response:
                if response.status != 200:
                    logger.error(f"❌ Flowise API error: {response.status}")
                    return {
                        "success": False,
                        "response": "Flowise service temporarily unavailable",
                        "metadata": {"error": f"HTTP {response.status}"}
                    }
                
                response_text = await response.text()
                logger.info(f"🔍 [FLOWISE DEBUG] Raw response length: {len(response_text)}")
                
                # Parse JSON response
                try:
                    data = json.loads(response_text)
                    if "text" in data:
                        actual_content = data["text"]
                        metadata = {
                            'question': question,
                            'chatId': data.get('chatId', ''),
                            'chatMessageId': data.get('chatMessageId', ''),
                            'sessionId': data.get('sessionId', ''),
                            'timestamp': data.get('timestamp', '')
                        }
                        
                        logger.info(f"✅ [FLOWISE] Successfully extracted content from JSON response")
                        logger.info(f"🔍 [FLOWISE] Session metadata - chatId: {metadata['chatId'][:8]}..., chatMessageId: {metadata['chatMessageId'][:8]}...")
                        
                        return {
                            "success": True,
                            "response": actual_content,
                            "metadata": metadata
                        }
                    else:
                        logger.warning("⚠️ [FLOWISE] No 'text' field found in JSON response")
                        return {
                            "success": False,
                            "response": "No content found in Flowise response",
                            "metadata": {"error": "No text field in response"}
                        }
                except json.JSONDecodeError:
                    logger.warning("⚠️ [FLOWISE] Response is not valid JSON, treating as text")
                    return {
                        "success": True,
                        "response": response_text,
                        "metadata": {"question": question}
                    }
                
    except aiohttp.ClientError as e:
        logger.error(f"❌ Flowise connection error: {e}")
        return {
            "success": False,
            "response": "Flowise service temporarily unavailable",
            "metadata": {"error": str(e)}
        }
    except Exception as e:
        logger.error(f"❌ Flowise error: {e}")
        return {
            "success": False,
            "response": "Flowise service temporarily unavailable",
            "metadata": {"error": str(e)}
        }

@app.post("/api/flowise/stream")
async def flowise_stream(request: dict):
    """Handle Flowise streaming requests - real-time streaming to frontend"""
    try:
        # Handle encoding issues with Vietnamese text
        try:
            question = request.get("question", "")
        except UnicodeDecodeError:
            # Try to decode with different encoding
            question = request.get("question", "").encode('latin1').decode('utf-8')
        
        if not question:
            raise HTTPException(status_code=400, detail="Question is required")
        
        logger.info(f"🔍 [FLOWISE STREAM] Processing question: '{question[:50]}...'")
        
        # Flowise API configuration - no need for Bubble config
        flowise_url = "https://langchain-ui.clik.vn/api/v1/prediction/40f982a3-ad4f-4df4-9999-8033ec570672"
        
        # Get session ID from request if available
        session_id = request.get("sessionId", "")
        chat_id = request.get("chatId", "")
        uploads = request.get("uploads", [])
        
        # Simple payload - include session info if available
        payload = {
            "question": question,
            "streaming": True
        }
        
        # Add session context if available
        if session_id:
            payload["sessionId"] = session_id
        if chat_id:
            payload["chatId"] = chat_id
            
        # Add image uploads if provided
        if uploads:
            # Convert uploads to the format expected by Flowise (based on official example)
            flowise_uploads = []
            for upload in uploads:
                # Ensure data is in the correct format: data:mime_type;base64,encoded_data
                data = upload.get('data', '')
                if not data.startswith('data:'):
                    # If data doesn't have the data: prefix, add it
                    mime_type = upload.get('mime', 'image/png')
                    data = f"data:{mime_type};base64,{data}"
                
                flowise_upload = {
                    "data": data,
                    "type": "file",  # Flowise expects "file" not "image"
                    "name": upload.get('name', ''),
                    "mime": upload.get('mime', 'image/png')
                }
                flowise_uploads.append(flowise_upload)
            
            payload["uploads"] = flowise_uploads
            logger.info(f"🔍 [FLOWISE STREAM] Processing {len(uploads)} image upload(s)")
            for i, upload in enumerate(uploads):
                logger.info(f"🔍 [FLOWISE STREAM] Upload {i+1}: type={upload.get('type')}, name={upload.get('name')}, mime={upload.get('mime')}, data_length={len(upload.get('data', ''))}")
                logger.info(f"🔍 [FLOWISE STREAM] Flowise upload {i+1}: {flowise_uploads[i]}")
        
        logger.info(f"🔍 [FLOWISE STREAM] Sending query to Flowise: {question[:50]}... (streaming: True)")
        logger.info(f"🔍 [FLOWISE STREAM PAYLOAD] Full payload being sent: {json.dumps(payload, indent=2)[:1000]}...")
        
        async def generate_stream():
            """Generator function for streaming response"""
            timeout = aiohttp.ClientTimeout(total=120)  # 2 minutes timeout
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(flowise_url, json=payload) as response:
                    if response.status != 200:
                        logger.error(f"❌ [FLOWISE STREAM] API error: {response.status}")
                        yield f"data: {json.dumps({'error': f'Flowise API error: {response.status}'})}\n\n"
                        return
                    
                    # Stream the response in chunks to avoid "Chunk too big" error
                    async for chunk in response.content.iter_chunked(1024):  # 1KB chunks
                        line_str = chunk.decode('utf-8', errors='replace')
                        
                        # Forward the chunk to frontend
                        yield line_str
        
        # Return streaming response
        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            }
        )
        
    except Exception as e:
        logger.error(f"❌ [FLOWISE STREAM] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat(request: dict):
    """Handle chat requests with Vertex AI"""
    try:
        question = request.get("question", "")
        if not question:
            raise HTTPException(status_code=400, detail="Question is required")
        
        logger.info(f"🔍 [VERTEX AI] Processing question: '{question[:50]}...'")
        
        if not model:
            raise HTTPException(status_code=500, detail="GenAI model not initialized")
        
        # Generate response using Vertex AI
        response = model.generate_content(question)
        
        return {
            "success": True,
            "response": response.text,
            "metadata": {"model": "gemini-1.5-flash"}
        }
        
    except Exception as e:
        logger.error(f"❌ Vertex AI error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3002)
