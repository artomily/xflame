import { useState, type FormEvent, type ReactNode } from "react";
import { type Note } from "../bindings/index.ts";
import { connectFreighter, createContractClient } from "./stellar";
import Faucet from "./Faucet";
import Send from "./Send";

type Tab = "notes" | "faucet" | "send";

const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

function NotesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8M16 17H8" />
    </svg>
  );
}

function FaucetIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.5S5.5 10 5.5 15a6.5 6.5 0 0 0 13 0c0-5-6.5-12.5-6.5-12.5z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4z" />
    </svg>
  );
}

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: "notes", label: "Notes", icon: <NotesIcon /> },
  { id: "faucet", label: "Faucet", icon: <FaucetIcon /> },
  { id: "send", label: "Send", icon: <SendIcon /> },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("notes");
  const [wallet, setWallet] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");

  const fail = (err: unknown) =>
    setError(err instanceof Error ? err.message : "Something went wrong");

  function switchTab(t: Tab) {
    setTab(t);
    setError("");
  }

  async function handleGetNotes() {
    try {
      setError("");
      const tx = await createContractClient(wallet).get_notes();
      setNotes(tx.result ?? []);
      setHasLoaded(true);
    } catch (err) {
      fail(err);
    }
  }

  async function handleCreateNote(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    try {
      setError("");
      const client = createContractClient(wallet);
      const tx = await client.create_note({
        title: String(form.get("title")),
        content: String(form.get("content")),
      });
      await tx.signAndSend();
      formEl.reset();
      await handleGetNotes();
    } catch (err) {
      fail(err);
    }
  }

  async function handleDeleteNote(id: Note["id"]) {
    try {
      setError("");
      const client = createContractClient(wallet);
      const tx = await client.delete_note({ id });
      await tx.signAndSend();
      await handleGetNotes();
    } catch (err) {
      fail(err);
    }
  }

  return (
    <main className="flex min-h-svh flex-col bg-canvas text-ink">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-edge bg-canvas/80 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <span className="flex items-center gap-2">
            <img src="/ame.png" alt="Ame" className="h-8 w-8 object-contain" />
            <span className="text-lg font-bold tracking-tight">
              x<span className="text-brand">flame</span>
            </span>
          </span>

          {/* Desktop tabs */}
          <nav className="hidden gap-1 rounded-lg border border-edge bg-surface p-1 sm:flex">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => switchTab(t.id)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  tab === t.id
                    ? "bg-brand text-brand-fg"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <span className="rounded-full border border-edge bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-muted sm:hidden">
            Testnet
          </span>
        </div>
      </header>

      {/* Page content — bottom padding clears the mobile nav */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center gap-6 px-4 pb-28 pt-8 sm:px-6 sm:pb-12 sm:pt-10">
        {tab === "faucet" && <Faucet />}

        {tab === "send" && <Send />}

        {tab === "notes" && (
          <>
            {!wallet ? (
              /* Hero */
              <div className="flex flex-col items-center gap-5 pt-4 text-center">
                <img
                  src="/dino.png"
                  alt="Ame's dino buddy holding a blue flame"
                  className="ame-float w-44 sm:w-52"
                />
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Notes that live <span className="text-brand">on-chain</span>
                  </h1>
                  <p className="mx-auto mt-2 max-w-xs text-sm text-ink-muted">
                    Write, read, and delete notes stored in a Soroban smart
                    contract on Stellar testnet.
                  </p>
                </div>
                <button
                  type="button"
                  className="w-full max-w-xs rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                  onClick={async () => {
                    try {
                      setError("");
                      setWallet(await connectFreighter());
                    } catch (err) {
                      fail(err);
                    }
                  }}
                >
                  Connect Freighter
                </button>
                <p className="text-xs text-ink-muted">
                  Testnet only — no real funds involved.
                </p>
              </div>
            ) : (
              <>
                {/* Wallet chip */}
                <div className="flex w-full items-center justify-between rounded-xl border border-edge bg-surface px-4 py-2.5">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
                    <span className="font-mono text-xs text-ink-muted">{shortAddr(wallet)}</span>
                  </span>
                  <button
                    type="button"
                    className="text-xs text-ink-muted underline underline-offset-2 hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
                    onClick={() => { setWallet(""); setNotes([]); setHasLoaded(false); }}
                  >
                    Disconnect
                  </button>
                </div>

                <button
                  type="button"
                  className="w-full rounded-xl border border-edge bg-surface px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface-mid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  onClick={handleGetNotes}
                >
                  Load notes
                </button>

                {hasLoaded && notes.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-2 text-center">
                    <img src="/dino.png" alt="" className="w-24 opacity-90" />
                    <p className="text-sm text-ink-muted">
                      No notes yet. Write your first one below.
                    </p>
                  </div>
                )}

                {notes.length > 0 && (
                  <ul className="flex w-full flex-col gap-2">
                    {notes.map((note) => (
                      <li
                        key={String(note.id)}
                        className="rounded-xl border border-edge bg-surface p-4"
                      >
                        <p className="font-medium text-ink">{note.title}</p>
                        <p className="mt-1 text-sm text-ink-muted">{note.content}</p>
                        <button
                          type="button"
                          className="mt-3 text-xs text-danger underline underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* New note */}
                <form
                  className="flex w-full flex-col gap-2 rounded-xl border border-edge bg-surface p-4"
                  onSubmit={handleCreateNote}
                >
                  <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                    New note
                  </p>
                  <input
                    name="title"
                    placeholder="Title"
                    required
                    className="rounded-lg border border-edge bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <textarea
                    name="content"
                    placeholder="Content"
                    rows={3}
                    required
                    className="rounded-lg border border-edge bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-brand py-3 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    Create note
                  </button>
                </form>
              </>
            )}
          </>
        )}

        {error && <p className="text-center text-sm text-danger">{error}</p>}
      </div>

      {/* Footer (desktop) */}
      <footer className="hidden pb-6 text-center text-xs text-ink-muted sm:block">
        Runs on Stellar testnet · fueled by Ame
      </footer>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-10 border-t border-edge bg-surface/95 backdrop-blur sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-lg">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand ${
                tab === t.id ? "text-brand" : "text-ink-muted"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
