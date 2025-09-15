#!/usr/bin/env python3
"""
Debug Flowise response to understand the actual format
"""

import requests
import json

def debug_flowise_response():
    """Debug what Flowise actually returns"""
    
    # Flowise API configuration
    flowise_url = "https://langchain-ui.clik.vn/api/v1/prediction/4460e8a3-ff9e-4eb2-be18-cdf1ae791201"
    
    # Test payload - try without streaming first
    payload = {
        "question": "Hello",
        "streaming": False
    }
    
    print("🧪 Testing Flowise response format...")
    print(f"📡 URL: {flowise_url}")
    print(f"📤 Payload: {json.dumps(payload, indent=2)}")
    print("\n" + "="*50)
    
    try:
        # Make request
        response = requests.post(flowise_url, json=payload, timeout=30)
        response.raise_for_status()
        
        print(f"✅ Status Code: {response.status_code}")
        print(f"📋 Content-Type: {response.headers.get('content-type', 'Unknown')}")
        print(f"📏 Content-Length: {len(response.text)}")
        print("\n" + "="*50)
        print("📄 RAW RESPONSE:")
        print(response.text)
        print("\n" + "="*50)
        
        # Try to parse as JSON
        try:
            json_data = response.json()
            print("📊 JSON PARSED:")
            print(json.dumps(json_data, indent=2))
        except:
            print("❌ Not valid JSON")
            
        # Try to parse as streaming
        print("\n📡 STREAMING ANALYSIS:")
        lines = response.text.split('\n')
        for i, line in enumerate(lines[:20]):  # First 20 lines
            print(f"{i+1:2d}: {repr(line)}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    debug_flowise_response()
