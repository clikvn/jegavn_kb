"""
Vercel Python API for JEGA Assistant - Vertex AI Integration
Replaces the Node.js implementation with Python GenAI SDK
"""

import json
import os
import logging
from typing import Dict, List, Any, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import aiohttp

# Load environment variables from .env file for local development
if not os.getenv('VERCEL_ENV'):
    try:
        from dotenv import load_dotenv
        load_dotenv()
        print("🔧 Loaded environment variables from .env file for local development")
    except ImportError:
        pass  # dotenv not available, skip

# Google GenAI SDK
from google import genai
from google.genai import types

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration constants
PROJECT_ID = 'gen-lang-client-0221178501'
LOCATION_ID = 'global'
DATASTORE_ID = 'projects/gen-lang-client-0221178501/locations/global/collections/default_collection/dataStores/jega-kb-chunks_1750402964245'

# Bubble API configuration
BUBBLE_ENDPOINTS = {
    'production': 'https://sondn-31149.bubbleapps.io/api/1.1/obj/SystemPrompt',
    'development': 'https://sondn-31149.bubbleapps.io/version-test/api/1.1/obj/SystemPrompt'
}
BUBBLE_API_KEY = os.getenv('BUBBLE_API_KEY')

if not BUBBLE_API_KEY:
    logger.error("❌ BUBBLE_API_KEY environment variable is required but not set")
    raise ValueError("BUBBLE_API_KEY environment variable must be set in Vercel Dashboard")

# Initialize FastAPI app
app = FastAPI()

# CORS configuration for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global client variable
client = None

def init_genai_client():
    """Initialize the GenAI client with proper credentials"""
    global client
    
    try:
        # For Vercel deployment - use environment variable
        if os.getenv('GOOGLE_CLOUD_CREDENTIALS'):
            logger.info("🔐 Using GOOGLE_CLOUD_CREDENTIALS environment variable")
            credentials_json = json.loads(os.getenv('GOOGLE_CLOUD_CREDENTIALS'))
            
            # Create temporary credentials file
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
                json.dump(credentials_json, f)
                os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = f.name
        
        elif os.path.exists('../jega-chatbot-service-key.json'):
            logger.info("🔐 Using local service account file")
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '../jega-chatbot-service-key.json'
        
        else:
            raise Exception("No Google Cloud credentials found")

        # Initialize GenAI client
        client = genai.Client(
            vertexai=True,
            project=PROJECT_ID,
            location=LOCATION_ID
        )
        
        logger.info("✅ GenAI client initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize GenAI client: {e}")
        return False

async def fetch_bubble_config() -> Dict[str, Any]:
    """Fetch configuration from Bubble database"""
    
    # Determine environment
    is_production = (
        os.getenv('VERCEL_ENV') == 'production' or 
        os.getenv('NODE_ENV') == 'production'
    )
    endpoint = BUBBLE_ENDPOINTS['production'] if is_production else BUBBLE_ENDPOINTS['development']
    
    logger.info(f"🔧 Fetching config from: {endpoint}")
    
    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                'Authorization': f'Bearer {BUBBLE_API_KEY}',
                'Content-Type': 'application/json',
                'User-Agent': 'JEGA-Knowledge-Base-Python/1.0'
            }
            
            async with session.get(endpoint, headers=headers) as response:
                if response.status != 200:
                    raise HTTPException(status_code=503, detail=f"Bubble API error: {response.status}")
                
                data = await response.json()
                
                # Parse Bubble response
                if not data.get('response', {}).get('results'):
                    raise HTTPException(status_code=503, detail="No configuration found")
                
                bubble_config = data['response']['results'][0]
                
                # Extract configuration
                config = {
                    'ai_model': bubble_config.get('ai_model'),
                    'system_prompt': bubble_config.get('prompt', '').replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&'),
                    'temperature': float(bubble_config.get('tempature', 0.5)),
                    'top_p': float(bubble_config.get('top-p', 0.9)),
                    'max_output_tokens': int(bubble_config.get('max_output_tokens', 10000))
                }
                
                # Validate required fields
                required = ['ai_model', 'system_prompt', 'temperature', 'top_p', 'max_output_tokens']
                missing = [field for field in required if not config.get(field)]
                
                if missing:
                    raise HTTPException(status_code=503, detail=f"Missing config: {missing}")
                
                logger.info(f"✅ Config loaded: {config['ai_model']}")
                return config
                
    except Exception as e:
        logger.error(f"❌ Bubble config error: {e}")
        raise HTTPException(status_code=503, detail=f"Config error: {str(e)}")

