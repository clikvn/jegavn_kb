// Test to verify the system prompt fix
// Run with: node test-fix.js

async function testSystemPromptFix() {
  console.log('🧪 Testing System Prompt Fix...\n');
  
  try {
    console.log('📡 Calling config endpoint...');
    const response = await fetch('http://localhost:3001/api/config');
    
    console.log('📊 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Config fetched successfully!');
      
      // Check if systemPrompt is now a string (not an object)
      if (typeof data.config.systemPrompt === 'string') {
        console.log('🎯 SUCCESS: systemPrompt is now a string!');
        console.log('📏 Prompt length:', data.config.systemPrompt.length);
        console.log('📝 First 100 chars:', data.config.systemPrompt.substring(0, 100) + '...');
      } else {
        console.log('❌ FAILED: systemPrompt is still an object:', typeof data.config.systemPrompt);
        console.log('📋 systemPrompt structure:', JSON.stringify(data.config.systemPrompt, null, 2));
      }
      
      // Check other config values
      console.log('\n📋 Other config details:');
      console.log('  - Temperature:', data.config.modelParameters.temperature);
      console.log('  - Top P:', data.config.modelParameters.topP);
      console.log('  - Max Output Tokens:', data.config.modelParameters.maxOutputTokens);
      console.log('  - Source:', data.source);
      
    } else {
      console.log('❌ Config fetch failed:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure API server is running on port 3001');
  }
}

testSystemPromptFix(); 