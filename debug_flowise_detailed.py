#!/usr/bin/env python3
"""
Detailed debug script to examine Flowise response structure
"""

import requests
import json
import re

def debug_flowise_detailed():
    """Debug the detailed Flowise response structure"""
    
    # Flowise API configuration
    flowise_url = "https://langchain-ui.clik.vn/api/v1/prediction/4460e8a3-ff9e-4eb2-be18-cdf1ae791201"
    
    # Test with Vietnamese question
    payload = {
        "question": "Vẽ AI thế nào",
        "overrideConfig": {
            "streaming": False
        }
    }
    
    print("🔍 [DETAILED DEBUG] Sending request to Flowise...")
    print(f"🔍 [DETAILED DEBUG] URL: {flowise_url}")
    print(f"🔍 [DETAILED DEBUG] Payload: {json.dumps(payload, indent=2, ensure_ascii=False)}")
    
    try:
        response = requests.post(flowise_url, json=payload, timeout=60)
        print(f"🔍 [DETAILED DEBUG] Response status: {response.status_code}")
        print(f"🔍 [DETAILED DEBUG] Response headers: {dict(response.headers)}")
        
        # Get response text
        response_text = response.text
        print(f"🔍 [DETAILED DEBUG] Response length: {len(response_text)}")
        
        # Save full response to file
        with open("flowise_detailed_response.txt", "w", encoding="utf-8") as f:
            f.write(response_text)
        print("🔍 [DETAILED DEBUG] Full response saved to flowise_detailed_response.txt")
        
        # Try to parse as JSON first
        try:
            response_json = response.json()
            print("🔍 [DETAILED DEBUG] Response is JSON format")
            print(f"🔍 [DETAILED DEBUG] JSON keys: {list(response_json.keys())}")
            
            # Look for text field
            if "text" in response_json:
                print(f"🔍 [DETAILED DEBUG] Found 'text' field: {response_json['text'][:200]}...")
                return response_json["text"]
            else:
                print("🔍 [DETAILED DEBUG] No 'text' field found in JSON response")
                print(f"🔍 [DETAILED DEBUG] Full JSON: {json.dumps(response_json, indent=2, ensure_ascii=False)}")
                
        except json.JSONDecodeError:
            print("🔍 [DETAILED DEBUG] Response is not JSON format, analyzing as text...")
            
            # Look for Vietnamese content patterns
            vietnamese_patterns = [
                r'"text":"([^"]*Chào bạn[^"]*)"',
                r'"text":"([^"]*Vẽ AI[^"]*)"',
                r'"text":"([^"]*Công cụ bản vẽ AI[^"]*)"',
                r'"text":"([^"]*Sử dụng chức năng[^"]*)"',
                r'"text":"([^"]*Hướng dẫn[^"]*)"',
                r'"text":"([^"]*Dựa trên tài liệu[^"]*)"',
                r'"text":"([^"]*Để sử dụng[^"]*)"',
                r'"text":"([^"]*Bạn có thể[^"]*)"',
                r'"text":"([^"]*Tôi có thể[^"]*)"',
                r'"text":"([^"]*Vui lòng[^"]*)"',
                r'"text":"([^"]*Tôi không tìm thấy[^"]*)"',
                r'"text":"([^"]*Bạn có quan tâm[^"]*)"',
            ]
            
            for i, pattern in enumerate(vietnamese_patterns):
                matches = re.findall(pattern, response_text)
                if matches:
                    print(f"🔍 [DETAILED DEBUG] Pattern {i+1} found {len(matches)} matches:")
                    for j, match in enumerate(matches[:3]):  # Show first 3 matches
                        print(f"  Match {j+1}: {match[:100]}...")
                    if matches:
                        return matches[0]
            
            # Look for any text field that might contain Vietnamese
            text_pattern = r'"text":"([^"]{50,})"'
            text_matches = re.findall(text_pattern, response_text)
            print(f"🔍 [DETAILED DEBUG] Found {len(text_matches)} text fields:")
            for i, match in enumerate(text_matches[:5]):  # Show first 5
                print(f"  Text {i+1}: {match[:100]}...")
                # Check if it contains Vietnamese characters
                if re.search(r'[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]', match, re.IGNORECASE):
                    print(f"    ✅ Contains Vietnamese characters!")
                    return match
            
            # Look for content field
            content_pattern = r'"content":"([^"]{50,})"'
            content_matches = re.findall(content_pattern, response_text)
            print(f"🔍 [DETAILED DEBUG] Found {len(content_matches)} content fields:")
            for i, match in enumerate(content_matches[:5]):  # Show first 5
                print(f"  Content {i+1}: {match[:100]}...")
                # Check if it contains Vietnamese characters
                if re.search(r'[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]', match, re.IGNORECASE):
                    print(f"    ✅ Contains Vietnamese characters!")
                    return match
            
            print("🔍 [DETAILED DEBUG] No Vietnamese content found in any text/content fields")
            return None
            
    except Exception as e:
        print(f"❌ [DETAILED DEBUG] Error: {e}")
        return None

if __name__ == "__main__":
    result = debug_flowise_detailed()
    if result:
        print(f"\n✅ [DETAILED DEBUG] Found response: {result[:200]}...")
    else:
        print("\n❌ [DETAILED DEBUG] No response found")
