/**
 * Test script to verify chatbot is calling Bubble config
 * This will test the API directly and show the logs
 */

async function testChatbotBubbleConfig() {
  console.log('🧪 Testing Chatbot Bubble Config Integration...\n');

  const API_BASE_URL = 'http://localhost:3003/api';
  
  try {
    // Test 1: Check if API server is running
    console.log('1️⃣ Testing API server health...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ API server is running:', healthData.message);
    } else {
      console.log('❌ API server is not responding');
      return;
    }

    // Test 2: Test Vertex AI endpoint - this should trigger Bubble config fetch
    console.log('\n2️⃣ Testing Vertex AI endpoint (should fetch Bubble config)...');
    console.log('📝 Sending test message to trigger Bubble config fetch...');
    
    const chatResponse = await fetch(`${API_BASE_URL}/vertex-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, this is a test message to verify Bubble config is being fetched.',
        chatHistory: []
      })
    });

    console.log('📡 Chat API Response Status:', chatResponse.status);
    
    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log('✅ Chat API Response received successfully');
      console.log('📊 Response details:', {
        hasResponse: !!chatData.response,
        responseLength: chatData.response?.length || 0,
        hasModel: !!chatData.model,
        hasSources: !!chatData.sources,
        sourcesCount: chatData.sources?.length || 0
      });
      
      if (chatData.response) {
        console.log('💬 Chat Response (first 200 chars):', chatData.response.substring(0, 200) + '...');
      }
    } else {
      const errorData = await chatResponse.json();
      console.log('❌ Chat API Error:', errorData);
    }

    // Test 3: Test config endpoint directly
    console.log('\n3️⃣ Testing config endpoint directly...');
    const configResponse = await fetch(`${API_BASE_URL}/config`);
    if (configResponse.ok) {
      const configData = await configResponse.json();
      console.log('✅ Config endpoint working');
      console.log('📋 Config details:', {
        hasConfig: !!configData.config,
        hasSystemPrompt: !!configData.config?.systemPrompt,
        hasModelParameters: !!configData.config?.modelParameters,
        temperature: configData.config?.modelParameters?.temperature,
        topP: configData.config?.modelParameters?.topP,
        maxOutputTokens: configData.config?.modelParameters?.maxOutputTokens
      });
    } else {
      console.log('❌ Config endpoint error:', configResponse.status);
    }

    console.log('\n🎯 Test Summary:');
    console.log('- If you see [BUBBLE] logs in the API server terminal, Bubble config is being fetched');
    console.log('- If you see [CHAT] logs, the chat is using Bubble config');
    console.log('- If you see [VERTEX] logs, Vertex AI is using Bubble config');
    console.log('\n📝 Check the API server terminal for detailed Bubble API logs!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('1. API server is running on port 3003');
    console.log('2. Check the API server terminal for [BUBBLE] logs');
  }
}

// Run the test
testChatbotBubbleConfig(); 