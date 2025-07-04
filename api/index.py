"""
Vercel Python API for JEGA Assistant - Vertex AI Integration
Replaces the Node.js implementation with Python GenAI SDK
"""

import json
import os
import logging
from datetime import datetime
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
            logger.info("🔐 Using local service account file (parent directory)")
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '../jega-chatbot-service-key.json'
        
        elif os.path.exists('./jega-chatbot-service-key.json'):
            logger.info("🔐 Using local service account file (current directory)")
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = './jega-chatbot-service-key.json'
        
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
                
                # Extract configuration STRICTLY from Bubble (no fallbacks)
                config = {
                    'record_id': bubble_config.get('_id'),
                    'ai_model': bubble_config.get('ai_model'),
                    'system_prompt': bubble_config.get('prompt'),
                    'temperature': bubble_config.get('tempature'),
                    'top_p': bubble_config.get('top-p'),
                    'max_output_tokens': bubble_config.get('max_output_tokens'),
                    'conversation_memory': bubble_config.get('conversation_memory'),
                    'user_history': bubble_config.get('user_history')
                }
                # Validate required fields (all must be present and not None/empty)
                required = ['ai_model', 'system_prompt', 'temperature', 'top_p', 'max_output_tokens', 'conversation_memory', 'user_history']
                missing = [field for field in required if config.get(field) in [None, '']]
                if missing:
                    raise HTTPException(status_code=503, detail=f"Missing config: {missing}")
                # Convert numeric fields to proper types after validation
                config['temperature'] = float(config['temperature'])
                config['top_p'] = float(config['top_p'])
                config['max_output_tokens'] = int(config['max_output_tokens'])
                config['conversation_memory'] = int(config['conversation_memory'])
                config['user_history'] = int(config['user_history'])
                logger.info(f"✅ Config loaded: {config['ai_model']}")
                return config
                
    except Exception as e:
        logger.error(f"❌ Bubble config error: {e}")
        raise HTTPException(status_code=503, detail=f"Config error: {str(e)}")

async def update_bubble_config(config_updates: Dict[str, Any]) -> Dict[str, Any]:
    """Update configuration in Bubble database"""
    
    # First, get the current config to get the record ID
    current_config = await fetch_bubble_config()
    record_id = current_config.get('record_id')
    
    if not record_id:
        raise HTTPException(status_code=503, detail="No record ID found for update")
    
    # Determine environment
    is_production = (
        os.getenv('VERCEL_ENV') == 'production' or 
        os.getenv('NODE_ENV') == 'production'
    )
    base_endpoint = BUBBLE_ENDPOINTS['production'] if is_production else BUBBLE_ENDPOINTS['development']
    update_endpoint = f"{base_endpoint}/{record_id}"
    
    logger.info(f"🔧 Updating config at: {update_endpoint}")
    
    # Convert frontend config format to Bubble field format
    bubble_updates = {}
    
    if 'systemPrompt' in config_updates:
        # Store raw text without HTML entity encoding to preserve < > characters
        bubble_updates['prompt'] = config_updates['systemPrompt']
    
    if 'aiModel' in config_updates:
        bubble_updates['ai_model'] = config_updates['aiModel']
    
    if 'modelParameters' in config_updates:
        params = config_updates['modelParameters']
        if 'temperature' in params:
            bubble_updates['tempature'] = str(params['temperature'])  # Convert to string for Bubble
        if 'topP' in params:
            bubble_updates['top-p'] = str(params['topP'])  # Convert to string for Bubble
        if 'maxOutputTokens' in params:
            bubble_updates['max_output_tokens'] = str(params['maxOutputTokens'])  # Convert to string for Bubble
    
    if 'chatSettings' in config_updates:
        settings = config_updates['chatSettings']
        if 'conversationMemory' in settings:
            bubble_updates['conversation_memory'] = str(settings['conversationMemory'])  # Convert to string for Bubble
        if 'userHistory' in settings:
            bubble_updates['user_history'] = str(settings['userHistory'])  # Convert to string for Bubble
    
    logger.info(f"📝 Bubble update payload: {list(bubble_updates.keys())}")
    
    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                'Authorization': f'Bearer {BUBBLE_API_KEY}',
                'Content-Type': 'application/json',
                'User-Agent': 'JEGA-Knowledge-Base-Python/1.0'
            }
            
            async with session.patch(update_endpoint, headers=headers, json=bubble_updates) as response:
                if response.status not in [200, 204]:
                    error_text = await response.text()
                    logger.error(f"❌ Bubble update failed: {response.status} - {error_text}")
                    raise HTTPException(status_code=503, detail=f"Bubble API update error: {response.status}")
                
                logger.info(f"✅ Config updated in Bubble successfully")
                
                # Return the updated configuration
                return await fetch_bubble_config()
                
    except Exception as e:
        logger.error(f"❌ Bubble update error: {e}")
        raise HTTPException(status_code=503, detail=f"Config update error: {str(e)}")

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
        
        # Return the complete configuration from Bubble in expected frontend format
        chat_config = {
            "config": {
                "systemPrompt": config.get('system_prompt'),
                "aiModel": config.get('ai_model'),
                "modelParameters": {
                    "temperature": config.get('temperature'),
                    "topP": config.get('top_p'),
                    "maxOutputTokens": config.get('max_output_tokens')
                },
                "chatSettings": {
                    "conversationMemory": config.get('conversation_memory'),  # From Bubble
                    "userHistory": config.get('user_history')  # From Bubble 
                }
            }
        }
        
        logger.info(f"✅ Full config served to frontend: {config.get('ai_model')}")
        
        # Add timestamp for cache validation
        chat_config["timestamp"] = datetime.now().isoformat()
        
        return chat_config
        
    except Exception as e:
        logger.error(f"❌ Config endpoint error: {e}")
        raise HTTPException(status_code=503, detail=f"Configuration error: {str(e)}")

