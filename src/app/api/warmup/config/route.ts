import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/warmup/config - Get all warmup configurations
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('warmup_config')
      .select('*')
      .order('domain', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching warmup config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/warmup/config - Update warmup configuration
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { domain, daily_limit, is_active, current_week } = body;

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain is required' },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (typeof daily_limit === 'number') updates.daily_limit = daily_limit;
    if (typeof is_active === 'boolean') updates.is_active = is_active;
    if (typeof current_week === 'number') updates.current_week = current_week;

    const { data, error } = await supabaseAdmin
      .from('warmup_config')
      .update(updates)
      .eq('domain', domain)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error updating warmup config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/warmup/config - Start warmup for a domain
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { domain } = body;

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('warmup_config')
      .upsert({
        domain,
        current_week: 1,
        daily_limit: 2,
        is_active: true,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error starting warmup:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
