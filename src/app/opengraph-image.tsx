import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Decorative staff lines using divs */}
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: 500,
                height: 2,
                background: 'rgba(255,255,255,0.25)',
                borderRadius: 1,
              }}
            />
          ))}
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-0.02em',
          }}
        >
          五線譜
        </div>
        <div
          style={{
            fontSize: 28,
            color: 'rgba(255,255,255,0.6)',
            marginTop: 12,
          }}
        >
          Music Staff — Free Online Music Notation Editor
        </div>
        <div
          style={{
            fontSize: 18,
            color: 'rgba(255,255,255,0.35)',
            marginTop: 24,
          }}
        >
          Create · Edit · Play
        </div>
      </div>
    ),
    size,
  );
}
