import handler from '../netlify/functions/admin-expire-food.mjs';

// Mock request
const headersMap = new Map([
  ['x-user-id', 'u_alice']
]);

const req = {
  method: 'POST',
  headers: {
    get: (key) => headersMap.get(key) || null
  }
};

async function run() {
  try {
    const res = await handler(req);
    console.log('Status:', res.status);
    console.log('Body:', await res.text());
  } catch (err) {
    console.error('Error during test:', err);
  }
}

run();
