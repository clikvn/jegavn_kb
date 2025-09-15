#!/usr/bin/env python3
"""
Debug script to test Flowise response parsing
"""
import requests
import json
import re

def test_flowise_response():
    """Test Flowise API and debug response format"""
    
    # Flowise API configuration
    flowise_url = "https://langchain-ui.clik.vn/api/v1/prediction/4460e8a3-ff9e-4eb2-be18-cdf1ae791201"
    
    # Test payload
    payload = {
        "question": "Hello",
        "chatHistory": [],
        "streaming": False
    }
    
    print("🔍 Testing Flowise API...")
    print(f"URL: {flowise_url}")
    print(f"Payload: {payload}")
    
    try:
        response = requests.post(flowise_url, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type', 'Unknown')}")
        
        if response.status_code == 200:
            response_text = response.text
            print(f"\n📄 Raw Response (first 1000 chars):")
            print(response_text[:1000])
            print(f"\n📄 Raw Response (last 1000 chars):")
            print(response_text[-1000:])
            
            print(f"\n🔍 Response Analysis:")
            print(f"Total length: {len(response_text)}")
            print(f"Contains 'agentFlowExecutedData': {'agentFlowExecutedData' in response_text}")
            print(f"Contains 'output': {'output' in response_text}")
            print(f"Contains 'text': {'text' in response_text}")
            
            # Try different regex patterns
            patterns = [
                r'data:\{"event":"agentFlowExecutedData","data":\[(.*?)\]\}',
                r'"agentFlowExecutedData","data":\[(.*?)\]',
                r'"output":\{"text":"([^"]*)"\}',
                r'"text":"([^"]*)"'
            ]
            
            for i, pattern in enumerate(patterns):
                print(f"\n🔍 Pattern {i+1}: {pattern}")
                matches = re.findall(pattern, response_text, re.DOTALL)
                print(f"Matches found: {len(matches)}")
                for j, match in enumerate(matches[:3]):  # Show first 3 matches
                    print(f"  Match {j+1}: {match[:200]}...")
            
            # Try to find any text that looks like a response
            print(f"\n🔍 Looking for response-like content:")
            lines = response_text.split('\n')
            for line in lines:
                line = line.strip()
                if (line and 
                    not line.startswith('data:') and 
                    not line.startswith('message:') and
                    not any(keyword in line for keyword in ['agentFlowEvent', 'metadata', 'nodeLabel', 'status', 'INPROGRESS', 'FINISHED']) and
                    len(line) > 20 and
                    ('Chào' in line or 'Hello' in line or 'AI' in line or 'JEGA' in line)):
                    print(f"  Potential response: {line}")
                    
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_flowise_response()
