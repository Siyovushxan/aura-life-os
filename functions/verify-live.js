import fetch from 'node-fetch'; // or built-in fetch in Node 18+

const BASE_URL = 'https://us-central1-aura-f1d36.cloudfunctions.net';

async function verifyBackend() {
  console.log('🔍 Verifying AURA Cloud Backend...');

  // 1. Health Check
  try {
    const hRes = await fetch(`${BASE_URL}/healthCheck`);
    const hData = await hRes.json();
    console.log('✅ Health Check:', hData.status === 'healthy' ? 'PASS' : 'FAIL', hData);
  } catch (e) {
    console.error('❌ Health Check Failed:', e.message);
  }

  // 2. Smart Parenting Unlock (Mock Test)
  try {
    console.log('🧪 Testing Smart Parenting Unlock logic...');
    const payload = {
      data: {
        taskId: 'test_task_id',
        childId: 'test_child_id'
      }
    };
    const uRes = await fetch(`${BASE_URL}/smartParentingUnlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const uData = await uRes.json();
    console.log('✅ Unlock Response (Expected 404/Error if IDs invalid):', uData);
  } catch (e) {
    console.error('❌ Unlock Test Failed:', e.message);
  }
}

verifyBackend();
