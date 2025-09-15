"""
Vercel Python API for JEGA Assistant - Vertex AI Integration
Replaces the Node.js implementation with Python GenAI SDK
"""

import json
import os
import logging
import asyncio
import re
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
DATASTORE_ID = 'projects/gen-lang-client-0221178501/locations/global/collections/default_collection/dataStores/jega-chunks-v2'

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

@app.get("/api/feedback-schema")
async def get_feedback_schema():
    """Get the schema of JEGA_Feedbacks table from Bubble"""
    try:
        # Determine environment
        is_production = (
            os.getenv('VERCEL_ENV') == 'production' or 
            os.getenv('NODE_ENV') == 'production'
        )
        base_endpoint = BUBBLE_ENDPOINTS['production'] if is_production else BUBBLE_ENDPOINTS['development']
        
        # Replace SystemPrompt with JEGA_Feedbacks in the endpoint
        feedback_endpoint = base_endpoint.replace('SystemPrompt', 'JEGA_Feedbacks')
        
        logger.info(f"🔍 Fetching feedback schema from: {feedback_endpoint}")
        
        async with aiohttp.ClientSession() as session:
            headers = {
                'Authorization': f'Bearer {BUBBLE_API_KEY}',
                'Content-Type': 'application/json',
                'User-Agent': 'JEGA-Knowledge-Base-Python/1.0'
            }
            
            # Try multiple approaches to get the data
            # 1. First try with no parameters
            logger.info(f"🔍 Attempting to fetch data from: {feedback_endpoint}")
            async with session.get(feedback_endpoint, headers=headers) as response:
                logger.info(f"📡 Response status: {response.status}")
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"✅ Feedback data retrieved: {data}")
                    
                    # 2. Try with different parameters
                    params_variations = [
                        {'limit': 50},
                        {'limit': 100},
                        {'sort_field': 'Created Date'},
                        {'sort_direction': 'desc'},
                        {'constraints': '[]'},  # Empty constraints
                        {'cursor': 0}
                    ]
                    
                    for params in params_variations:
                        try:
                            logger.info(f"🔍 Trying params: {params}")
                            async with session.get(feedback_endpoint, headers=headers, params=params) as param_response:
                                if param_response.status == 200:
                                    param_data = await param_response.json()
                                    logger.info(f"✅ Data with params {params}: {param_data}")
                                    if param_data.get('response', {}).get('results'):
                                        return {
                                            "status": "success",
                                            "endpoint": feedback_endpoint,
                                            "schema_sample": param_data,
                                            "working_params": params,
                                            "message": "Retrieved JEGA_Feedbacks data successfully"
                                        }
                        except Exception as param_error:
                            logger.info(f"ℹ️ Params {params} failed: {param_error}")
                    
                    # 3. Try to get table metadata by checking if we can create a record
                    logger.info(f"🔍 Attempting to create a test record to understand table structure")
                    test_data = {
                        "Created Date": datetime.now().isoformat(),
                        "Modified Date": datetime.now().isoformat()
                    }
                    
                    try:
                        async with session.post(feedback_endpoint, headers=headers, json=test_data) as post_response:
                            post_status = post_response.status
                            post_text = await post_response.text()
                            logger.info(f"📝 Test record creation response: {post_status} - {post_text}")
                            
                            if post_status in [200, 201]:
                                return {
                                    "status": "success",
                                    "endpoint": feedback_endpoint,
                                    "schema_sample": data,
                                    "test_record": post_text,
                                    "message": "Retrieved JEGA_Feedbacks schema and created test record"
                                }
                            else:
                                return {
                                    "status": "success",
                                    "endpoint": feedback_endpoint,
                                    "schema_sample": data,
                                    "test_creation_error": post_text,
                                    "message": f"Retrieved JEGA_Feedbacks schema (test creation failed with {post_status})"
                                }
                    except Exception as post_error:
                        logger.info(f"ℹ️ Test record creation failed: {post_error}")
                        return {
                            "status": "success",
                            "endpoint": feedback_endpoint,
                            "schema_sample": data,
                            "message": "Retrieved JEGA_Feedbacks schema (test creation failed)"
                        }
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Bubble API error: {response.status} - {error_text}")
                    return {
                        "status": "error",
                        "endpoint": feedback_endpoint,
                        "error": f"Bubble API error: {response.status}",
                        "details": error_text
                    }
                    
    except Exception as e:
        logger.error(f"❌ Feedback schema error: {e}")
        return {
            "status": "error",
            "error": str(e),
            "message": "Failed to retrieve feedback schema"
        }

