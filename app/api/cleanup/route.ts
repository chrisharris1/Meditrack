import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredUnavailability } from '@/lib/unavailabilityStorage';

export async function GET(_request: NextRequest) {
  try {
    console.log('🧹 Server-side cleanup triggered');

    const result = await cleanupExpiredUnavailability();

    console.log(`✅ Server cleanup completed: ${result.cleaned.length} expired slots removed for doctors: ${result.updatedDoctors.join(', ')}`);

    return NextResponse.json({
      success: true,
      cleaned: result.cleaned.length,
      updatedDoctors: result.updatedDoctors,
      message: `Cleaned up ${result.cleaned.length} expired slots for ${result.updatedDoctors.length} doctors`
    });

  } catch (error) {
    console.error('❌ Server cleanup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Same as GET for compatibility with different cron services
  return GET(request);
}