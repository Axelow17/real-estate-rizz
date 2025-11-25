import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const action = searchParams.get('action') || 'shared';
  const username = searchParams.get('username') || 'Someone';
  const targetUsername = searchParams.get('targetUsername') || 'a house';
  const appName = 'RealEstate Rizz';

  // Generate dynamic text based on action
  let actionText = '';
  let emoji = '🏠';

  switch (action) {
    case 'voted':
      actionText = `${username} voted for ${targetUsername}'s house!`;
      emoji = '❤️';
      break;
    case 'stayed':
      actionText = `${username} is staying at ${targetUsername}'s house!`;
      emoji = '🏨';
      break;
    case 'upgraded':
      actionText = `${username} upgraded their house!`;
      emoji = '⬆️';
      break;
    case 'built':
      actionText = `${username} built their first house!`;
      emoji = '🎉';
      break;
    default:
      actionText = `${username} shared something on ${appName}`;
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f0ec',
          backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          fontSize: 32,
          fontWeight: 'bold',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 40,
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 40 }}>{emoji}</span>
        </div>
        <div
          style={{
            maxWidth: 500,
            wordWrap: 'break-word',
            lineHeight: 1.2,
          }}
        >
          {actionText}
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 'normal',
            marginTop: 10,
            opacity: 0.9,
          }}
        >
          {appName}
        </div>
      </div>
    ),
    {
      width: 600,
      height: 400,
    }
  );
}