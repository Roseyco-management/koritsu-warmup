import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { supabaseAdmin } from '@/lib/db';
import { incrementWarmupStat } from '@/lib/warmup/stats';
import { sendWarmupEmail, getThreadReferences } from '@/lib/warmup/sender';
import { generateWarmupReply, generateReplyDelay } from '@/lib/warmup/content';

export const dynamic = 'force-dynamic';

interface ResendInboundPayload {
  type: 'email.received';
  created_at: string;
  data: {
    from: string;
    to: string;
    subject: string;
    html?: string;
    text?: string;
    headers: {
      'message-id': string;
      'in-reply-to'?: string;
      references?: string;
    };
  };
}

// POST /api/webhooks/resend/warmup
export async function POST(request: Request) {
  try {
    // Get webhook secret
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Missing RESEND_WEBHOOK_SECRET');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get the raw body and headers
    const body = await request.text();
    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('Missing Svix headers');
      return NextResponse.json(
        { error: 'Missing Svix headers' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const wh = new Webhook(webhookSecret);
    let payload: ResendInboundPayload;

    try {
      payload = wh.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ResendInboundPayload;
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook verification failed' },
        { status: 400 }
      );
    }

    // Only process email.received events
    if (payload.type !== 'email.received') {
      return NextResponse.json({ success: true, message: 'Event ignored' });
    }

    const { from, to, subject, text, headers } = payload.data;
    const messageId = headers['message-id'];
    const inReplyTo = headers['in-reply-to'];

    console.log(`[Webhook] Received email: ${from} -> ${to}`);

    // Check if sender is from warmup pool
    const { data: fromEmail } = await supabaseAdmin
      .from('warmup_emails')
      .select('*')
      .eq('email', from)
      .single();

    // Check if recipient is in warmup pool
    const { data: toEmail } = await supabaseAdmin
      .from('warmup_emails')
      .select('*')
      .eq('email', to)
      .single();

    // Only process if both are in warmup pool
    if (!fromEmail || !toEmail) {
      console.log('[Webhook] Not a warmup email, ignoring');
      return NextResponse.json({ success: true, message: 'Not a warmup email' });
    }

    // Find or create thread
    let thread;
    if (inReplyTo) {
      // This is a reply, find existing thread
      const { data: existingMessage } = await supabaseAdmin
        .from('warmup_messages')
        .select('thread_id')
        .eq('message_id', inReplyTo)
        .single();

      if (existingMessage) {
        const { data: existingThread } = await supabaseAdmin
          .from('warmup_threads')
          .select('*')
          .eq('id', existingMessage.thread_id)
          .single();

        thread = existingThread;
      }
    }

    // If no thread found, create new one
    if (!thread) {
      const { data: newThread, error: threadError } = await supabaseAdmin
        .from('warmup_threads')
        .insert({
          from_email_id: fromEmail.id,
          to_email_id: toEmail.id,
          subject: subject.replace(/^Re:\s*/i, ''),
        })
        .select()
        .single();

      if (threadError) {
        console.error('[Webhook] Failed to create thread:', threadError);
        return NextResponse.json(
          { error: 'Failed to create thread' },
          { status: 500 }
        );
      }

      thread = newThread;
    }

    // Log the received message
    await supabaseAdmin.from('warmup_messages').insert({
      thread_id: thread.id,
      from_email: from,
      to_email: to,
      subject,
      body: text || '',
      message_id: messageId,
      in_reply_to: inReplyTo || null,
      direction: 'received',
      status: 'received',
      sent_at: new Date().toISOString(),
    });

    // Update recipient email stats
    const { data: emailData } = await supabaseAdmin
      .from('warmup_emails')
      .select('daily_receive_count, total_received')
      .eq('email', to)
      .single();

    if (emailData) {
      await supabaseAdmin
        .from('warmup_emails')
        .update({
          daily_receive_count: (emailData.daily_receive_count || 0) + 1,
          total_received: (emailData.total_received || 0) + 1,
          last_received_at: new Date().toISOString(),
        })
        .eq('email', to);
    }

    // Update thread
    const { data: threadData } = await supabaseAdmin
      .from('warmup_threads')
      .select('message_count')
      .eq('id', thread.id)
      .single();

    if (threadData) {
      await supabaseAdmin
        .from('warmup_threads')
        .update({
          message_count: (threadData.message_count || 0) + 1,
          last_message_id: messageId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', thread.id);
    }

    // Update stats
    const recipientDomain = to.split('@')[1];
    await incrementWarmupStat(recipientDomain, 'emails_received');

    // Schedule a reply with random delay (1-4 hours)
    // In production, you'd use a queue system. For now, we'll just log it
    // and rely on the cron job to potentially pick it up
    const replyDelay = generateReplyDelay();
    console.log(`[Webhook] Would schedule reply in ${Math.floor(replyDelay / 1000 / 60)} minutes`);

    // Optionally: Immediately send a reply if thread is active and has few messages
    // For now, we'll let the cron job handle replies naturally

    return NextResponse.json({
      success: true,
      message: 'Email processed',
      threadId: thread.id,
    });
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/webhooks/resend/warmup - Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Warmup webhook endpoint is running',
  });
}
