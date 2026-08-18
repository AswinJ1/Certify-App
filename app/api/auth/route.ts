import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword, signToken } from '@/lib/auth';

// POST /api/auth
export async function POST(request: NextRequest) {
  try {
    const { email, password, action, name, organizationName, organizationId } = await request.json();

    if (action === 'register') {
      const existingUsers = await prisma.user.count();
      const role = existingUsers === 0 ? 'SUPER_ADMIN' : 'ORG_ADMIN';

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
      }

      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          name: name || email.split('@')[0],
          email,
          passwordHash,
          role,
        },
      });

      // If ORG_ADMIN, ensure they have an organization
      let userOrgId = organizationId;
      if (role === 'ORG_ADMIN') {
        if (!userOrgId) {
          // Create or associate with an organization
          const orgName = organizationName || `${user.name}'s Organization`;
          const newOrg = await prisma.organization.create({
            data: {
              name: orgName,
              email: user.email,
            },
          });
          userOrgId = newOrg.id;
        }

        await prisma.organizationMember.create({
          data: {
            userId: user.id,
            organizationId: userOrgId,
            role: 'ORG_ADMIN',
          },
        });
      }

      const token = signToken({ userId: user.id, email: user.email, role: user.role });

      const response = NextResponse.json({
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role,
          organizationId: userOrgId || null,
        },
        message: existingUsers === 0 ? 'Super admin account created' : 'Organizer account created',
      });

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    }

    // Login
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ 
      where: { email },
      include: {
        organizationMembers: {
          include: { organization: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    const primaryOrg = user.organizationMembers?.[0]?.organization || null;

    const response = NextResponse.json({
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        organizationId: primaryOrg?.id || null,
        organization: primaryOrg,
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
