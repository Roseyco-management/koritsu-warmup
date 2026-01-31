// Test the webhook endpoint locally by simulating a Resend webhook
const crypto = require('crypto');

async function testWebhook() {
  try {
    console.log('Testing webhook endpoint locally...\n');

    // Create a mock Resend webhook payload
    const payload = {
      type: 'email.received',
      created_at: new Date().toISOString(),
      data: {
        from: 'warmup@usekoritsu.com',
        to: 'warmup@bluepillar.co',
        subject: 'Test Webhook - Receiving Test',
        text: 'This is a test email to verify the webhook is working properly.',
        html: '<p>This is a test email to verify the webhook is working properly.</p>',
        headers: {
          'message-id': `<webhook-test-${Date.now()}@usekoritsu.com>`,
        },
      },
    };

    const body = JSON.stringify(payload);

    // Note: For this test, we'll skip signature verification
    // In production, Resend will send proper Svix headers

    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('\nSending POST request to http://localhost:3000/api/webhooks/resend/warmup\n');

    // Make the request
    const response = await fetch('http://localhost:3000/api/webhooks/resend/warmup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    });

    const result = await response.json();

    console.log('Response Status:', response.status);
    console.log('Response Body:', JSON.stringify(result, null, 2));

    if (response.status === 400 && result.error === 'Missing Svix headers') {
      console.log('\n⚠️  Expected error: The webhook requires Svix signature verification.');
      console.log('This is a security feature - webhooks from Resend will include these headers.');
      console.log('\nTo test with real webhooks, you need to:');
      console.log('1. Expose this endpoint publicly (using ngrok or deploy to Vercel)');
      console.log('2. Configure the webhook URL in Resend dashboard');
      console.log('3. Send a test email to trigger the webhook');
    }

  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
  }
}

testWebhook();
