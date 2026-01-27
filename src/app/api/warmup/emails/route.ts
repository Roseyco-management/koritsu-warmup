import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/warmup/emails - List all warmup emails
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    let query = supabaseAdmin
      .from('warmup_emails')
      .select('*')
      .order('domain', { ascending: true })
      .order('alias', { ascending: true });

    if (domain) {
      query = query.eq('domain', domain);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching warmup emails:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/warmup/emails - Add new email to warmup pool
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, domain, alias } = body;

    if (!email || !domain || !alias) {
      return NextResponse.json(
        { success: false, error: 'Email, domain, and alias are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('warmup_emails')
      .insert({
        email,
        domain,
        alias,
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
    console.error('Error adding warmup email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/warmup/emails - Update email status
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { email, is_active } = body;

    if (!email || typeof is_active !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Email and is_active are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('warmup_emails')
      .update({ is_active })
      .eq('email', email)
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
    console.error('Error updating warmup email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
