import { useState, type FormEvent } from "react";
import { type Note } from "../bindings/index.ts";
import { connectFreighter, createContractClient } from "./stellar";
import Faucet from "./Faucet";
import Send from "./Send";
import Ame from "./Ame";

type Tab = "notes" | "faucet" | "send";

export default function App() {
  const [tab, setTab] = useState<Tab>("notes");
  const [wallet, setWallet] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState("");

  const fail = (err: unknown) =>
    setError(err instanceof Error ? err.message : "Something went wrong");

  async function handleGetNotes() {
    try {
      setError("");
      const tx = await createContractClient(wallet).get_notes();
      setNotes(tx.result ?? []);
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
    <main className="min-h-svh bg-canvas text-ink">
      {/* Top nav */}
      <header className="sticky top-0 z-10 border-b border-edge bg-canvas/80 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
          <span className="flex items-center gap-1.5 font-semibold tracking-tight text-brand">
            <Ame size={26} title="Ame" />
            xflame
          </span>
          <nav className="flex gap-1 rounded-lg border border-edge bg-surface p-1">
            {(["notes", "faucet", "send"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setError(""); }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-4 ${
                  tab === t
                    ? "bg-brand text-brand-fg"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {t}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Page content */}
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-8 sm:px-6 sm:py-10">

        {tab === "faucet" && <Faucet />}

        {tab === "send" && <Send />}

        {tab === "notes" && (
          <>
            {!wallet ? (
              <div className="flex flex-col items-center gap-3 pt-4 text-center">
                <Ame size={128} title="Ame waves hello" />
                <p className="text-sm text-ink-muted">Connect your wallet to read and write on-chain notes.</p>
                <button
                  type="button"
                  className="rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
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
              </div>
            ) : (
              <>
                <div className="flex w-full items-center justify-between">
                  <p className="break-all font-mono text-xs text-ink-muted">{wallet}</p>
                  <button
                    type="button"
                    className="ml-3 shrink-0 text-xs text-ink-muted underline underline-offset-2 hover:text-ink"
                    onClick={() => { setWallet(""); setNotes([]); }}
                  >
                    Disconnect
                  </button>
                </div>

                <button
                  type="button"
                  className="w-full rounded-lg border border-edge bg-surface px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface-mid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  onClick={handleGetNotes}
                >
                  Load Notes
                </button>

                <form className="flex w-full flex-col gap-2" onSubmit={handleCreateNote}>
                  <input
                    name="title"
                    placeholder="Title"
                    required
                    className="rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-canvas"
                  />
                  <textarea
                    name="content"
                    placeholder="Content"
                    rows={3}
                    required
                    className="rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-canvas"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-brand py-2.5 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    Create Note
                  </button>
                </form>

                {notes.length > 0 && (
                  <ul className="flex w-full flex-col gap-2">
                    {notes.map((note) => (
                      <li
                        key={String(note.id)}
                        className="rounded-lg border border-edge bg-surface p-4"
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
              </>
            )}
          </>
        )}

        {error && (
          <p className="text-center text-sm text-danger">{error}</p>
        )}
      </div>
    </main>
  );
}
