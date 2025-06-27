const https = require('http');

const testData = JSON.stringify({
  message: "Cách đăng ký tài khoản nhà thiết kế"
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/vertex-ai',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testData)
  }
};

console.log('🧪 Testing grounding metadata extraction...');

const req = https.request(options, (res) => {
  console.log(`📊 Status: ${res.statusCode}`);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('✅ Response received:');
      console.log('📝 Text length:', response.response ? response.response.length : 0);
      console.log('🔍 Model:', response.model);
      console.log('📚 Sources:', response.sources ? response.sources.length : 0);
      console.log('🔗 Grounding metadata present:', !!response.groundingMetadata);
      console.log('📄 Grounding chunks:', response.groundingMetadata?.groundingChunks?.length || 0);
      console.log('📄 Grounding supports:', response.groundingMetadata?.groundingSupports?.length || 0);
      
      if (response.groundingMetadata?.groundingChunks) {
        console.log('📋 First chunk title:', response.groundingMetadata.groundingChunks[0]?.retrievedContext?.title);
      }
      
      console.log('📄 First 200 chars:', response.response ? response.response.substring(0, 200) + '...' : 'No response');
    } catch (error) {
      console.log('❌ Failed to parse JSON:', error.message);
      console.log('📄 Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.write(testData);
req.end(); 