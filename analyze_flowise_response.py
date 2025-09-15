#!/usr/bin/env python3
"""
Analyze the full Flowise response to find where the actual content is located
"""

import requests
import json
import re

def analyze_flowise_response():
    """Analyze the full Flowise response structure"""
    
    # Flowise API configuration
    flowise_url = "https://langchain-ui.clik.vn/api/v1/prediction/4460e8a3-ff9e-4eb2-be18-cdf1ae791201"
    
    # Test with Vietnamese question
    payload = {
        "question": "Vẽ AI thế nào",
        "overrideConfig": {
            "streaming": True
        }
    }
    
    print("🔍 [ANALYZE] Sending request to Flowise...")
    
    try:
        response = requests.post(flowise_url, json=payload, timeout=60)
        print(f"🔍 [ANALYZE] Response status: {response.status_code}")
        
        if response.status_code == 200:
            response_text = response.text
            print(f"🔍 [ANALYZE] Response length: {len(response_text)}")
            
            # Save full response to file
            with open("flowise_full_response_analysis.txt", "w", encoding="utf-8") as f:
                f.write(response_text)
            print("🔍 [ANALYZE] Full response saved to flowise_full_response_analysis.txt")
            
            # Analyze the structure
            print("\n🔍 [ANALYZE] Analyzing response structure...")
            
            # Split by lines and analyze
            lines = response_text.split('\n')
            print(f"🔍 [ANALYZE] Total lines: {len(lines)}")
            
            # Look for different event types
            events = {}
            for line in lines:
                if line.startswith('data:'):
                    try:
                        data = json.loads(line[5:])  # Remove 'data:' prefix
                        event_type = data.get('event', 'unknown')
                        if event_type not in events:
                            events[event_type] = []
                        events[event_type].append(data)
                    except:
                        pass
            
            print(f"🔍 [ANALYZE] Event types found: {list(events.keys())}")
            
            # Look for agentFlowExecutedData specifically
            if 'agentFlowExecutedData' in events:
                print(f"\n🔍 [ANALYZE] Found {len(events['agentFlowExecutedData'])} agentFlowExecutedData events")
                
                for i, event in enumerate(events['agentFlowExecutedData']):
                    print(f"\n🔍 [ANALYZE] Event {i}:")
                    print(f"  - Event data type: {type(event.get('data'))}")
                    
                    if isinstance(event.get('data'), list):
                        for j, item in enumerate(event['data']):
                            print(f"  - Item {j}: {list(item.keys()) if isinstance(item, dict) else type(item)}")
                            
                            if isinstance(item, dict):
                                # Look for output field
                                if 'data' in item and isinstance(item['data'], dict):
                                    data_obj = item['data']
                                    print(f"    - Data keys: {list(data_obj.keys())}")
                                    
                                    if 'output' in data_obj:
                                        output = data_obj['output']
                                        print(f"    - Output type: {type(output)}")
                                        if isinstance(output, dict):
                                            print(f"    - Output keys: {list(output.keys())}")
                                            
                                            # Look for text content
                                            for key in ['text', 'content', 'response', 'answer', 'message']:
                                                if key in output:
                                                    content = output[key]
                                                    print(f"    - {key}: {str(content)[:200]}...")
                                                    
                                                    # Check if this looks like a real response
                                                    if any(phrase in str(content) for phrase in ['Chào bạn', 'Vẽ AI', 'Công cụ', 'Sử dụng', 'Hello', 'Hi']):
                                                        print(f"    - ✅ FOUND POTENTIAL RESPONSE in {key}!")
                                                        print(f"    - Full content: {content}")
            
            # Also search for Vietnamese phrases in the raw response
            print(f"\n🔍 [ANALYZE] Searching for Vietnamese phrases in raw response...")
            vietnamese_phrases = ['Chào bạn', 'Vẽ AI', 'Công cụ bản vẽ AI', 'Sử dụng chức năng', 'Hello', 'Hi']
            
            for phrase in vietnamese_phrases:
                if phrase in response_text:
                    print(f"✅ Found '{phrase}' in response")
                    # Find context around the phrase
                    start = response_text.find(phrase)
                    context = response_text[max(0, start-100):start+200]
                    print(f"   Context: ...{context}...")
                else:
                    print(f"❌ '{phrase}' not found")
            
            # Look for any JSON objects that might contain the response
            print(f"\n🔍 [ANALYZE] Looking for JSON objects with potential responses...")
            json_objects = re.findall(r'\{[^{}]*"[^"]*text"[^}]*\}', response_text)
            print(f"Found {len(json_objects)} JSON objects with 'text' field")
            
            for i, obj in enumerate(json_objects[:5]):  # Show first 5
                try:
                    parsed = json.loads(obj)
                    if 'text' in parsed:
                        text_content = parsed['text']
                        print(f"  Object {i}: {text_content[:100]}...")
                except:
                    pass
                    
        else:
            print(f"❌ [ANALYZE] Error: {response.status_code}")
            print(f"❌ [ANALYZE] Response: {response.text}")
            
    except Exception as e:
        print(f"❌ [ANALYZE] Exception: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    analyze_flowise_response()