def format_chat_history(chat_history: Optional[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    """Convert chat history to GenAI format"""
    if not chat_history:
        return []
    
    contents = []
    for message in chat_history:
        role = 'user' if message.get('sender') == 'user' else 'model'
        contents.append({
            'role': role,
            'parts': [{'text': message.get('text', '')}]
        })
    
    return contents

def process_response_text(text: str) -> str:
    """Process response text with link conversion"""
    if not text:
        return ""
    
    # Convert literal \n to actual newlines
    processed = text.replace('\\n', '\n')
    
    # Convert [text](url) patterns to clickable links
    import re
    pattern = r'\[([^\]]*)\]\((https?://[^\)]+)\)'
    processed = re.sub(pattern, r'<a href="\2" target="_blank" rel="noopener noreferrer">\1</a>', processed)
    
    return processed

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "JEGA Assistant Python API", "status": "ready"}

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "JEGA Assistant Python API"}

@app.get("/api/config")
async def get_chat_config():
    """Get chat configuration for frontend"""
    try:
        # Fetch full config from Bubble
        config = await fetch_bubble_config()
        
        # Return only the chat settings the frontend needs
        chat_config = {
            "config": {
                "chatSettings": {
                    "conversationMemory": 10,  # Default conversation memory
                    "userHistory": 100  # Default user history limit
                }
            }
        }
        
        logger.info("✅ Chat config served to frontend")
        return chat_config
        
    except Exception as e:
        logger.error(f"❌ Config endpoint error: {e}")
        raise HTTPException(status_code=503, detail=f"Configuration error: {str(e)}")

