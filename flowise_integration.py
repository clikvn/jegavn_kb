#!/usr/bin/env python3
"""
Flowise Integration Module for JEGA Knowledge Base
Provides functions to interact with the Flowise chatbot instance
"""

import requests
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)

class FlowiseClient:
    """Client for interacting with Flowise API"""
    
    def __init__(self, api_url: str = "https://langchain-ui.clik.vn/api/v1/prediction/4460e8a3-ff9e-4eb2-be18-cdf1ae791201"):
        """
        Initialize Flowise client
        
        Args:
            api_url: The Flowise API endpoint URL
        """
        self.api_url = api_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'JEGA-Knowledge-Base-Flowise/1.0'
        })
    
    def query(self, question: str, chat_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Send a query to Flowise and get response
        
        Args:
            question: The user's question
            chat_history: Optional chat history for context
            
        Returns:
            Dictionary containing the response data
        """
        try:
            # Prepare payload
            payload = {"question": question}
            
            # Add chat history if provided
            if chat_history:
                payload["chatHistory"] = chat_history
            
            logger.info(f"🔍 Sending query to Flowise: {question[:50]}...")
            
            # Make request
            response = self.session.post(
                self.api_url, 
                json=payload, 
                timeout=30
            )
            
            if response.status_code == 200:
                response_data = response.json()
                logger.info(f"✅ Flowise response received successfully")
                return {
                    "success": True,
                    "data": response_data,
                    "question": question,
                    "timestamp": datetime.now().isoformat()
                }
            else:
                logger.error(f"❌ Flowise API error: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "error": f"API error: {response.status_code}",
                    "details": response.text,
                    "question": question,
                    "timestamp": datetime.now().isoformat()
                }
                
        except requests.exceptions.Timeout:
            logger.error("❌ Flowise request timed out")
            return {
                "success": False,
                "error": "Request timeout",
                "question": question,
                "timestamp": datetime.now().isoformat()
            }
        except requests.exceptions.ConnectionError:
            logger.error("❌ Flowise connection error")
            return {
                "success": False,
                "error": "Connection error",
                "question": question,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"❌ Flowise unexpected error: {e}")
            return {
                "success": False,
                "error": str(e),
                "question": question,
                "timestamp": datetime.now().isoformat()
            }
    
    def extract_response_text(self, response_data: Dict[str, Any]) -> str:
        """
        Extract the main response text from Flowise response
        
        Args:
            response_data: The response data from Flowise
            
        Returns:
            The main response text
        """
        try:
            if "text" in response_data:
                return response_data["text"]
            elif "content" in response_data:
                return response_data["content"]
            else:
                # Fallback: return the whole response as string
                return json.dumps(response_data, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"❌ Error extracting response text: {e}")
            return "Error extracting response"
    
    def get_chat_metadata(self, response_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract metadata from Flowise response
        
        Args:
            response_data: The response data from Flowise
            
        Returns:
            Dictionary containing metadata
        """
        metadata = {}
        
        try:
            # Extract common metadata fields
            if "chatId" in response_data:
                metadata["chat_id"] = response_data["chatId"]
            if "chatMessageId" in response_data:
                metadata["message_id"] = response_data["chatMessageId"]
            if "executionId" in response_data:
                metadata["execution_id"] = response_data["executionId"]
            if "sessionId" in response_data:
                metadata["session_id"] = response_data["sessionId"]
            
            # Extract agent flow data if available
            if "agentFlowExecutedData" in response_data:
                agent_data = response_data["agentFlowExecutedData"]
                metadata["agent_flow"] = {
                    "total_nodes": len(agent_data),
                    "execution_time": self._calculate_execution_time(agent_data),
                    "nodes": [node.get("nodeLabel", "Unknown") for node in agent_data]
                }
            
            return metadata
            
        except Exception as e:
            logger.error(f"❌ Error extracting metadata: {e}")
            return {}
    
    def _calculate_execution_time(self, agent_data: List[Dict[str, Any]]) -> Optional[float]:
        """Calculate total execution time from agent flow data"""
        try:
            total_time = 0
            for node in agent_data:
                if "timeMetadata" in node.get("data", {}).get("output", {}):
                    time_meta = node["data"]["output"]["timeMetadata"]
                    if "delta" in time_meta:
                        total_time += time_meta["delta"]
            return total_time / 1000.0  # Convert to seconds
        except Exception:
            return None

# Global Flowise client instance
flowise_client = FlowiseClient()

def query_flowise(question: str, chat_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
    """
    Convenience function to query Flowise
    
    Args:
        question: The user's question
        chat_history: Optional chat history for context
        
    Returns:
        Dictionary containing the response data
    """
    return flowise_client.query(question, chat_history)

def get_flowise_response_text(question: str, chat_history: Optional[List[Dict[str, str]]] = None) -> str:
    """
    Get just the response text from Flowise
    
    Args:
        question: The user's question
        chat_history: Optional chat history for context
        
    Returns:
        The response text or error message
    """
    result = query_flowise(question, chat_history)
    
    if result["success"]:
        return flowise_client.extract_response_text(result["data"])
    else:
        return f"Error: {result['error']}"

# Test functions
def test_flowise_connection() -> bool:
    """Test the Flowise connection"""
    try:
        result = query_flowise("Test connection")
        return result["success"]
    except Exception as e:
        logger.error(f"❌ Flowise connection test failed: {e}")
        return False

def test_flowise_with_questions(questions: List[str]) -> List[Dict[str, Any]]:
    """Test Flowise with multiple questions"""
    results = []
    
    for question in questions:
        result = query_flowise(question)
        results.append({
            "question": question,
            "success": result["success"],
            "response": result.get("data", {}).get("text", "No response") if result["success"] else result.get("error", "Unknown error")
        })
    
    return results

if __name__ == "__main__":
    # Test the Flowise integration
    print("🧪 Testing Flowise Integration...")
    
    # Test basic connection
    if test_flowise_connection():
        print("✅ Flowise connection successful!")
        
        # Test with sample questions
        test_questions = [
            "What is JEGA?",
            "How do I create a floor plan?",
            "Tell me about interior design"
        ]
        
        print("\n📝 Testing with sample questions...")
        results = test_flowise_with_questions(test_questions)
        
        for result in results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['question']}: {result['response'][:100]}...")
    else:
        print("❌ Flowise connection failed!")
