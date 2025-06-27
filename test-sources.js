const fetch = require('node-fetch');

async function testSources() {
  try {
    console.log('🧪 Testing sources feature...');
    
    const response = await fetch('http://localhost:3001/api/vertex-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'cách sử dụng tay nắm tủ'
      })
    });

    const data = await response.json();
    
    console.log('📊 Status:', response.status);
    console.log('📝 Response length:', data.response?.length || 0);
    console.log('📚 Sources count:', data.sources?.length || 0);
    
    if (data.sources && data.sources.length > 0) {
      console.log('\n🔗 Sources found (showing first 10):');
      data.sources.slice(0, 10).forEach((source, index) => {
        console.log(`${index + 1}. ${source.displayTitle}`);
        console.log(`   URL: ${source.url}`);
      });
      
      if (data.sources.length > 10) {
        console.log(`\n⚠️  Note: ${data.sources.length} sources found, but only showing first 10`);
      }
    }
    
    // Check if sources are appended to response
    if (data.response && data.response.includes('📚 Tài liệu tham khảo:')) {
      console.log('\n✅ Sources section found in response!');
      const sourcesSection = data.response.split('📚 Tài liệu tham khảo:')[1];
      console.log('📄 Sources section preview:', sourcesSection.substring(0, 300) + '...');
    } else {
      console.log('\n❌ Sources section not found in response');
      console.log('📄 Response preview:', data.response?.substring(0, 200) + '...');
    }
    
    // Check grounding metadata
    if (data.groundingMetadata) {
      console.log('\n🔍 Grounding metadata present:', !!data.groundingMetadata);
      console.log('📄 Grounding chunks:', data.groundingMetadata.groundingChunks?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSources(); 