'use client';

import { useState } from 'react';
import { MOODS, MOODS_BY_KEY } from '@/lib/moods';

interface Props {
  initialMessage?: string;
  initialMood?: string;
  recipientName?: string;
  onChange?: (message: string) => void;
  /** Form field name when used inside a form (defaults to "card_message") */
  name?: string;
  maxLength?: number;
}

export function CardMessageSuggest({
  initialMessage = '',
  initialMood = '',
  recipientName,
  onChange,
  name = 'card_message',
  maxLength = 300,
}: Props) {
  const [message, setMessage] = useState(initialMessage);
  const [mood, setMood] = useState<string>(initialMood);

  const suggestions = mood ? MOODS_BY_KEY[mood]?.sampleMessages ?? [] : [];

  function pick(s: string) {
    let finalMsg = s;
    if (recipientName && !s.includes(recipientName)) {
      // Some templates start with formal pronoun — leave alone.
      // For "Чамайг..." templates we can prepend the recipient name.
      if (s.startsWith('Чамайг') || s.startsWith('Чи')) {
        finalMsg = recipientName + ', ' + s.charAt(0).toLowerCase() + s.slice(1);
      }
    }
    setMessage(finalMsg);
    onChange?.(finalMsg);
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
          Картын мессеж (AI санал)
        </label>
        <textarea
          name={name}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            onChange?.(e.target.value);
          }}
          rows={4}
          maxLength={maxLength}
          placeholder={recipientName ? `${recipientName}-руу сэтгэлээ илэрхийлэх...` : 'Юу бичих вэ?'}
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-ink resize-none"
        />
        <div className="flex items-center justify-between text-xs text-ink/40 mt-1">
          <span>{message.length} / {maxLength}</span>
          {message && (
            <button
              type="button"
              onClick={() => {
                setMessage('');
                onChange?.('');
              }}
              className="hover:text-pinkHot"
            >
              Цэвэрлэх
            </button>
          )}
        </div>
      </div>

      {/* Mood chooser */}
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-ink/50 mb-1.5">
          Ямар сэтгэлээр?
        </label>
        <div className="flex flex-wrap gap-1.5">
          {MOODS.slice(0, 6).map((m) => {
            const isActive = mood === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setMood(isActive ? '' : m.key)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors ${
                  isActive
                    ? 'bg-ink text-white border-ink'
                    : 'bg-white text-ink border-border hover:border-ink'
                }`}
              >
                <span>{m.emoji}</span>
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI suggestions */}
      {suggestions.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-ink/50 mb-2">
            ✨ AI санал — нэг дарж хуулна
          </div>
          <div className="space-y-1.5">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pick(s)}
                className="w-full text-left bg-offwhite hover:bg-blush border border-border hover:border-pinkHot rounded-lg px-3 py-2 text-sm text-ink/80 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
