// Test script to send email from bluepillar domain
const { Resend } = require('resend');

const resend = new Resend('re_VqMqLX2o_HTHcbdfNvXgUeoVZ5wpFZCBf');

async function sendTestEmail() {
  try {
    console.log('Sending test email from bluepillar domain...');

    const { data, error } = await resend.emails.send({
      from: 'warmup@bluepillar.co',
      to: 'warmup@usekoritsu.com',
      subject: 'Test Email from Blue Pillar Domain',
      text: 'This is a test email to verify that the bluepillar.co domain is properly configured for sending and receiving emails through Resend.',
      headers: {
        'Message-ID': `<test-${Date.now()}@bluepillar.co>`,
      },
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', data.id);
    console.log('📬 From: warmup@bluepillar.co');
    console.log('📭 To: warmup@usekoritsu.com');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

sendTestEmail();