@app.post("/api/feedback")
async def create_feedback(request: Request):
    """Create a new feedback record in JEGA_Feedbacks table"""
    try:
        # Parse the request body
        body = await request.json()
        
        # Extract required fields (excluding ai_answer as requested)
        doc_id = body.get('doc_id')
        is_good = body.get('isGood')
        user_question = body.get('user_question', '')
        user_feedback = body.get('user_feedback', '')
        
        # Validate required fields
        if not doc_id:
            raise HTTPException(status_code=400, detail="doc_id is required")
        if is_good is None:
            raise HTTPException(status_code=400, detail="isGood is required (true/false)")
        
        # Determine environment
        is_production = (
            os.getenv('VERCEL_ENV') == 'production' or 
            os.getenv('NODE_ENV') == 'production'
        )
        base_endpoint = BUBBLE_ENDPOINTS['production'] if is_production else BUBBLE_ENDPOINTS['development']
        
        # Replace SystemPrompt with JEGA_Feedbacks in the endpoint
        feedback_endpoint = base_endpoint.replace('SystemPrompt', 'JEGA_Feedbacks')
        
        # Prepare the data for Bubble API (excluding ai_answer)
        # Note: Created Date and Modified Date are automatically managed by Bubble
        feedback_data = {
            "doc_id": doc_id,
            "isGood": is_good,
            "user_question": user_question,
            "user_feedback": user_feedback
        }
        
        logger.info(f"📝 Creating feedback record: {feedback_data}")
        
        async with aiohttp.ClientSession() as session:
            headers = {
                'Authorization': f'Bearer {BUBBLE_API_KEY}',
                'Content-Type': 'application/json',
                'User-Agent': 'JEGA-Knowledge-Base-Python/1.0'
            }
            
            # Create the feedback record
            async with session.post(feedback_endpoint, headers=headers, json=feedback_data) as response:
                if response.status in [200, 201]:
                    result = await response.json()
                    logger.info(f"✅ Feedback record created successfully: {result}")
                    return {
                        "status": "success",
                        "message": "Feedback record created successfully",
                        "record_id": result.get('id') or result.get('_id'),
                        "data": feedback_data
                    }
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Failed to create feedback record: {response.status} - {error_text}")
                    return {
                        "status": "error",
                        "error": f"Failed to create feedback record: {response.status}",
                        "details": error_text
                    }
                    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Create feedback error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create feedback: {str(e)}")

@app.post("/api/chat-rating")
async def create_chat_rating(request: Request):
    """Create a new chat rating record in JEGA_Chat_Ratings table"""
    try:
        # Parse the request body
        body = await request.json()
        
        # Extract required fields
        message_id = body.get('message_id')
        question = body.get('question', '')
        answer = body.get('answer', '')
        rating = body.get('rating')
        
        # Validate required fields
        if not message_id:
            raise HTTPException(status_code=400, detail="message_id is required")
        if rating is None:
            raise HTTPException(status_code=400, detail="rating is required (true/false)")
        
        # Determine environment
        is_production = (
            os.getenv('VERCEL_ENV') == 'production' or 
            os.getenv('NODE_ENV') == 'production'
        )
        base_endpoint = BUBBLE_ENDPOINTS['production'] if is_production else BUBBLE_ENDPOINTS['development']
        
        # Use existing JEGA_Feedbacks table but with chat-specific fields
        chat_rating_endpoint = base_endpoint.replace('SystemPrompt', 'JEGA_Feedbacks')
        
        # Prepare the data for Bubble API - use doc_id field for message_id
        rating_data = {
            "doc_id": f"chat_{message_id}",  # Prefix with 'chat_' to distinguish from document IDs
            "isGood": rating,  # Use existing isGood field
            "user_question": question,
            "ai_answer": answer,  # Store full AI answer in ai_answer field
            "user_feedback": None  # No user comment for chat ratings
        }
        
        logger.info(f"📝 Creating chat rating record: {rating_data}")
        
        async with aiohttp.ClientSession() as session:
            headers = {
                'Authorization': f'Bearer {BUBBLE_API_KEY}',
                'Content-Type': 'application/json',
                'User-Agent': 'JEGA-Knowledge-Base-Python/1.0'
            }
            
            # Create the chat rating record
            async with session.post(chat_rating_endpoint, headers=headers, json=rating_data) as response:
                if response.status in [200, 201]:
                    result = await response.json()
                    logger.info(f"✅ Chat rating record created successfully: {result}")
                    return {
                        "status": "success",
                        "message": "Chat rating record created successfully",
                        "record_id": result.get('id') or result.get('_id'),
                        "data": rating_data
                    }
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Failed to create chat rating record: {response.status} - {error_text}")
                    return {
                        "status": "error",
                        "error": f"Failed to create chat rating record: {response.status}",
                        "details": error_text
                    }
                    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Create chat rating error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create chat rating: {str(e)}")

