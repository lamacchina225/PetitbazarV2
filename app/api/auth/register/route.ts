import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { UserRole } from '@prisma/client';

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('225')) return `+${digits}`;
  if (digits.startsWith('0')) return `+225${digits.slice(1)}`;
  return `+225${digits}`;
}

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, phone, password, city, commune } =
      await request.json();

    const normalizedEmail = (email || '').trim().toLowerCase() || null;
    const normalizedPhone = normalizePhone(phone || '');

    if (!firstName || !lastName || !password || !city || !commune) {
      return NextResponse.json(
        { success: false, message: 'Tous les champs obligatoires doivent etre remplis' },
        { status: 400 }
      );
    }

    if (!normalizedEmail && !normalizedPhone) {
      return NextResponse.json(
        { success: false, message: 'Email ou telephone requis' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Un utilisateur avec cet email ou telephone existe deja' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: normalizedEmail,
        phone: normalizedPhone || null,
        password: hashedPassword,
        city,
        commune,
        role: UserRole.CLIENT,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Utilisateur cree avec succes',
        data: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Une erreur est survenue lors de l inscription' },
      { status: 500 }
    );
  }
}
