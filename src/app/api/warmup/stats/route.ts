import { NextResponse } from 'next/server';
import { getWarmupStats, getDomainOverview } from '@/lib/warmup/stats';

export const dynamic = 'force-dynamic';

// GET /api/warmup/stats
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') || undefined;
    const days = parseInt(searchParams.get('days') || '7', 10);

    // Get overview of all domains
    const overview = await getDomainOverview();

    // Get detailed stats
    const stats = await getWarmupStats(domain, days);

    return NextResponse.json({
      success: true,
      data: {
        overview,
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching warmup stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
