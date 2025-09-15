#!/usr/bin/env python3
"""
Comprehensive debug script to examine Flowise streaming response
"""

import requests
import json
import re

def debug_flowise_streaming():
    """Debug the Flowise streaming response structure"""
    
    # Flowise API configuration
    flowise_url = "https://langchain-ui.clik.vn/api/v1/prediction/4460e8a3-ff9e-4eb2-be18-cdf1ae791201"
    
    # Test with Vietnamese question
    payload = {
        "question": "Vẽ AI thế nào",
        "overrideConfig": {
            "streaming": True
        }
    }
    
    print("🔍 [STREAMING DEBUG] Sending request to Flowise...")
    print(f"🔍 [STREAMING DEBUG] URL: {flowise_url}")
    print(f"🔍 [STREAMING DEBUG] Payload: {json.dumps(payload, indent=2, ensure_ascii=False)}")
    
    try:
        response = requests.post(flowise_url, json=payload, timeout=60)
        print(f"🔍 [STREAMING DEBUG] Response status: {response.status_code}")
        print(f"🔍 [STREAMING DEBUG] Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            response_text = response.text
            print(f"🔍 [STREAMING DEBUG] Response length: {len(response_text)}")
            print(f"🔍 [STREAMING DEBUG] Response type: {type(response_text)}")
            
            # Save full response to file
            with open("flowise_streaming_response.txt", "w", encoding="utf-8") as f:
                f.write(response_text)
            print("🔍 [STREAMING DEBUG] Full response saved to flowise_streaming_response.txt")
            
            # Analyze the response structure
            print("\n🔍 [STREAMING DEBUG] Analyzing response structure...")
            
            # Check for different event types
            events = re.findall(r'data:\{"event":"([^"]+)"', response_text)
            print(f"🔍 [STREAMING DEBUG] Events found: {set(events)}")
            
            # Look for agentFlowExecutedData
            if 'agentFlowExecutedData' in response_text:
                print("🔍 [STREAMING DEBUG] Found agentFlowExecutedData")
                
                # Extract the data array
                data_matches = re.findall(r'data:\{"event":"agentFlowExecutedData","data":(\[.*?\])}', response_text)
                if data_matches:
                    print(f"🔍 [STREAMING DEBUG] Found {len(data_matches)} data matches")
                    
                    for i, data_str in enumerate(data_matches):
                        try:
                            data_array = json.loads(data_str)
                            print(f"🔍 [STREAMING DEBUG] Data array {i} length: {len(data_array)}")
                            
                            # Look for output fields
                            for j, item in enumerate(data_array):
                                if isinstance(item, dict) and 'data' in item:
                                    data_item = item['data']
                                    if isinstance(data_item, dict) and 'output' in data_item:
                                        output = data_item['output']
                                        print(f"🔍 [STREAMING DEBUG] Item {j} output type: {type(output)}")
                                        print(f"🔍 [STREAMING DEBUG] Item {j} output keys: {list(output.keys()) if isinstance(output, dict) else 'N/A'}")
                                        
                                        # Look for text content
                                        if isinstance(output, dict):
                                            for key, value in output.items():
                                                if isinstance(value, str) and len(value) > 50:
                                                    print(f"🔍 [STREAMING DEBUG] Item {j} {key}: {value[:200]}...")
                                        
                                        # Look for nested text
                                        if isinstance(output, str) and len(output) > 50:
                                            print(f"🔍 [STREAMING DEBUG] Item {j} output string: {output[:200]}...")
                                            
                        except json.JSONDecodeError as e:
                            print(f"🔍 [STREAMING DEBUG] JSON decode error for data {i}: {e}")
                            print(f"🔍 [STREAMING DEBUG] Raw data: {data_str[:200]}...")
            
            # Look for any text content that might contain the Vietnamese response
            print("\n🔍 [STREAMING DEBUG] Searching for Vietnamese content...")
            
            # Search for common Vietnamese phrases
            vietnamese_phrases = [
                "Chào bạn",
                "Vẽ AI",
                "Công cụ bản vẽ AI",
                "Sử dụng chức năng",
                "Tôi không tìm thấy",
                "Bạn có quan tâm"
            ]
            
            for phrase in vietnamese_phrases:
                if phrase in response_text:
                    print(f"🔍 [STREAMING DEBUG] Found phrase '{phrase}' in response")
                    # Find the context around this phrase
                    start = response_text.find(phrase)
                    context = response_text[max(0, start-100):start+200]
                    print(f"🔍 [STREAMING DEBUG] Context: ...{context}...")
                else:
                    print(f"🔍 [STREAMING DEBUG] Phrase '{phrase}' NOT found")
            
            # Look for any text fields that might contain the response
            print("\n🔍 [STREAMING DEBUG] Searching for text fields...")
            text_matches = re.findall(r'"text":"([^"]{50,})"', response_text)
            print(f"🔍 [STREAMING DEBUG] Found {len(text_matches)} text matches")
            
            for i, text in enumerate(text_matches):
                print(f"🔍 [STREAMING DEBUG] Text {i}: {text[:100]}...")
                if any(phrase in text for phrase in vietnamese_phrases):
                    print(f"🔍 [STREAMING DEBUG] Text {i} contains Vietnamese content!")
            
            # Look for any content fields
            print("\n🔍 [STREAMING DEBUG] Searching for content fields...")
            content_matches = re.findall(r'"content":"([^"]{50,})"', response_text)
            print(f"🔍 [STREAMING DEBUG] Found {len(content_matches)} content matches")
            
            for i, content in enumerate(content_matches):
                print(f"🔍 [STREAMING DEBUG] Content {i}: {content[:100]}...")
                if any(phrase in content for phrase in vietnamese_phrases):
                    print(f"🔍 [STREAMING DEBUG] Content {i} contains Vietnamese content!")
            
        else:
            print(f"❌ [STREAMING DEBUG] Error: {response.status_code}")
            print(f"❌ [STREAMING DEBUG] Response: {response.text}")
            
    except Exception as e:
        print(f"❌ [STREAMING DEBUG] Exception: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_flowise_streaming()
