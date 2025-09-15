#!/usr/bin/env python3
"""
Debug script to examine the full Flowise response structure
"""

import requests
import json
import re

def debug_flowise_response():
    """Debug the full Flowise response structure"""
    
    # Flowise API configuration
    flowise_url = "https://langchain-ui.clik.vn/api/v1/prediction/4460e8a3-ff9e-4eb2-be18-cdf1ae791201"
    
    # Test with Vietnamese question
    payload = {
        "question": "Vẽ AI thế nào",
        "overrideConfig": {
            "streaming": False
        }
    }
    
    print("🔍 [DEBUG] Sending request to Flowise...")
    print(f"🔍 [DEBUG] URL: {flowise_url}")
    print(f"🔍 [DEBUG] Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(flowise_url, json=payload, timeout=60)
        print(f"🔍 [DEBUG] Response status: {response.status_code}")
        print(f"🔍 [DEBUG] Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            response_text = response.text
            print(f"🔍 [DEBUG] Response length: {len(response_text)}")
            print(f"🔍 [DEBUG] Response type: {type(response_text)}")
            
            # Save full response to file for analysis
            with open('flowise_full_response.txt', 'w', encoding='utf-8') as f:
                f.write(response_text)
            print("🔍 [DEBUG] Full response saved to flowise_full_response.txt")
            
            # Analyze the response structure
            print("\n🔍 [DEBUG] Analyzing response structure...")
            
            # Split by lines
            lines = response_text.split('\n')
            print(f"🔍 [DEBUG] Total lines: {len(lines)}")
            
            # Look for different types of content
            message_lines = [line for line in lines if line.startswith('message:')]
            data_lines = [line for line in lines if line.startswith('data:')]
            
            print(f"🔍 [DEBUG] Message lines: {len(message_lines)}")
            print(f"🔍 [DEBUG] Data lines: {len(data_lines)}")
            
            # Look for specific patterns
            patterns_to_check = [
                r'Chào bạn',
                r'Vẽ AI',
                r'Công cụ bản vẽ AI',
                r'Sử dụng chức năng',
                r'Giới thiệu công cụ',
                r'Hướng dẫn chi tiết',
                r'agentFlowExecutedData',
                r'text":',
                r'content":',
                r'answer":',
                r'response":'
            ]
            
            print("\n🔍 [DEBUG] Searching for specific patterns...")
            for pattern in patterns_to_check:
                matches = re.findall(pattern, response_text, re.IGNORECASE)
                if matches:
                    print(f"✅ Found '{pattern}': {len(matches)} matches")
                    # Show first few matches
                    for i, match in enumerate(matches[:3]):
                        print(f"   Match {i+1}: {match[:100]}...")
                else:
                    print(f"❌ Not found: '{pattern}'")
            
            # Look for JSON structures
            print("\n🔍 [DEBUG] Looking for JSON structures...")
            json_objects = []
            for line in data_lines:
                if line.startswith('data:'):
                    json_part = line[5:]  # Remove 'data:' prefix
                    try:
                        json_obj = json.loads(json_part)
                        json_objects.append(json_obj)
                        print(f"✅ Valid JSON found: {json_obj.get('event', 'unknown')}")
                    except json.JSONDecodeError:
                        pass
            
            # Analyze agentFlowExecutedData
            print("\n🔍 [DEBUG] Analyzing agentFlowExecutedData...")
            for obj in json_objects:
                if obj.get('event') == 'agentFlowExecutedData':
                    data = obj.get('data', [])
                    print(f"✅ agentFlowExecutedData found with {len(data)} items")
                    
                    for i, item in enumerate(data):
                        print(f"   Item {i+1}:")
                        print(f"     nodeId: {item.get('nodeId', 'N/A')}")
                        print(f"     nodeLabel: {item.get('nodeLabel', 'N/A')}")
                        print(f"     status: {item.get('status', 'N/A')}")
                        
                        if 'data' in item:
                            item_data = item['data']
                            print(f"     data keys: {list(item_data.keys())}")
                            
                            # Look for output
                            if 'output' in item_data:
                                output = item_data['output']
                                print(f"     output: {output}")
                            
                            # Look for state
                            if 'state' in item_data:
                                state = item_data['state']
                                print(f"     state keys: {list(state.keys())}")
                                
                                # Look for specific state fields that might contain the response
                                for key, value in state.items():
                                    if isinstance(value, str) and len(value) > 50:
                                        print(f"     state.{key}: {value[:200]}...")
            
            # Look for the actual response text
            print("\n🔍 [DEBUG] Looking for actual response text...")
            
            # Search for Vietnamese response patterns
            vietnamese_patterns = [
                r'Chào bạn[^"]*',
                r'Vẽ AI[^"]*',
                r'Công cụ bản vẽ AI[^"]*',
                r'Sử dụng chức năng[^"]*',
                r'Giới thiệu công cụ[^"]*',
                r'Hướng dẫn chi tiết[^"]*'
            ]
            
            for pattern in vietnamese_patterns:
                matches = re.findall(pattern, response_text, re.DOTALL)
                if matches:
                    print(f"✅ Found Vietnamese pattern '{pattern}':")
                    for i, match in enumerate(matches):
                        print(f"   Match {i+1}: {match[:300]}...")
            
            # Look for text in different JSON fields
            print("\n🔍 [DEBUG] Looking for text in JSON fields...")
            for obj in json_objects:
                if 'data' in obj:
                    data = obj['data']
                    if isinstance(data, list):
                        for item in data:
                            if isinstance(item, dict) and 'data' in item:
                                item_data = item['data']
                                # Look for text in various fields
                                for field in ['text', 'content', 'answer', 'response', 'message', 'output']:
                                    if field in item_data:
                                        value = item_data[field]
                                        if isinstance(value, str) and len(value) > 20:
                                            print(f"✅ Found {field}: {value[:200]}...")
                                        elif isinstance(value, dict):
                                            for sub_field in ['text', 'content', 'answer', 'response', 'message']:
                                                if sub_field in value:
                                                    sub_value = value[sub_field]
                                                    if isinstance(sub_value, str) and len(sub_value) > 20:
                                                        print(f"✅ Found {field}.{sub_field}: {sub_value[:200]}...")
            
        else:
            print(f"❌ [DEBUG] Error: {response.status_code}")
            print(f"❌ [DEBUG] Response: {response.text}")
            
    except Exception as e:
        print(f"❌ [DEBUG] Exception: {e}")
        print(f"❌ [DEBUG] Exception type: {type(e).__name__}")

if __name__ == "__main__":
    debug_flowise_response()
