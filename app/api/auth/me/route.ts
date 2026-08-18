import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    
    const primaryMember = user.organizationMembers?.[0];
    const organization = primaryMember?.organization || null;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: organization?.id || null,
        organization: organization,
        organizations: user.organizationMembers?.map((m) => m.organization) || [],
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
