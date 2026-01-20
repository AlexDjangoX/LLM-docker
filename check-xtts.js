#!/usr/bin/env node
/**
 * Quick diagnostic to check if XTTS service is running and accessible
 * Usage: node check-xtts.js [port]
 */

const port = process.argv[2] || process.env.XTTS_PORT || '8000';
const xttsUrl = process.env.XTTS_URL || `http://localhost:${port}`;

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║           XTTS Service Diagnostic Check                   ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function checkXTTS() {
  console.log(`🔍 Checking XTTS service at: ${xttsUrl}\n`);

  // 1. Check if service is reachable
  console.log('1️⃣  Testing connection...');
  try {
    const response = await fetch(`${xttsUrl}/languages`, { 
      signal: AbortSignal.timeout(5000) 
    });
    
    if (!response.ok) {
      console.log(`   ❌ Service responded with status ${response.status}`);
      console.log(`   Response: ${await response.text()}\n`);
      return false;
    }
    
    const languages = await response.json();
    console.log(`   ✅ Service is running`);
    console.log(`   Supported languages: ${languages.join(', ')}\n`);
  } catch (error) {
    console.log(`   ❌ Cannot connect to XTTS service`);
    console.log(`   Error: ${error.message}\n`);
    console.log('💡 Troubleshooting:');
    console.log('   - Check if XTTS container is running: docker ps | grep xtts');
    console.log('   - Start the service: docker-compose up -d xtts');
    console.log('   - Check logs: docker logs xtts');
    console.log('   - Verify port mapping in docker-compose.yml\n');
    return false;
  }

  // 2. Check speakers endpoint
  console.log('2️⃣  Testing speakers endpoint...');
  try {
    const response = await fetch(`${xttsUrl}/studio_speakers`, {
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      console.log(`   ❌ Speakers endpoint failed: ${response.status}\n`);
      return false;
    }
    
    const speakers = await response.json();
    const speakerNames = Object.keys(speakers);
    console.log(`   ✅ Found ${speakerNames.length} speakers`);
    console.log(`   Available: ${speakerNames.slice(0, 5).join(', ')}${speakerNames.length > 5 ? '...' : ''}\n`);
  } catch (error) {
    console.log(`   ❌ Failed to fetch speakers: ${error.message}\n`);
    return false;
  }

  // 3. Test TTS generation with short text
  console.log('3️⃣  Testing TTS generation (short text)...');
  try {
    const speakersResponse = await fetch(`${xttsUrl}/studio_speakers`);
    const speakers = await speakersResponse.json();
    const speakerData = speakers['Claribel Dervla'];
    
    if (!speakerData) {
      console.log('   ⚠️  Default speaker "Claribel Dervla" not found\n');
      return false;
    }

    const testText = 'Hello, this is a test.';
    console.log(`   Text: "${testText}" (${testText.length} chars)`);
    
    const startTime = Date.now();
    const ttsResponse = await fetch(`${xttsUrl}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: testText,
        language: 'en',
        speaker_embedding: speakerData.speaker_embedding,
        gpt_cond_latent: speakerData.gpt_cond_latent
      }),
      signal: AbortSignal.timeout(60000) // 1 minute
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (!ttsResponse.ok) {
      const error = await ttsResponse.text();
      console.log(`   ❌ TTS generation failed (${ttsResponse.status})`);
      console.log(`   Error: ${error}\n`);
      return false;
    }
    
    const responseText = await ttsResponse.text();
    const base64Audio = responseText.replace(/^"|"$/g, '');
    const audioSize = Buffer.from(base64Audio, 'base64').length;
    
    console.log(`   ✅ TTS generation successful`);
    console.log(`   Processing time: ${duration}s`);
    console.log(`   Audio size: ${(audioSize / 1024).toFixed(2)} KB\n`);
  } catch (error) {
    console.log(`   ❌ TTS generation failed: ${error.message}\n`);
    return false;
  }

  // All checks passed
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  ✅ All XTTS service checks passed!                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('📊 Next steps:');
  console.log('   - The XTTS service is working correctly');
  console.log('   - If your app still fails, check:');
  console.log('     1. Environment variables (XTTS_URL in .env)');
  console.log('     2. Network connectivity between containers');
  console.log('     3. Application logs for detailed errors\n');
  
  return true;
}

checkXTTS().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
