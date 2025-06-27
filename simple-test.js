// Simple test to verify Bubble config is being fetched
// Run with: node simple-test.js

async function testBubbleConfig() {
  console.log('🧪 Testing Bubble Config Fetch...\n');
  
  try {
    // Test the config endpoint directly
    console.log('📡 Calling config endpoint...');
    const response = await fetch('http://localhost:3001/api/config');
    
    console.log('📊 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Config fetched successfully!');
      console.log('📋 Config details:', {
        hasConfig: !!data.config,
        hasSystemPrompt: !!data.config?.systemPrompt,
        hasModelParameters: !!data.config?.modelParameters,
        temperature: data.config?.modelParameters?.temperature,
        topP: data.config?.modelParameters?.topP,
        maxOutputTokens: data.config?.modelParameters?.maxOutputTokens,
        source: data.source
      });
      
      if (data.source === 'bubble-database') {
        console.log('🎯 SUCCESS: Config is coming from Bubble database!');
      } else {
        console.log('⚠️ WARNING: Config source is not Bubble database');
      }
    } else {
      console.log('❌ Config fetch failed:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure API server is running on port 3001');
  }
}

testBubbleConfig(); 