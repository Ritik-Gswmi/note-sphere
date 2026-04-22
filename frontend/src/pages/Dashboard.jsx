import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

export default function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState("");
  const [active, setActive] = useState("dashboard"); // dashboard | notes | profile
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile backdrop only
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });

  const [me, setMe] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", password: "" });
  const [profileStatus, setProfileStatus] = useState({ type: "", message: "" });

  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  });

  useEffect(() => {
    if (!profileStatus.message || profileStatus.type !== "success") return;
    const t = setTimeout(() => setProfileStatus({ type: "", message: "" }), 3000);
    return () => clearTimeout(t);
  }, [profileStatus.message, profileStatus.type]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const logout = () => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("authchange"));
    window.location.href = "/login";
  };

  const noteText = (note) => (typeof note === "string" ? note : note?.text || "");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const fetchNotes = async () => {
    try {
      const res = await api.get("/notes");
      setNotes(Array.isArray(res.data) ? res.data : []);
    } catch {
      setNotes([]);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await api.get("/users/me");
        if (ignore) return;
        setMe(res.data);
        setProfileForm({ name: res.data?.name ?? "", email: res.data?.email ?? "", password: "" });
        fetchNotes();
      } catch {
        if (ignore) return;
        setMe(null);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const recentNotes = useMemo(() => [...notes].slice(-3).reverse(), [notes]);

  const addNote = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    try {
      const res = await api.post("/notes", { text: trimmed });
      setNotes((prev) => [...prev, res.data]);
      setInput("");
    } catch {
      // keep existing UI behavior (no extra changes)
    }
  };

  const deleteNote = async (id) => {
    if (!id) return;
    try {
      await api.delete(`/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n?._id !== id));
    } catch {
      // keep existing UI behavior (no extra changes)
    }
  };

  const startEdit = (note) => {
    if (!note?._id) return;
    setEditingId(note._id);
    setEditingText(noteText(note));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const saveEdit = async () => {
    const trimmed = editingText.trim();
    if (!editingId || !trimmed) return;
    try {
      const res = await api.put(`/notes/${editingId}`, { text: trimmed });
      setNotes((prev) => prev.map((n) => (n?._id === editingId ? res.data : n)));
      cancelEdit();
    } catch {
      // keep existing UI behavior (no extra changes)
    }
  };

  const selectTab = (tab) => {
    setActive(tab);
    setSidebarOpen(false);
    setSidebarCollapsed(true);
    setProfileStatus({ type: "", message: "" });
    setEditingId(null);
    setEditingText("");
  };

  const handleProfileUpdate = async () => {
    setProfileStatus({ type: "", message: "" });
    try {
      const payload = {
        name: profileForm.name,
        email: profileForm.email,
      };
      if (profileForm.password?.trim()) payload.password = profileForm.password;

      const res = await api.put("/users/me", payload);
      setMe(res.data);
      setProfileForm((prev) => ({ ...prev, password: "" }));
      setProfileStatus({ type: "success", message: "Profile updated." });
    } catch (err) {
      const msg = err?.response?.data?.msg || "Failed to update profile.";
      setProfileStatus({ type: "error", message: msg });
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Mobile drawer */}
      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => {
            setSidebarOpen(false);
            setSidebarCollapsed(true);
          }}
          aria-hidden="true"
        />
      ) : null}

      <div className="flex min-h-screen w-full">
        <aside
          className={[
            "fixed left-0 top-0 z-50 h-full border-r border-slate-200 bg-white md:static md:z-auto md:h-auto",
            "dark:border-slate-800 dark:bg-slate-900",
            "transition-[width] duration-200 ease-out overflow-hidden",
            "flex flex-col",
            sidebarCollapsed ? "w-14" : "w-64",
          ].join(" ")}
        >
          <div className="flex items-center justify-between px-4 py-4 md:px-4 md:py-4">
            <div className={sidebarCollapsed ? "hidden" : "min-w-0"}>
              <div className="text-lg font-semibold truncate">NoteSphere</div>
              <div className="mt-1 text-xs text-slate-500 truncate">
                {me?.email || "Workspace"}
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-2 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={() => {
                const next = !sidebarCollapsed;
                setSidebarCollapsed(next);
                if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
                  setSidebarOpen(!next);
                }
              }}
              title={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
              aria-label={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
            >
              <span className="block h-3 w-4">
                <span className="block h-0.5 w-4 bg-slate-700" />
                <span className="mt-1 block h-0.5 w-4 bg-slate-700" />
                <span className="mt-1 block h-0.5 w-4 bg-slate-700" />
              </span>
            </button>
          </div>

          {sidebarCollapsed ? null : (
            <div className="flex min-h-0 flex-1 flex-col">
              <nav className="px-2 md:px-3">
                <button
                  onClick={() => selectTab("dashboard")}
                  className={[
                    "w-full rounded-md px-3 py-2 text-left text-sm",
                    active === "dashboard"
                      ? "bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
                  ].join(" ")}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => selectTab("notes")}
                  className={[
                    "mt-1 w-full rounded-md px-3 py-2 text-left text-sm",
                    active === "notes"
                      ? "bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
                  ].join(" ")}
                >
                  Notes
                </button>
                <button
                  onClick={() => selectTab("profile")}
                  className={[
                    "mt-1 w-full rounded-md px-3 py-2 text-left text-sm",
                    active === "profile"
                      ? "bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
                  ].join(" ")}
                >
                  Profile
                </button>
              </nav>

              <div className="mt-auto border-t border-slate-200 px-4 py-4 md:px-6 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </button>
                <button
                  onClick={logout}
                  className="mt-3 w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 ml-14 md:ml-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold capitalize">{active}</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {active === "dashboard"
                  ? "Overview and recent activity."
                  : active === "notes"
                    ? "All your notes in one place."
                    : "View and update your profile."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={logout}
                className="md:hidden rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Logout
              </button>
            </div>
          </div>

          {active === "dashboard" ? (
            <>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="text-xs font-medium text-slate-500">Notes</div>
                  <div className="mt-2 text-2xl font-semibold">{notes.length}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="text-xs font-medium text-slate-500">Today</div>
                  <div className="mt-2 text-2xl font-semibold">
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="text-xs font-medium text-slate-500">Signed in</div>
                  <div className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-50">
                    {me?.name ? `${me.name} (${me.email})` : "—"}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
                <section className="lg:col-span-2">
                  <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Quick note
                      </h2>
                      <span className="text-xs text-slate-500">
                        {input.trim().length}/240
                      </span>
                    </div>

                    <div className="mt-3">
                      <label className="sr-only" htmlFor="noteInput">
                        Note
                      </label>
                      <textarea
                        id="noteInput"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        rows={4}
                        maxLength={240}
                        className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-500"
                        placeholder="Write something..."
                      />

                      <div className="mt-3 flex items-center justify-end">
                        <button
                          onClick={addNote}
                          disabled={!input.trim()}
                          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="lg:col-span-3">
                  <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Recent notes
                      </h2>
                      <button
                        onClick={() => selectTab("notes")}
                        className="text-xs font-medium text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-slate-50"
                      >
                        View all
                      </button>
                    </div>

                    {notes.length === 0 ? (
                      <div className="mt-4 rounded-md border border-dashed border-slate-200 p-6 text-center">
                        <div className="text-sm font-medium text-slate-900">
                          No notes yet
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          Add your first note on the left.
                        </div>
                      </div>
                    ) : (
                      <ul className="mt-4 space-y-3">
                        {recentNotes.map((note, i) => (
                          <li
                            key={typeof note === "string" ? `${i}-${note}` : note._id || `${i}-${noteText(note)}`}
                            className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                          >
                            {noteText(note)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              </div>
            </>
          ) : null}

          {active === "notes" ? (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
              <section className="lg:col-span-2">
                <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      Add note
                    </h2>
                    <span className="text-xs text-slate-500">
                      {input.trim().length}/240
                    </span>
                  </div>

                  <div className="mt-3">
                    <label className="sr-only" htmlFor="noteInputAll">
                      Note
                    </label>
                    <textarea
                      id="noteInputAll"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      rows={6}
                      maxLength={240}
                      className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-500"
                      placeholder="Write something..."
                    />

                    <div className="mt-3 flex items-center justify-end">
                      <button
                        onClick={addNote}
                        disabled={!input.trim()}
                        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="lg:col-span-3">
                <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      All notes
                    </h2>
                    <span className="text-xs text-slate-500">
                      {notes.length} total
                    </span>
                  </div>

                  {notes.length === 0 ? (
                    <div className="mt-4 rounded-md border border-dashed border-slate-200 p-8 text-center">
                      <div className="text-sm font-medium text-slate-900">
                        No notes yet
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        Add your first note on the left.
                      </div>
                    </div>
                  ) : (
                    <ul className="mt-4 divide-y divide-slate-200 rounded-md border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                      {[...notes].reverse().map((note, reverseIndex) => {
                        const index = notes.length - 1 - reverseIndex;
                        return (
                          <li
                            key={typeof note === "string" ? `${index}-${note}` : note._id || `${index}-${noteText(note)}`}
                            className="p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              {editingId && note?._id === editingId ? (
                                <div className="w-full">
                                  <textarea
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    rows={4}
                                    maxLength={240}
                                    className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-500"
                                  />
                                  <div className="mt-3 flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={cancelEdit}
                                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={saveEdit}
                                      disabled={!editingText.trim()}
                                      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm text-slate-800 whitespace-pre-wrap dark:text-slate-100">
                                    {noteText(note)}
                                  </p>
                                  <div className="shrink-0 flex items-center gap-2">
                                    <button
                                      onClick={() => startEdit(note)}
                                      className="rounded-md px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => deleteNote(note?._id)}
                                      className="rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>
            </div>
          ) : null}

          {active === "profile" ? (
            <div className="mt-6 max-w-2xl">
              <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Profile
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Update your name, email, and (optionally) password.
                </p>

                {profileStatus.message ? (
                  <div
                    className={[
                      "mt-4 rounded-md border px-3 py-2 text-sm",
                      profileStatus.type === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-rose-200 bg-rose-50 text-rose-800",
                    ].join(" ")}
                  >
                    {profileStatus.message}
                  </div>
                ) : null}

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                      Username
                    </label>
                    <input
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm((p) => ({ ...p, name: e.target.value }))
                      }
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                      Email
                    </label>
                    <input
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm((p) => ({ ...p, email: e.target.value }))
                      }
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                      New password (optional)
                    </label>
                    <input
                      type="password"
                      value={profileForm.password}
                      onChange={(e) =>
                        setProfileForm((p) => ({
                          ...p,
                          password: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                      placeholder="••••••••"
                    />
                    <div className="mt-1 text-xs text-slate-500">
                      Leave blank to keep your current password.
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    onClick={() => {
                      setProfileForm({
                        name: me?.name ?? "",
                        email: me?.email ?? "",
                        password: "",
                      });
                      setProfileStatus({ type: "", message: "" });
                    }}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                    onClick={handleProfileUpdate}
                  >
                    Save changes
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
