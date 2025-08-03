import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const { email, message, to } = await request.json();

    if (!email || !message) {
      return NextResponse.json(
        { error: 'Email and message are required' },
        { status: 400 }
      );
    }

    // Read API key from environment
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Resend API key not configured. Please set RESEND_API_KEY in your .env.local file.' },
        { status: 500 }
      );
    }

    // Use your verified sender address
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: 'Pulse Kontakt <kontakt@pulsenewsai.com>', // verified sender
      to: [to || 'pulseaiapp8@gmail.com'],
      subject: 'Nowe zgłoszenie testera - Pulse App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">Nowe zgłoszenie testera</h2>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Wiadomość:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <p style="color: #666; font-size: 14px;">To zgłoszenie zostało wysłane z formularza na stronie Pulse App.</p>
        </div>
      `,
      replyTo: email, // set reply-to to user's email
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Email sent successfully',
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error },
      { status: 500 }
    );
  }
} 