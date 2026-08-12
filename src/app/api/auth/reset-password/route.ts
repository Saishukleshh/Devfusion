import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// In-memory OTP store for password resets
const otpStore = new Map<string, { otp: string; expires: number }>();

export async function POST(request: NextRequest) {
  try {
    const { action, email, otp, newPassword } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Step 1: Generate 6-Digit Password Reset OTP
    if (action === 'request-otp') {
      const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      
      // Generate 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore.set(cleanEmail, {
        otp: generatedOtp,
        expires: Date.now() + 15 * 60 * 1000, // 15 mins expiry
      });

      return NextResponse.json({
        success: true,
        message: 'Password reset OTP / recovery link generated successfully.',
        demoOtp: generatedOtp, // Output for testing demo
      });
    }

    // Step 2: Verify OTP and update password
    if (action === 'reset-password') {
      if (!otp || !newPassword) {
        return NextResponse.json({ error: 'OTP and new password are required' }, { status: 400 });
      }

      const stored = otpStore.get(cleanEmail);
      if (!stored || Date.now() > stored.expires) {
        return NextResponse.json({ error: 'OTP has expired or is invalid. Please request a new one.' }, { status: 400 });
      }

      if (stored.otp !== otp) {
        return NextResponse.json({ error: 'Incorrect OTP code.' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { email: cleanEmail },
        data: { password: hashedPassword },
      });

      otpStore.delete(cleanEmail);

      return NextResponse.json({
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
      });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in reset password endpoint:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