@app.post("/api/config")
async def update_chat_config(request: Request):
    """Update chat configuration in Bubble database"""
    try:
        # Parse the request body
        body = await request.json()
        config_updates = body.get('config', {})
        
        if not config_updates:
            raise HTTPException(status_code=400, detail="No configuration updates provided")
        
        logger.info(f"📝 Config update request: {list(config_updates.keys())}")
        
        # Update the configuration in Bubble
        updated_config = await update_bubble_config(config_updates)
        
        # Return the updated configuration in the same format as GET
        chat_config = {
            "config": {
                "systemPrompt": updated_config.get('system_prompt'),
                "aiModel": updated_config.get('ai_model'),
                "modelParameters": {
                    "temperature": updated_config.get('temperature'),
                    "topP": updated_config.get('top_p'),
                    "maxOutputTokens": updated_config.get('max_output_tokens')
                },
                "chatSettings": {
                    "conversationMemory": updated_config.get('conversation_memory'),
                    "userHistory": updated_config.get('user_history')
                }
            }
        }
        
        # Add success metadata
        chat_config["success"] = True
        chat_config["message"] = "Configuration updated successfully in Bubble database"
        chat_config["timestamp"] = datetime.now().isoformat()
        
        logger.info(f"✅ Config update completed successfully")
        return chat_config
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        logger.error(f"❌ Config update error: {e}")
        raise HTTPException(status_code=500, detail=f"Configuration update error: {str(e)}")

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
        
        # Check if the current message is already in chat history to avoid duplication
        is_message_in_history = any(
            msg.get('sender') == 'user' and msg.get('text', '').strip() == message
            for msg in chat_history
        )
        
        # Only append if not already in history
        if not is_message_in_history:
            contents.append({
                'role': 'user',
                'parts': [{'text': message}]
            })
        
        # Debug: Log the exact payload being sent to Gemini
        logger.info(f"🔍 [DEBUG] User message: '{message}'")
        logger.info(f"🔍 [DEBUG] Chat history length: {len(chat_history)}")
        logger.info(f"🔍 [DEBUG] Message in history: {is_message_in_history}")
        logger.info(f"🔍 [DEBUG] Contents payload: {json.dumps(contents, ensure_ascii=False, indent=2)}")
        
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
        
        # Add thinking configuration
        thinking_config = types.ThinkingConfig(
            thinking_budget=-1,  # Dynamic thinking - model decides
            include_thoughts=True  # Expose thoughts in response
        )
        
        logger.info(f"🚀 Generating with {config['ai_model']}")
        
        # Streaming generator
        async def generate_stream():
            try:
                full_response = ""
                chunk_count = 0
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
                            role='model'
                        ),
                        temperature=config['temperature'],
                        max_output_tokens=config['max_output_tokens'],
                        top_p=config['top_p'],
                        seed=42,
                        tools=tools,
                        safety_settings=safety_settings,
                        thinking_config=thinking_config
                    )
                ):
                    chunk_count += 1
                    chunk_timestamp = datetime.now().isoformat()
                    logger.info(f"📦 [STREAM] Received chunk {chunk_count} from Gemini at {chunk_timestamp}")
                    
                    # Extract text and thoughts
                    if hasattr(chunk, 'candidates') and chunk.candidates:
                        candidate = chunk.candidates[0]
                        
                        if hasattr(candidate, 'content') and candidate.content:
                            if hasattr(candidate.content, 'parts') and candidate.content.parts:
                                logger.info(f"🔍 [DEBUG] Processing {len(candidate.content.parts)} parts in chunk {chunk_count}")
                                for part in candidate.content.parts:
                                    if hasattr(part, 'text') and part.text:
                                        text_chunk = part.text
                                        
                                        # Debug: Log part attributes
                                        part_attrs = [attr for attr in dir(part) if not attr.startswith('_')]
                                        logger.info(f"🔍 [DEBUG] Part attributes: {part_attrs}")
                                        logger.info(f"🔍 [DEBUG] Part has 'thought' attribute: {hasattr(part, 'thought')}")
                                        if hasattr(part, 'thought'):
                                            logger.info(f"🔍 [DEBUG] Part.thought value: {part.thought}")
                                        
                                        # Check if this is a thought or final answer - use direct attribute access like in the example
                                        is_thought = hasattr(part, 'thought') and part.thought
                                        
                                        if is_thought:
                                            # Send thought chunk
                                            send_timestamp = datetime.now().isoformat()
                                            logger.info(f"🧠 [THOUGHT] Sending thought chunk to frontend at {send_timestamp}: {text_chunk[:50]}...")
                                            thought_data = {
                                                'type': 'thought',
                                                'content': text_chunk,
                                                'timestamp': send_timestamp
                                            }
                                            yield f"data: {json.dumps(thought_data)}\n\n"
                                        else:
                                            # Send regular response chunk
                                            full_response += text_chunk
                                            send_timestamp = datetime.now().isoformat()
                                            logger.info(f"📝 [CHUNK] Sending answer chunk to frontend at {send_timestamp}: {text_chunk[:50]}...")
                                            chunk_data = {
                                                'type': 'chunk',
                                                'content': text_chunk,
                                                'timestamp': send_timestamp
                                            }
                                            yield f"data: {json.dumps(chunk_data)}\n\n"
                        

                    
                    # Safe extraction of usage metadata
                    chunk_usage = getattr(chunk, 'usage_metadata', None)
                    if chunk_usage:
                        usage_metadata = chunk_usage
                

                
                # Process final response
                processed_response = process_response_text(full_response)
                
                # Send completion
                final_data = {
                    'type': 'complete',
                    'model': config['ai_model'],
                    'usageMetadata': {
                        'prompt_tokens': getattr(usage_metadata, 'prompt_token_count', 0) if usage_metadata else 0,
                        'completion_tokens': getattr(usage_metadata, 'candidates_token_count', 0) if usage_metadata else 0,
                        'thoughts_tokens': getattr(usage_metadata, 'thoughts_token_count', 0) if usage_metadata else 0,
                        'total_tokens': getattr(usage_metadata, 'total_token_count', 0) if usage_metadata else 0
                    } if usage_metadata else {
                        'prompt_tokens': 0,
                        'completion_tokens': 0,
                        'thoughts_tokens': 0,
                        'total_tokens': 0
                    },
                    'fullResponse': processed_response,
                    'totalChunks': chunk_count
                }
                
                yield f"data: {json.dumps(final_data)}\n\n"
                yield f"data: [DONE]\n\n"
                
                logger.info(f"✅ Complete: {chunk_count} chunks")
                
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
