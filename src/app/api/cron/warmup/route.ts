import { NextResponse } from 'next/server';
import { runWarmupCycle, updateWarmupLimits } from '@/lib/warmup/scheduler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for cron

// POST /api/cron/warmup - Run warmup cycle (called by Vercel Cron)
export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.WARMUP_CRON_SECRET}`;

    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Warmup Cron] Starting warmup cycle...');

    // Update warmup limits based on week progression
    await updateWarmupLimits();

    // Run warmup cycle
    const result = await runWarmupCycle();

    console.log(`[Warmup Cron] Completed: ${result.emailsSent} emails sent`);

    if (result.errors.length > 0) {
      console.error('[Warmup Cron] Errors:', result.errors);
    }

    return NextResponse.json({
      success: result.success,
      emailsSent: result.emailsSent,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Warmup Cron] Fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET /api/cron/warmup - Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Warmup cron endpoint is running',
    timestamp: new Date().toISOString(),
  });
}
