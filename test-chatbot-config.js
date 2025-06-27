/**
 * Test script to verify chatbot configuration from Bubble database
 */

async function testChatbotConfig() {
  console.log('🧪 Testing chatbot configuration...\n');

  try {
    // Test 1: Check if API server is running
    console.log('1️⃣ Testing API server health...');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ API server is running:', healthData.message);
    } else {
      console.log('❌ API server is not responding');
      return;
    }

    // Test 2: Test Vertex AI endpoint with configuration fetch
    console.log('\n2️⃣ Testing Vertex AI endpoint with Bubble config...');
    const chatResponse = await fetch('http://localhost:3001/api/vertex-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, can you help me?',
        chatHistory: []
      })
    });

    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log('✅ Chatbot responded successfully');
      console.log('📝 Response preview:', chatData.response.substring(0, 100) + '...');
      console.log('🔧 Model used:', chatData.model);
      console.log('📚 Sources found:', chatData.sources?.length || 0);
    } else {
      const errorData = await chatResponse.json();
      console.log('❌ Chatbot error:', errorData.error);
      console.log('📋 Error message:', errorData.message);
      
      if (errorData.error === 'Configuration service unavailable') {
        console.log('🔍 This confirms the chatbot is trying to fetch from Bubble database');
        console.log('💡 The error indicates Bubble API is not accessible');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testChatbotConfig(); 