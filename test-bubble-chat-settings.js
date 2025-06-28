/**
 * Test script to verify Bubble API integration for chat settings
 * This will test both GET and PATCH operations for the new fields
 */

const { BUBBLE_API_URL, BUBBLE_API_KEY, environment } = require('./api/bubble-config');

async function testBubbleChatSettings() {
  console.log('🧪 Testing Bubble API Chat Settings Integration...\n');

  try {
    // Test 1: GET current configuration
    console.log('1️⃣ Testing GET request to fetch current configuration...');
    const getResponse = await fetch(BUBBLE_API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BUBBLE_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'JEGA-Knowledge-Base/1.0'
      }
    });

    console.log('📡 GET Response Status:', getResponse.status);
    
    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      console.error('❌ GET request failed:', errorText);
      return;
    }

    const getData = await getResponse.json();
    console.log('📦 GET Response Data:', JSON.stringify(getData, null, 2));

    // Check if the new fields exist
    if (getData.response && getData.response.results && getData.response.results.length > 0) {
      const config = getData.response.results[0];
      console.log('\n📋 Current Configuration:');
      console.log('- conversation_memory:', config.conversation_memory);
      console.log('- user_history:', config.user_history);
      console.log('- prompt:', config.prompt ? 'Present' : 'Missing');
      console.log('- tempature:', config.tempature);
      console.log('- top-p:', config['top-p']);
      console.log('- max_output_tokens:', config.max_output_tokens);
    }

    // Test 2: PATCH to update chat settings
    console.log('\n2️⃣ Testing PATCH request to update chat settings...');
    
    const recordId = getData.response.results[0]._id;
    console.log('📋 Record ID:', recordId);

    const updateData = {
      conversation_memory: "25",
      user_history: "150"
    };

    console.log('📤 Update Data:', JSON.stringify(updateData, null, 2));

    const patchResponse = await fetch(`${BUBBLE_API_URL}/${recordId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${BUBBLE_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'JEGA-Knowledge-Base/1.0'
      },
      body: JSON.stringify(updateData)
    });

    console.log('📡 PATCH Response Status:', patchResponse.status);

    if (!patchResponse.ok) {
      const errorText = await patchResponse.text();
      console.error('❌ PATCH request failed:', errorText);
      return;
    }

    // For 204 responses (success with no content), don't try to parse JSON
    if (patchResponse.status !== 204) {
      try {
        const patchResult = await patchResponse.json();
        console.log('📦 PATCH Response Data:', JSON.stringify(patchResult, null, 2));
      } catch (parseError) {
        console.warn('⚠️ Could not parse PATCH response as JSON:', parseError.message);
      }
    }

    console.log('✅ PATCH request successful');

    // Test 3: GET again to verify the update
    console.log('\n3️⃣ Testing GET request to verify the update...');
    const verifyResponse = await fetch(BUBBLE_API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BUBBLE_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'JEGA-Knowledge-Base/1.0'
      }
    });

    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      const updatedConfig = verifyData.response.results[0];
      
      console.log('📋 Updated Configuration:');
      console.log('- conversation_memory:', updatedConfig.conversation_memory);
      console.log('- user_history:', updatedConfig.user_history);
      
      // Verify the values were updated correctly
      if (updatedConfig.conversation_memory === "25" && updatedConfig.user_history === "150") {
        console.log('✅ Chat settings updated successfully!');
      } else {
        console.log('❌ Chat settings were not updated correctly');
      }
    }

    // Test 4: Test our API endpoint
    console.log('\n4️⃣ Testing our API endpoint with the new fields...');
    
    const apiResponse = await fetch('http://localhost:3001/api/config', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log('📋 Our API Configuration:');
      console.log('- conversationMemory:', apiData.config.chatSettings.conversationMemory);
      console.log('- userHistory:', apiData.config.chatSettings.userHistory);
      
      if (apiData.config.chatSettings.conversationMemory === 25 && apiData.config.chatSettings.userHistory === 150) {
        console.log('✅ Our API correctly parsed the Bubble data!');
      } else {
        console.log('❌ Our API did not parse the Bubble data correctly');
      }
    } else {
      console.log('❌ Our API request failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testBubbleChatSettings(); 