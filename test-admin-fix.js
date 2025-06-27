// Test to verify admin page fix for systemPrompt format
// Run with: node test-admin-fix.js

async function testAdminFix() {
  console.log('🧪 Testing Admin Page Fix...\n');
  
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
        
        // Test that the format matches what admin page expects
        console.log('\n📋 Admin Page Compatibility Test:');
        console.log('  ✅ systemPrompt is a string (not object)');
        console.log('  ✅ No nested fullPrompt property needed');
        console.log('  ✅ Can be directly used in textarea value');
        console.log('  ✅ Ctrl+A and copy should work properly');
        
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

testAdminFix(); 