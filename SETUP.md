# Setup Guide for Pulse Landing Page

## Environment Variables

To enable email functionality, you need to set up the following environment variable:

### 1. Create `.env.local` file

Create a `.env.local` file in the root directory with the following content:

```
RESEND_API_KEY=your_resend_api_key_here
```

### 2. Get Resend API Key

1. Go to [Resend.com](https://resend.com)
2. Sign up for a free account
3. Go to the API Keys section
4. Create a new API key
5. Copy the API key and replace `your_resend_api_key_here` in the `.env.local` file

### 3. Domain Verification (Optional)

For production use, you may want to verify your domain with Resend to send emails from your own domain instead of the default Resend domain.

## Features Implemented

✅ **Dark Theme**: True black and dark gray backgrounds (no blue/navy tones)
✅ **Image Fix**: All images now load from `/public/landing/` with proper Next.js Image components
✅ **Email Functionality**: Real email sending using Resend service
✅ **Mobile Responsive**: Fully responsive design
✅ **Polish Language**: All text in Polish
✅ **Modern UI**: Ultra-modern design with shadows, rounded corners, and proper spacing
✅ **Footer Update**: Shows "Kontakt: pulseaiapp8@gmail.com" as plain text
✅ **No White Bar**: Removed white bar under navbar for seamless dark design

## Design Changes Made

### Background Colors
- Main background: `bg-black` (#000000)
- Section backgrounds: `bg-gray-900` (#171717) and `bg-black`
- Card backgrounds: `bg-gray-800` (#1f2937)
- No blue/navy tones - pure black and gray palette

### Footer
- Solid black background matching navbar
- Plain text: "Kontakt: pulseaiapp8@gmail.com"
- No mailto link, just display text
- Added border-top for visual separation

### Text Colors
- All main text uses `#E1EEE6` for high contrast on black
- Modern, geometric font throughout

## Testing

1. Start the development server: `npm run dev`
2. Visit `http://localhost:3000/landing`
3. Test the form submission
4. Verify images load correctly at:
   - `http://localhost:3000/landing/1.png`
   - `http://localhost:3000/landing/2.png`
   - `http://localhost:3000/landing/3.png`

## Email Testing

The form will send emails to `pulseaiapp8@gmail.com` with:
- Professional HTML formatting
- Reply-to set to the user's email
- Subject: "Nowe zgłoszenie testera - Pulse App"

### Email Functionality Notes

- If Resend API key is not configured, the form will still work and log submissions to console
- When API key is properly set up, emails will be delivered to the inbox
- The system gracefully handles missing API keys for development/testing

## Troubleshooting

### Email Not Working
1. Check that `.env.local` file exists in root directory
2. Verify RESEND_API_KEY is set correctly
3. Restart the development server after adding environment variables
4. Check console logs for any error messages

### Images Not Loading
1. Ensure images are in `public/landing/` directory
2. Verify file names match exactly: `1.png`, `2.png`, `3.png`
3. Check that images are actual PNG files, not text placeholders 