'use client';

import { useEffect } from 'react';

// Replaces the root layout when an error escapes it, so it must render its own
// <html>/<body> and can't rely on globals.css — use inline styles.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="mn">
      <body>
        <main
          style={{
            maxWidth: 420,
            margin: '0 auto',
            padding: '96px 24px',
            textAlign: 'center',
            fontFamily: 'Georgia, serif',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 24 }}>🥀</div>
          <h1 style={{ fontStyle: 'italic', fontSize: 24, marginBottom: 8 }}>
            Алдаа гарлаа
          </h1>
          <p style={{ color: '#6b6b6b', fontSize: 14, marginBottom: 32 }}>
            Уучлаарай, ямар нэг зүйл буруу болсон байна.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '10px 20px',
              borderRadius: 9999,
              background: '#1a1a1a',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Дахин ачаалах
          </button>
        </main>
      </body>
    </html>
  );
}