@app.get("/api/feedback/{doc_id}")
async def get_feedback_stats(doc_id: str):
    """Get feedback statistics for a specific document"""
    try:
        # Determine environment
        is_production = (
            os.getenv('VERCEL_ENV') == 'production' or 
            os.getenv('NODE_ENV') == 'production'
        )
        base_endpoint = BUBBLE_ENDPOINTS['production'] if is_production else BUBBLE_ENDPOINTS['development']
        
        # Replace SystemPrompt with JEGA_Feedbacks in the endpoint
        feedback_endpoint = base_endpoint.replace('SystemPrompt', 'JEGA_Feedbacks')
        
        # For now, get all feedback and filter client-side to avoid timeout issues
        # TODO: Optimize this with proper constraints once Bubble API performance improves
        params = {
            'limit': 100
        }
        
        logger.info(f"📊 Getting feedback stats for doc_id: {doc_id}")
        
        async with aiohttp.ClientSession() as session:
            headers = {
                'Authorization': f'Bearer {BUBBLE_API_KEY}',
                'Content-Type': 'application/json',
                'User-Agent': 'JEGA-Knowledge-Base-Python/1.0'
            }
            
            async with session.get(feedback_endpoint, headers=headers, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    all_results = data.get('response', {}).get('results', [])
                    
                    # Filter results by doc_id (client-side filtering to avoid timeout)
                    # Handle both with and without leading slash
                    doc_id_variations = [doc_id]
                    if not doc_id.startswith('/'):
                        doc_id_variations.append(f"/{doc_id}")
                    else:
                        doc_id_variations.append(doc_id[1:])  # Remove leading slash
                    
                    results = [r for r in all_results if r.get('doc_id') in doc_id_variations]
                    
                    # Calculate statistics
                    total_feedback = len(results)
                    positive_feedback = len([r for r in results if r.get('isGood')])
                    negative_feedback = total_feedback - positive_feedback
                    
                    stats = {
                        "doc_id": doc_id,
                        "total_feedback": total_feedback,
                        "positive_feedback": positive_feedback,
                        "negative_feedback": negative_feedback,
                        "positive_percentage": round((positive_feedback / total_feedback * 100) if total_feedback > 0 else 0, 1)
                    }
                    
                    logger.info(f"✅ Feedback stats retrieved: {stats}")
                    return {
                        "status": "success",
                        "stats": stats,
                        "recent_feedback": results[:5]  # Return last 5 feedback items
                    }
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Failed to get feedback stats: {response.status} - {error_text}")
                    return {
                        "status": "error",
                        "error": f"Failed to get feedback stats: {response.status}",
                        "details": error_text
                    }
                    
    except Exception as e:
        logger.error(f"❌ Get feedback stats error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get feedback stats: {str(e)}")

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

@app.post("/api/flowise")
async def flowise_chat(request: Request):
    """Flowise chatbot endpoint with streaming support"""
    question = ""
    try:
        # Parse request with proper encoding handling
        try:
            body = await request.json()
        except UnicodeDecodeError as e:
            logger.error(f"❌ Unicode decode error: {e}")
            # Try to get raw body and decode with error handling
            raw_body = await request.body()
            body_text = raw_body.decode('utf-8', errors='replace')
            body = json.loads(body_text)
        
        question = body.get('question', '').strip()
        chat_history = body.get('chatHistory', [])
        streaming = body.get('streaming', True)  # Default to streaming

        if not question:
            raise HTTPException(status_code=400, detail="Question is required")
        
        # Log the question for debugging
        logger.info(f"🔍 [FLOWISE] Processing question: '{question[:100]}...'")

        # Flowise API configuration - use environment variables with fallbacks
        flowise_url = os.getenv('FLOWISE_URL', 'https://langchain-ui.clik.vn/api/v1/prediction/4460e8a3-ff9e-4eb2-be18-cdf1ae791201')
        flowise_api_key = os.getenv('FLOWISE_API_KEY', 'your-flowise-api-key')
        
        # Log configuration status
        if not flowise_url or flowise_url == 'http://localhost:3000/api/v1/prediction/your-flow-id':
            logger.warning("⚠️ Using default Flowise URL - please set FLOWISE_URL environment variable")
        if not flowise_api_key or flowise_api_key == 'your-flowise-api-key':
            logger.warning("⚠️ Using default Flowise API key - please set FLOWISE_API_KEY environment variable")

        # Prepare payload with streaming support
        payload = {
            "question": question,
            "streaming": False  # Force non-streaming to get JSON response
        }

        # Add chat history if provided
        if chat_history:
            # Convert chat history to Flowise format
            flowise_history = []
            for msg in chat_history:
                if msg.get('sender') == 'user':
                    flowise_history.append({
                        "message": msg.get('text', ''),
                        "type": "userMessage"
                    })
                else:
                    flowise_history.append({
                        "message": msg.get('text', ''),
                        "type": "apiMessage"
                    })
            payload["chatHistory"] = flowise_history

        logger.info(f"🔍 Sending query to Flowise: {question[:50]}... (streaming: {streaming})")

        # Use non-streaming to get JSON response format
        try:
            # Increase timeout for Vietnamese text processing
            timeout = aiohttp.ClientTimeout(total=120)  # 2 minutes timeout
            async with aiohttp.ClientSession(timeout=timeout) as session:
                headers = {}
                if flowise_api_key and flowise_api_key != 'your-flowise-api-key':
                    headers['Authorization'] = f'Bearer {flowise_api_key}'
                
                async with session.post(flowise_url, json=payload, headers=headers) as response:
                    if response.status == 200:
                        # Handle JSON response (not streaming)
                        response_text = await response.text()
                        logger.info(f"🔍 [FLOWISE DEBUG] Raw response: {response_text[:500]}...")
                        logger.info(f"🔍 [FLOWISE DEBUG] Full response length: {len(response_text)}")
                        
                        actual_content = ""
                        metadata = {}
                        
                        # Try to parse as JSON first (new format)
                        logger.info(f"🔍 [FLOWISE DEBUG] Attempting JSON parse...")
                        logger.info(f"🔍 [FLOWISE DEBUG] Response starts with: {response_text[:100]}")
                        
                        # Check if response is a single JSON object (not streaming format)
                        if response_text.strip().startswith('{') and response_text.strip().endswith('}'):
                            logger.info("🔍 [FLOWISE DEBUG] Response appears to be a single JSON object")
                            try:
                                response_json = json.loads(response_text.strip())
                                logger.info(f"🔍 [FLOWISE DEBUG] Parsed as JSON successfully")
                                
                                # Extract text from JSON response
                                if 'text' in response_json:
                                    actual_content = response_json['text']
                                    logger.info(f"✅ [FLOWISE] Found text in JSON: {actual_content[:200]}...")
                                    
                                    # Filter out system prompt content
                                    system_prompt_indicators = [
                                        "<identity>", "You are a Supervisor Agent", "central orchestrator", 
                                        "search strategist", "multi-agent system", "Your primary goal",
                                        "You have access to the following tools", "Use the following format",
                                        "Thought:", "Action:", "Observation:", "Final Answer:",
                                        "tool_", "predefined workflow", "Analyze-Decide-Review", "A-D-R cycle"
                                    ]
                                    
                                    # Temporarily disable system prompt filtering to debug
                                    logger.info("🔍 [FLOWISE DEBUG] Raw content received (first 500 chars):")
                                    logger.info(f"🔍 [FLOWISE DEBUG] {actual_content[:500]}")
                                    
                                    # Check if content contains system prompt indicators
                                    is_system_prompt = any(indicator in actual_content for indicator in system_prompt_indicators)
                                    
                                    if is_system_prompt:
                                        logger.warning("⚠️ [FLOWISE] Detected system prompt content, but allowing it for debugging")
                                        # actual_content = "Xin lỗi, không thể xử lý phản hồi từ Flowise. Vui lòng thử lại hoặc chuyển sang Vertex AI."
                                    else:
                                        logger.info("✅ [FLOWISE] Content looks good, using it")
                                    
                                    # Extract metadata
                                    metadata = {
                                        'question': response_json.get('question', ''),
                                        'chatId': response_json.get('chatId', ''),
                                        'chatMessageId': response_json.get('chatMessageId', '')
                                    }
                                    
                                    # Successfully extracted content from JSON, skip streaming format parsing
                                    logger.info("✅ [FLOWISE] Successfully extracted content from JSON, skipping streaming format")
                                    
                                else:
                                    logger.warning("⚠️ [FLOWISE] No 'text' field in JSON response")
                                    
                            except json.JSONDecodeError as e:
                                logger.info(f"🔍 [FLOWISE DEBUG] JSON parse failed: {e}")
                                logger.info("🔍 [FLOWISE DEBUG] Not JSON format, trying streaming format")
                        else:
                            logger.info("🔍 [FLOWISE DEBUG] Response is not a single JSON object, trying streaming format")
                            
                        # Only try streaming format parsing if we haven't already extracted content from JSON
                        if not actual_content or actual_content == "Xin lỗi, không thể xử lý phản hồi từ Flowise. Vui lòng thử lại hoặc chuyển sang Vertex AI.":
                            logger.info("🔍 [FLOWISE DEBUG] No content extracted from JSON, trying streaming format")
                            # Fallback to streaming format parsing
                            try:
                                if 'agentFlowExecutedData' in response_text:
                                    # Extract the JSON data from agentFlowExecutedData
                                    import json as json_module
                                    
                                    # Try multiple patterns to find the response
                                    patterns = [
                                        # First try to find actual conversational responses (Vietnamese)
                                        r'"text":"([^"]*Chào bạn[^"]*)"',
                                    r'"text":"([^"]*Tôi không tìm thấy[^"]*)"',
                                    r'"text":"([^"]*Bạn có quan tâm[^"]*)"',
                                    r'"text":"([^"]*Công cụ bản vẽ AI[^"]*)"',
                                    r'"text":"([^"]*Sử dụng chức năng[^"]*)"',
                                    r'"text":"([^"]*Vui lòng cho tôi biết[^"]*)"',
                                    r'"text":"([^"]*Hello[^"]*)"',
                                    r'"text":"([^"]*Hi[^"]*)"',
                                    r'"text":"([^"]*What is[^"]*)"',
                                    r'"text":"([^"]*How to[^"]*)"',
                                    # Then try general patterns but exclude system prompts
                                    r'"text":"((?!.*<identity>)(?!.*Supervisor Agent)(?!.*central orchestrator)(?!.*search strategist)(?!.*multi-agent system)(?!.*predefined workflow)[^"]*)"',
                                    r'"answer":"((?!.*<identity>)(?!.*Supervisor Agent)(?!.*central orchestrator)(?!.*search strategist)(?!.*multi-agent system)(?!.*predefined workflow)[^"]*)"',
                                    r'"response":"((?!.*<identity>)(?!.*Supervisor Agent)(?!.*central orchestrator)(?!.*search strategist)(?!.*multi-agent system)(?!.*predefined workflow)[^"]*)"',
                                    r'"content":"((?!.*<identity>)(?!.*Supervisor Agent)(?!.*central orchestrator)(?!.*search strategist)(?!.*multi-agent system)(?!.*predefined workflow)[^"]*)"',
                                    r'"message":"((?!.*<identity>)(?!.*Supervisor Agent)(?!.*central orchestrator)(?!.*search strategist)(?!.*multi-agent system)(?!.*predefined workflow)[^"]*)"',
                                    # Fallback patterns
                                    r'"output":\{"text":"([^"]*)"\}',
                                    r'"text":"([^"]*)"',
                                    r'"answer":"([^"]*)"',
                                    r'"response":"([^"]*)"',
                                    r'"content":"([^"]*)"',
                                    r'"message":"([^"]*)"',
                                    # JSON parsing patterns
                                    r'data:\{"event":"agentFlowExecutedData","data":\[(.*?)\]\}',
                                    r'"agentFlowExecutedData","data":\[(.*?)\]'
                                ]
                                
                                for i, pattern in enumerate(patterns):
                                    logger.info(f"🔍 [FLOWISE DEBUG] Trying pattern {i+1}: {pattern}")
                                    matches = re.findall(pattern, response_text, re.DOTALL)
                                    logger.info(f"🔍 [FLOWISE DEBUG] Pattern {i+1} found {len(matches)} matches")
                                    
                                    if matches:
                                        if i >= 2:  # Patterns 3 and 4 directly extract text
                                            actual_content = matches[0]
                                            logger.info(f"✅ [FLOWISE] Found response with pattern {i+1}: {actual_content[:100]}...")
                                            break
                                        else:  # Patterns 1 and 2 need JSON parsing
                                            data_str = matches[0]
                                            logger.info(f"🔍 [FLOWISE DEBUG] Found data with pattern {i+1}: {data_str[:200]}...")
                                            try:
                                                # Parse the JSON data
                                                data_array = json_module.loads(f'[{data_str}]')
                                                logger.info(f"🔍 [FLOWISE DEBUG] Parsed data array with {len(data_array)} items")
                                                if data_array and len(data_array) > 0:
                                                    # Look for the output field in the data
                                                    for j, item in enumerate(data_array):
                                                        logger.info(f"🔍 [FLOWISE DEBUG] Item {j}: {item}")
                                                        if isinstance(item, dict) and 'data' in item:
                                                            data_item = item['data']
                                                            logger.info(f"🔍 [FLOWISE DEBUG] Data item: {data_item}")
                                                            
                                                            # Look for various possible response fields
                                                            response_fields = ['output', 'response', 'answer', 'text', 'content', 'message']
                                                            for field in response_fields:
                                                                if field in data_item:
                                                                    field_value = data_item[field]
                                                                    logger.info(f"🔍 [FLOWISE DEBUG] Found {field}: {field_value}")
                                                                    
                                                                    if isinstance(field_value, dict):
                                                                        # Look for text content in nested objects
                                                                        text_fields = ['text', 'content', 'message', 'answer', 'response']
                                                                        for text_field in text_fields:
                                                                            if text_field in field_value:
                                                                                actual_content = field_value[text_field]
                                                                                logger.info(f"✅ [FLOWISE] Found response in {field}.{text_field}: {actual_content[:100]}...")
                                                                                break
                                                                    elif isinstance(field_value, str) and len(field_value) > 10:
                                                                        actual_content = field_value
                                                                        logger.info(f"✅ [FLOWISE] Found response in {field}: {actual_content[:100]}...")
                                                                        break
                                                                    
                                                                    if actual_content:
                                                                        break
                                                            
                                                            if actual_content:
                                                                break
                                                if actual_content:
                                                    break
                                            except json.JSONDecodeError as json_err:
                                                logger.error(f"❌ JSON decode error with pattern {i+1}: {json_err}")
                                                logger.error(f"❌ Data string that failed to parse: {data_str[:500]}...")
                                                continue
                                
                                if not actual_content:
                                    logger.warning("⚠️ [FLOWISE] No content found with any pattern")
                                    # Try to find Vietnamese text patterns in the raw response
                                    vietnamese_patterns = [
                                        r'Chào bạn[^"]*',
                                        r'Tôi không tìm thấy[^"]*',
                                        r'Bạn có quan tâm[^"]*',
                                        r'Công cụ bản vẽ AI[^"]*',
                                        r'Sử dụng chức năng[^"]*',
                                        r'Vui lòng cho tôi biết[^"]*',
                                        # More specific patterns for actual responses
                                        r'"text":"([^"]*Chào bạn[^"]*)"',
                                        r'"text":"([^"]*Tôi không tìm thấy[^"]*)"',
                                        r'"text":"([^"]*Bạn có quan tâm[^"]*)"',
                                        r'"text":"([^"]*Công cụ bản vẽ AI[^"]*)"',
                                        r'"text":"([^"]*Sử dụng chức năng[^"]*)"',
                                        r'"text":"([^"]*Vui lòng cho tôi biết[^"]*)"'
                                    ]
                                    
                                    for pattern in vietnamese_patterns:
                                        matches = re.findall(pattern, response_text, re.DOTALL)
                                        if matches:
                                            actual_content = matches[0]
                                            logger.info(f"✅ [FLOWISE] Found Vietnamese response with pattern: {actual_content[:100]}...")
                                            break
                                else:
                                    # Fallback: look for any meaningful content
                                    logger.info("🔍 [FLOWISE DEBUG] No agentFlowExecutedData found, using fallback")
                                    try:
                                        lines = response_text.split('\n')
                                        for line in lines:
                                            line = line.strip()
                                            if (line and 
                                                not line.startswith('data:') and 
                                                not line.startswith('message:') and
                                                not any(keyword in line for keyword in ['agentFlowEvent', 'metadata', 'nodeLabel', 'status', 'INPROGRESS', 'FINISHED']) and
                                                len(line) > 10):  # Only lines with substantial content
                                                actual_content += line + '\n'
                                    except Exception as e:
                                        logger.error(f"❌ Error extracting content: {e}")
                                        logger.error(f"❌ Content extraction error type: {type(e).__name__}")
                                        # Don't use hardcoded fallback, let it be empty so we can debug
                                        actual_content = ""
                                    
                                    # Clean up the content
                                    actual_content = actual_content.strip()
                        
                        # Filter out system prompt content
                        if actual_content:
                            # Check if content contains system prompt indicators
                            system_prompt_indicators = [
                                '<identity>',
                                'Supervisor Agent',
                                'central orchestrator',
                                'search strategist',
                                'multi-agent system',
                                'predefined workflow',
                                'Analyze-Decide-Review',
                                'A-D-R cycle',
                                'Your responsibility is to manage',
                                'analyzing results',
                                'construct',
                                'orchestrator',
                                'workflow by analyzing',
                                'multi-agent',
                                'search strategist'
                            ]
                            
                            # Check if the content starts with system prompt indicators
                            content_lower = actual_content.lower()
                            is_system_prompt = any(indicator.lower() in content_lower for indicator in system_prompt_indicators)
                            
                            # Also check if content is too long (system prompts are usually very long)
                            if len(actual_content) > 2000 and is_system_prompt:
                                logger.warning("⚠️ [FLOWISE] Detected long system prompt content, filtering out")
                                actual_content = ""
                            elif is_system_prompt:
                                logger.warning("⚠️ [FLOWISE] Detected system prompt content, filtering out")
                                actual_content = ""
                            else:
                                logger.info(f"✅ [FLOWISE] Content passed system prompt filter")
                        
                        # If still no content, provide a default response
                        if not actual_content:
                            logger.warning("⚠️ [FLOWISE] No content extracted, using fallback response")
                            actual_content = "Xin lỗi, không thể xử lý phản hồi từ Flowise. Vui lòng thử lại hoặc chuyển sang Vertex AI."
                        
                        logger.info(f"✅ Flowise response received successfully")
                        logger.info(f"🔍 [FLOWISE DEBUG] Extracted content: '{actual_content[:200]}...'")

                        return {
                            "success": True,
                            "response": actual_content or 'No response received',
                            "metadata": metadata,
                            "question": question,
                            "timestamp": datetime.now().isoformat()
                        }
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Flowise API error: {response.status} - {error_text}")
                        raise HTTPException(status_code=503, detail=f"Flowise API error: {response.status}")
        except aiohttp.ClientError as e:
            logger.error(f"❌ Flowise connection error: {e}")
            logger.error(f"❌ Error type: {type(e).__name__}")
            return {
                "success": False,
                "error": f"Flowise connection error: {str(e)}",
                "response": "Xin lỗi, không thể kết nối đến Flowise. Vui lòng thử lại sau hoặc chuyển sang Vertex AI.",
                "metadata": {},
                "question": question,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"❌ Flowise general error: {e}")
            # Provide a helpful fallback response
            return {
                "success": True,
                "response": f"Xin chào! Tôi là trợ lý AI của JEGA. Tôi hiện đang gặp sự cố kỹ thuật với hệ thống Flowise. Vui lòng thử lại sau hoặc liên hệ với đội ngũ hỗ trợ.\n\nCâu hỏi của bạn: {question}",
                "metadata": {"fallback": True, "reason": str(e)},
                "question": question,
                "timestamp": datetime.now().isoformat()
            }
        except asyncio.TimeoutError as e:
            logger.error(f"❌ Flowise timeout error: {e}")
            return {
                "success": False,
                "error": f"Flowise timeout error: {str(e)}",
                "response": "Xin lỗi, Flowise phản hồi quá chậm. Vui lòng thử lại sau hoặc chuyển sang Vertex AI.",
                "metadata": {},
                "question": question,
                "timestamp": datetime.now().isoformat()
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Flowise endpoint error: {e}")
        logger.error(f"❌ Error type: {type(e).__name__}")
        logger.error(f"❌ Error details: {str(e)}")
        
        # Return a more user-friendly error response
        return {
            "success": False,
            "error": f"Flowise service temporarily unavailable: {str(e)}",
            "response": "Xin lỗi, hệ thống Flowise hiện tại không khả dụng. Vui lòng thử lại sau hoặc chuyển sang Vertex AI.",
            "metadata": {},
            "question": question,
            "timestamp": datetime.now().isoformat()
        }


@app.post("/api/flowise/stream")
async def flowise_stream_chat(request: Request):
    """Flowise streaming endpoint - same as /api/flowise but with proper streaming response"""
    question = ""
    try:
        # Parse request with proper encoding handling
        try:
            body = await request.json()
        except UnicodeDecodeError as e:
            logger.error(f"❌ Unicode decode error: {e}")
            # Try to get raw body and decode with error handling
            raw_body = await request.body()
            body_text = raw_body.decode('utf-8', errors='replace')
            body = json.loads(body_text)
        
        question = body.get('question', '').strip()
        chat_id = body.get('chatId', '')
        session_id = body.get('sessionId', '')
        uploads = body.get('uploads', [])
        streaming = body.get('streaming', True)

        if not question:
            raise HTTPException(status_code=400, detail="Question is required")
        
        # Log the question for debugging
        logger.info(f"🔍 [FLOWISE STREAM] Processing question: '{question[:100]}...'")

        # Flowise API configuration - use fallback values like local development
        FLOWISE_URL = os.getenv('FLOWISE_URL', 'http://localhost:3000/api/v1/prediction/your-flow-id')
        FLOWISE_API_KEY = os.getenv('FLOWISE_API_KEY', 'your-flowise-api-key')
        
        # Log configuration status
        if not FLOWISE_URL or FLOWISE_URL == 'http://localhost:3000/api/v1/prediction/your-flow-id':
            logger.warning("⚠️ Using default Flowise URL - please set FLOWISE_URL environment variable")
        if not FLOWISE_API_KEY or FLOWISE_API_KEY == 'your-flowise-api-key':
            logger.warning("⚠️ Using default Flowise API key - please set FLOWISE_API_KEY environment variable")

        # Prepare payload for Flowise
        payload = {
            "question": question,
            "streaming": streaming,
            "chatId": chat_id,
            "sessionId": session_id
        }
        
        # Add uploads if present
        if uploads:
            payload["uploads"] = uploads
            logger.info(f"🔍 [FLOWISE STREAM PAYLOAD] Full payload being sent: {json.dumps(payload, indent=2)}")
        else:
            logger.info(f"🔍 [FLOWISE STREAM] Sending query to Flowise: {question[:50]}... (streaming: {streaming})")

        # Use the existing flowise_stream_generator
        return StreamingResponse(
            flowise_stream_generator(FLOWISE_URL, payload),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Flowise stream endpoint error: {e}")
        # Return a fallback streaming response instead of throwing error
        async def fallback_stream():
            fallback_message = f"Xin chào! Tôi là trợ lý AI của JEGA. Tôi hiện đang gặp sự cố kỹ thuật với hệ thống Flowise. Vui lòng thử lại sau hoặc liên hệ với đội ngũ hỗ trợ.\n\nCâu hỏi của bạn: {question}"
            yield f"data: {json.dumps({'event': 'token', 'data': fallback_message})}\n\n"
            yield f"data: {json.dumps({'event': 'metadata', 'data': {'fallback': True, 'reason': str(e)}})}\n\n"
            yield f"data: [DONE]\n\n"
        
        return StreamingResponse(
            fallback_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        )


async def flowise_stream_generator(flowise_url: str, payload: dict):
    """Generator for streaming Flowise responses"""
    try:
        async with aiohttp.ClientSession() as session:
            headers = {}
            flowise_api_key = os.getenv('FLOWISE_API_KEY', 'your-flowise-api-key')
            if flowise_api_key and flowise_api_key != 'your-flowise-api-key':
                headers['Authorization'] = f'Bearer {flowise_api_key}'
            
            async with session.post(flowise_url, json=payload, headers=headers, timeout=60) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"❌ Flowise streaming error: {response.status} - {error_text}")
                    yield f"data: {json.dumps({'type': 'error', 'error': f'Flowise API error: {response.status}'})}\n\n"
                    return

                # Process streaming response line by line
                buffer = ""
                content_buffer = ""
                in_content = False
                
                async for chunk in response.content:
                    try:
                        buffer += chunk.decode('utf-8')
                    except UnicodeDecodeError:
                        # Handle encoding issues by replacing problematic characters
                        buffer += chunk.decode('utf-8', errors='replace')
                    
                    # Process complete lines
                    while '\n' in buffer:
                        line, buffer = buffer.split('\n', 1)
                        line = line.strip()
                        
                        if not line:
                            continue
                        
                        # Handle Flowise specific format
                        if line == 'message:':
                            in_content = True
                            content_buffer = ""
                            continue
                            
                        elif line.startswith('data: '):
                            data_content = line[6:]  # Remove 'data: ' prefix
                            
                            try:
                                # Try to parse as JSON
                                data = json.loads(data_content)
                                
                                # Handle different event types
                                if isinstance(data, dict) and 'event' in data:
                                    event_type = data.get('event')
                                    event_data = data.get('data', '')
                                    
                                    if event_type == 'agentFlowEvent':
                                        # Agent flow status - don't send to frontend
                                        logger.info(f"📊 [FLOWISE] Agent flow event: {event_data}")
                                        continue
                                        
                                    elif event_type == 'metadata':
                                        # Metadata with chat info - don't send to frontend
                                        logger.info(f"📊 [FLOWISE] Metadata: {event_data}")
                                        continue
                                        
                                    elif event_type == 'end' and event_data == '[DONE]':
                                        # Stream complete
                                        logger.info("🏁 Flowise streaming complete")
                                        yield f"data: {json.dumps({'type': 'complete'})}\n\n"
                                        break
                                        
                                    else:
                                        # Other events - don't send to frontend
                                        logger.info(f"📊 [FLOWISE] Other event: {event_type}")
                                        continue
                                        
                                else:
                                    # Other JSON structures - don't send to frontend
                                    logger.info(f"📊 [FLOWISE] Other JSON: {data}")
                                    continue
                                    
                            except json.JSONDecodeError:
                                # If it's not JSON, treat as plain text
                                yield f"data: {json.dumps({'type': 'chunk', 'content': data_content})}\n\n"
                        
                        elif in_content and line:
                            # This is content after 'message:' - filter out configuration data
                            # Skip lines that contain configuration data
                            if (line.startswith('data:') or 
                                'agentFlowEvent' in line or 
                                'metadata' in line or 
                                'nodeLabel' in line or
                                'status' in line or
                                'INPROGRESS' in line or
                                'FINISHED' in line):
                                continue
                            
                            content_buffer += line + '\n'
                            
                            # Send content in smaller chunks to avoid "Chunk too big" error
                            if len(content_buffer) > 50:  # Send every 50 characters
                                try:
                                    yield f"data: {json.dumps({'type': 'chunk', 'content': content_buffer})}\n\n"
                                    content_buffer = ""
                                except Exception as e:
                                    logger.error(f"❌ Error yielding chunk: {e}")
                                    # Send even smaller chunks if there's an error
                                    if len(content_buffer) > 20:
                                        yield f"data: {json.dumps({'type': 'chunk', 'content': content_buffer[:20]})}\n\n"
                                        content_buffer = content_buffer[20:]
                        
                        elif line and not in_content:
                            # Plain text line (fallback) - only if it's not configuration data
                            if not any(keyword in line for keyword in ['agentFlowEvent', 'metadata', 'nodeLabel', 'status', 'INPROGRESS', 'FINISHED']):
                                yield f"data: {json.dumps({'type': 'chunk', 'content': line})}\n\n"
                
                # Send any remaining content
                if content_buffer:
                    yield f"data: {json.dumps({'type': 'chunk', 'content': content_buffer})}\n\n"

    except Exception as e:
        logger.error(f"❌ Flowise streaming generator error: {e}")
        yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

# Initialize on startup
init_genai_client()

# Local development server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3002, log_level="info")