@app.post("/api/vertex-ai")
async def vertex_ai_chat(request: Request):
    """Main chat endpoint with streaming"""
    
    # Initialize client if needed
    if not client:
        if not init_genai_client():
            raise HTTPException(status_code=503, detail="GenAI client not available")
    
    try:
        # Parse request
        body = await request.json()
        message = body.get('message', '').strip()
        chat_history = body.get('chatHistory', [])
        
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        # Fetch config
        config = await fetch_bubble_config()
        
        # Format chat history
        contents = format_chat_history(chat_history)
        contents.append({
            'role': 'user',
            'parts': [{'text': message}]
        })
        
        # Prepare tools and settings
        tools = [
            types.Tool(
                retrieval=types.Retrieval(
                    vertex_ai_search=types.VertexAISearch(
                        datastore=DATASTORE_ID
                    )
                )
            )
        ]
        
        safety_settings = [
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold=types.HarmBlockThreshold.OFF
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold=types.HarmBlockThreshold.OFF
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold=types.HarmBlockThreshold.OFF
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold=types.HarmBlockThreshold.OFF
            )
        ]
        
        logger.info(f"🚀 Generating with {config['ai_model']}")
        
        # Streaming generator
        async def generate_stream():
            try:
                full_response = ""
                chunk_count = 0
                sources = []
                grounding_metadata = None
                usage_metadata = None
                
                # Send connection confirmation
                yield f"data: {json.dumps({'type': 'connected'})}\n\n"
                
                # Generate streaming response
                for chunk in client.models.generate_content_stream(
                    model=config['ai_model'],
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=types.Content(
                            parts=[types.Part(text=config['system_prompt'])],
                            role='user'
                        ),
                        temperature=config['temperature'],
                        max_output_tokens=config['max_output_tokens'],
                        top_p=config['top_p'],
                        seed=0,
                        tools=tools,
                        safety_settings=safety_settings
                    )
                ):
                    chunk_count += 1
                    
                    # Extract text
                    if hasattr(chunk, 'candidates') and chunk.candidates:
                        candidate = chunk.candidates[0]
                        
                        if hasattr(candidate, 'content') and candidate.content:
                            if hasattr(candidate.content, 'parts') and candidate.content.parts:
                                for part in candidate.content.parts:
                                    if hasattr(part, 'text') and part.text:
                                        text_chunk = part.text
                                        full_response += text_chunk
                                        
                                        # Send chunk
                                        chunk_data = {
                                            'type': 'chunk',
                                            'content': text_chunk
                                        }
                                        yield f"data: {json.dumps(chunk_data)}\n\n"
                        
                        # Extract metadata safely
                        candidate_grounding = getattr(candidate, 'grounding_metadata', None)
                        if candidate_grounding:
                            grounding_metadata = candidate_grounding
                            logger.info(f"🔍 Grounding metadata found: {type(grounding_metadata)}")
                            logger.info(f"🔍 Grounding metadata attributes: {dir(grounding_metadata)}")
                            
                            # Safely check for grounding_chunks
                            chunks = getattr(grounding_metadata, 'grounding_chunks', None)
                            if chunks:
                                logger.info(f"🔍 Found {len(chunks)} grounding chunks")
                            else:
                                logger.info("ℹ️ No grounding_chunks in metadata")
                        else:
                            logger.info("ℹ️ No grounding_metadata returned in this chunk")
                    
                    # Safe extraction of usage metadata
                    chunk_usage = getattr(chunk, 'usage_metadata', None)
                    if chunk_usage:
                        usage_metadata = chunk_usage
                
                # Process sources from Vertex AI Search grounding - robust handling
                if grounding_metadata:
                    # More detailed debugging
                    chunks = getattr(grounding_metadata, 'grounding_chunks', None)
                    logger.info(f"🔍 grounding_chunks value: {chunks}")
                    logger.info(f"🔍 grounding_chunks type: {type(chunks)}")
                    
                    # Try multiple ways to access grounding data
                    if chunks is not None:
                        logger.info(f"🔍 Processing {len(chunks)} grounding chunks")
                        for idx, chunk_info in enumerate(chunks):
                            try:
                                logger.info(f"🔍 Chunk {idx}: type={type(chunk_info)}")
                                
                                # Safe extraction of retrieved_context
                                retrieved_context = getattr(chunk_info, 'retrieved_context', None)
                                if retrieved_context:
                                    # Safely extract title and text
                                    title = getattr(retrieved_context, 'title', None)
                                    text = getattr(retrieved_context, 'text', '')
                                    
                                    if text:  # Only process if we have content
                                        # Extract source URL from text content using regex
                                        import re
                                        source_match = re.search(r'source:\s*(https?://[^\s\n]+)', text)
                                        source_uri = source_match.group(1) if source_match else '/docs/'
                                        
                                        # Create display title
                                        display_title = title if title else text[:50] + '...'
                                        if not display_title or display_title == 'JEGA Knowledge Base':
                                            display_title = text[:50] + '...'
                                        
                                        # Extract description for snippet
                                        desc_match = re.search(r'description:\s*([^\n]+)', text)
                                        snippet = desc_match.group(1) if desc_match else text[:200] + '...'
                                        
                                        sources.append({
                                            'title': display_title,
                                            'displayTitle': display_title,
                                            'url': source_uri,
                                            'uri': source_uri,
                                            'snippet': snippet
                                        })
                                        logger.info(f"📄 Added source: {display_title} (URI: {source_uri})")
                                    else:
                                        logger.warning(f"⚠️ Chunk {idx}: retrieved_context has no text content")
                                
                                # Safe extraction of web results
                                else:
                                    web = getattr(chunk_info, 'web', None)
                                    if web:
                                        web_title = getattr(web, 'title', 'Unknown')
                                        web_uri = getattr(web, 'uri', '#')
                                        sources.append({
                                            'title': web_title,
                                            'displayTitle': web_title,
                                            'url': web_uri,
                                            'uri': web_uri,
                                            'snippet': ''
                                        })
                                        logger.info(f"🌐 Added web source: {web_uri}")
                                    else:
                                        logger.warning(f"⚠️ Chunk {idx}: No retrieved_context or web found")
                            
                            except Exception as e:
                                logger.warning(f"⚠️ Failed to process grounding chunk {idx}: {e}")
                                continue
                    else:
                        logger.info("ℹ️ No grounding chunks found in metadata")
                        
                        # Try alternative grounding data sources
                        alt_attrs = ['grounding_supports', 'retrieval_metadata', 'search_entry_point']
                        for attr in alt_attrs:
                            alt_data = getattr(grounding_metadata, attr, None)
                            if alt_data:
                                logger.info(f"🔍 Found alternative grounding data in {attr}: {type(alt_data)}")
                                logger.info(f"🔍 {attr} content: {alt_data}")
                                break
                else:
                    logger.info("ℹ️ No grounding metadata available for source processing")
                
                # Process final response
                processed_response = process_response_text(full_response)
                
                # Send completion
                final_data = {
                    'type': 'complete',
                    'model': config['ai_model'],
                    'sources': sources,
                    'groundingMetadata': {
                        'has_grounding': bool(grounding_metadata),
                        'sources_found': len(sources)
                    },
                    'usageMetadata': {
                        'prompt_tokens': getattr(usage_metadata, 'prompt_token_count', 0) if usage_metadata else 0,
                        'completion_tokens': getattr(usage_metadata, 'candidates_token_count', 0) if usage_metadata else 0,
                        'total_tokens': getattr(usage_metadata, 'total_token_count', 0) if usage_metadata else 0
                    } if usage_metadata else {
                        'prompt_tokens': 0,
                        'completion_tokens': 0,
                        'total_tokens': 0
                    },
                    'fullResponse': processed_response,
                    'totalChunks': chunk_count
                }
                
                yield f"data: {json.dumps(final_data)}\n\n"
                yield f"data: [DONE]\n\n"
                
                logger.info(f"✅ Complete: {chunk_count} chunks, {len(sources)} sources")
                
            except Exception as e:
                logger.error(f"❌ Stream error: {e}")
                error_data = {
                    'type': 'error',
                    'error': str(e)
                }
                yield f"data: {json.dumps(error_data)}\n\n"
                yield f"data: [DONE]\n\n"
        
        # Return streaming response
        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Initialize on startup
init_genai_client()

# Local development server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001, log_level="info")
