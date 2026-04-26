'use client';

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';

type Situation = 'live' | 'dead' | 'pickup';
type InputMode = 'screenshot' | 'paste';
type Gender = 'guy' | 'girl';
type RecipientType = 'match' | 'crush' | 'situationship' | 'ex' | 'friendzone_suspect';
type Platform = 'hinge' | 'bumble' | 'ig_dm' | 'in_person';

const MAX_SCREENSHOTS = 4;
const MAX_PASTE_CHARS = 3000;

const RECIPIENT_OPTIONS: { value: RecipientType; label: string }[] = [
  { value: 'match', label: 'Match' },
  { value: 'crush', label: 'Crush' },
  { value: 'situationship', label: 'Situationship' },
  { value: 'ex', label: 'Ex' },
  { value: 'friendzone_suspect', label: 'Friend (suspected friendzone)' },
];

const PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: 'hinge', label: 'Hinge' },
  { value: 'bumble', label: 'Bumble' },
  { value: 'ig_dm', label: 'IG DM' },
  { value: 'in_person', label: 'In person' },
];

const CTA_LABEL: Record<Situation, string> = {
  live: 'Read the room',
  dead: 'Revive this chat',
  pickup: 'Generate lines',
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? 'border-neutral-900 bg-neutral-900 text-white'
          : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
      }`}
    >
      {children}
    </button>
  );
}

export default function HomePage() {
  const [situation, setSituation] = useState<Situation>('live');
  const [inputMode, setInputMode] = useState<InputMode>('screenshot');
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [pastedText, setPastedText] = useState('');
  const [userGender, setUserGender] = useState<Gender>('guy');
  const [recipientType, setRecipientType] = useState<RecipientType>('match');
  const [aboutHer, setAboutHer] = useState('');
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPickup = situation === 'pickup';

  function addFiles(incoming: FileList | File[]) {
    const images = Array.from(incoming).filter((f) => f.type.startsWith('image/'));
    if (screenshots.length + images.length > MAX_SCREENSHOTS) {
      setError(`Max ${MAX_SCREENSHOTS} screenshots.`);
      const room = MAX_SCREENSHOTS - screenshots.length;
      if (room > 0) setScreenshots([...screenshots, ...images.slice(0, room)]);
      return;
    }
    setError(null);
    setScreenshots([...screenshots, ...images]);
  }

  function onFileInput(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }

  function removeScreenshot(idx: number) {
    setScreenshots(screenshots.filter((_, i) => i !== idx));
    setError(null);
  }

  function onPasteChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setPastedText(e.target.value.slice(0, MAX_PASTE_CHARS));
  }

  const hasInput = isPickup
    ? platform !== null
    : inputMode === 'screenshot'
      ? screenshots.length > 0
      : pastedText.trim().length > 0;

  function onSubmit() {
    const payload = isPickup
      ? {
          situation,
          aboutHer: aboutHer || null,
          platform,
        }
      : {
          situation,
          inputType: inputMode,
          screenshots:
            inputMode === 'screenshot' ? screenshots.map((f) => f.name) : null,
          pastedText: inputMode === 'paste' ? pastedText : null,
          userGender,
          recipientType,
        };
    // eslint-disable-next-line no-console
    console.log('SavyyCoach input state:', payload);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="text-3xl font-semibold">SavyyCoach</h1>
        <p className="text-neutral-600">Read the room.</p>
      </header>

      <section className="flex flex-wrap gap-2">
        <Chip active={situation === 'live'} onClick={() => setSituation('live')}>
          Live convo
        </Chip>
        <Chip active={situation === 'dead'} onClick={() => setSituation('dead')}>
          Dead chat
        </Chip>
        <Chip active={situation === 'pickup'} onClick={() => setSituation('pickup')}>
          Pickup line
        </Chip>
      </section>

      {!isPickup && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700">
              {inputMode === 'screenshot' ? 'Drop screenshots' : 'Paste conversation'}
            </span>
            <button
              type="button"
              onClick={() =>
                setInputMode(inputMode === 'screenshot' ? 'paste' : 'screenshot')
              }
              className="text-sm text-neutral-600 underline-offset-2 hover:underline"
            >
              {inputMode === 'screenshot'
                ? 'or paste text instead'
                : 'or upload screenshots'}
            </button>
          </div>

          {inputMode === 'screenshot' ? (
            <>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-6 py-10 text-center transition ${
                  isDragging
                    ? 'border-neutral-900 bg-neutral-100'
                    : 'border-neutral-300 bg-white hover:border-neutral-500'
                }`}
              >
                <p className="text-sm text-neutral-700">
                  Drop 1–4 screenshots, or click to upload
                </p>
                <p className="text-xs text-neutral-500">
                  {screenshots.length}/{MAX_SCREENSHOTS} added
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onFileInput}
                  className="hidden"
                />
              </div>

              {screenshots.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {screenshots.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded border border-neutral-200 bg-white px-3 py-2 text-sm"
                    >
                      <span className="truncate text-neutral-700">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => removeScreenshot(i)}
                        className="text-xs text-neutral-500 hover:text-neutral-900"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {error && <p className="text-xs text-red-600">{error}</p>}
            </>
          ) : (
            <>
              <textarea
                value={pastedText}
                onChange={onPasteChange}
                placeholder="Paste the conversation here..."
                rows={10}
                className="w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
              />
              <div className="flex justify-between text-xs text-neutral-500">
                <span>Conversation too long? Just paste the last ~20 messages.</span>
                <span>
                  {pastedText.length}/{MAX_PASTE_CHARS}
                </span>
              </div>
            </>
          )}
        </section>
      )}

      {isPickup && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-700">
              Tell me about her (optional) — her bio, what you know
            </label>
            <textarea
              value={aboutHer}
              onChange={(e) => setAboutHer(e.target.value)}
              rows={4}
              className="w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-neutral-700">Platform</span>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map((p) => (
                <Chip
                  key={p.value}
                  active={platform === p.value}
                  onClick={() => setPlatform(p.value)}
                >
                  {p.label}
                </Chip>
              ))}
            </div>
          </div>
        </section>
      )}

      {!isPickup && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-neutral-700">I am:</span>
            <Chip active={userGender === 'guy'} onClick={() => setUserGender('guy')}>
              Guy
            </Chip>
            <Chip active={userGender === 'girl'} onClick={() => setUserGender('girl')}>
              Girl
            </Chip>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-neutral-700">
              She/he is my:
            </span>
            {RECIPIENT_OPTIONS.map((r) => (
              <Chip
                key={r.value}
                active={recipientType === r.value}
                onClick={() => setRecipientType(r.value)}
              >
                {r.label}
              </Chip>
            ))}
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={!hasInput}
        className="rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        {CTA_LABEL[situation]}
      </button>

      <footer className="mt-4 border-t border-neutral-200 pt-4 text-xs text-neutral-500">
        Your chats stay on your device. Nothing uploaded, nothing saved to a server.
      </footer>
    </main>
  );
}
