import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const action = searchParams.get('action') || 'shared';
  const username = searchParams.get('username') || 'Someone';
  const targetUsername = searchParams.get('targetUsername') || '';
  const fid = searchParams.get('fid') || '';
  const targetFid = searchParams.get('targetFid') || '';

  // Generate dynamic button title based on action
  let buttonTitle = '🏠 Join the Fun';
  let shareText = `${username} shared something on RealEstate Rizz!`;

  switch (action) {
    case 'voted':
      buttonTitle = '❤️ Vote Too';
      shareText = `${username} voted for ${targetUsername}'s house in RealEstate Rizz!`;
      break;
    case 'stayed':
      buttonTitle = '🏨 Stay Here';
      shareText = `${username} is staying at ${targetUsername}'s house in RealEstate Rizz!`;
      break;
    case 'upgraded':
      buttonTitle = '⬆️ Upgrade Mine';
      shareText = `${username} upgraded their house to level ${searchParams.get('level') || 'higher'} in RealEstate Rizz!`;
      break;
    case 'built':
      buttonTitle = '🏠 Build Yours';
      shareText = `${username} built their first house in RealEstate Rizz!`;
      break;
  }

  // Generate dynamic image URL
  const imageUrl = `https://real-estate-rizz.vercel.app/api/share/image?action=${action}&username=${encodeURIComponent(username)}&targetUsername=${encodeURIComponent(targetUsername)}`;

  // Determine the action URL (where to send users when they click the button)
  let actionUrl = 'https://real-estate-rizz.vercel.app';
  if (action === 'voted' || action === 'stayed') {
    actionUrl = `https://real-estate-rizz.vercel.app/explore`;
  } else if (action === 'upgraded' || action === 'built') {
    actionUrl = `https://real-estate-rizz.vercel.app/dashboard`;
  }

  const miniAppEmbed = {
    version: "1",
    imageUrl,
    button: {
      title: buttonTitle,
      action: {
        type: "launch_frame",
        url: actionUrl,
        name: "RealEstate Rizz"
      }
    }
  };

  // Return HTML with meta tags for sharing
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${shareText}</title>
    <meta name="fc:miniapp" content="${JSON.stringify(miniAppEmbed).replace(/"/g, '&quot;')}" />
    <meta name="fc:frame" content="${JSON.stringify(miniAppEmbed).replace(/"/g, '&quot;')}" />
    <meta property="og:title" content="${shareText}" />
    <meta property="og:description" content="Join the RealEstate Rizz community!" />
    <meta property="og:image" content="${imageUrl}" />
</head>
<body>
    <div style="text-align: center; padding: 40px; font-family: Arial, sans-serif;">
        <h1>${shareText}</h1>
        <p>Click the button above to join RealEstate Rizz and start building your empire!</p>
        <a href="${actionUrl}" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px;">${buttonTitle}</a>
    </div>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
    },
  });
}