"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import Icon from "@/components/Icon";
export default function Settings() {
  const router = useRouter();
  const { update: updateProgress } = useStore();
  const [dark, setDark] = useState(false);
  const [savedDark, setSavedDark] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [notice, setNotice] = useState("");
  const [account, setAccount] = useState<{name:string;email:string}|null>(null);
  const [accountStatus, setAccountStatus] = useState<"loading"|"ready"|"error">("loading");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me").then(async response => {
      if (!response.ok) throw new Error("Could not load account details.");
      const data = await response.json();
      if (active) { setAccount(data?.name && data?.email ? {name:data.name,email:data.email} : null); setAccountStatus("ready"); }
    }).catch(() => { if (active) setAccountStatus("error"); });
    const savedAppearance = localStorage.getItem("kfe-theme") === "dark";
    setDark(savedAppearance);
    setSavedDark(savedAppearance);
    setPreferencesLoaded(true);
    document.documentElement.classList.toggle("theme-dark", savedAppearance);
    return () => { active = false; };
  }, []);

  const saveProfilePreferences = () => {
    if (!preferencesLoaded || dark === savedDark) return;
    localStorage.setItem("kfe-theme", dark ? "dark" : "light");
    document.documentElement.classList.toggle("theme-dark", dark);
    setSavedDark(dark);
    setNotice("Profile preferences saved.");
  };
  const signOut = async () => {
    setSigningOut(true);
    try { const response = await fetch("/api/auth/logout", { method: "POST" }); if (!response.ok) throw new Error(); localStorage.removeItem("kannadamitra-history"); router.replace("/login"); }
    catch { setSigningOut(false); setNotice("Could not sign out. Check your connection and retry."); }
  };
  const clearHistory = async () => {
    if (!confirm("Delete translation history from your account and this browser?")) return;
    setNotice("Clearing translation history…");
    try { const response = await fetch("/api/history", { method: "DELETE" }); if (!response.ok) throw new Error(); localStorage.removeItem("kannadamitra-history"); setNotice("Translation history cleared."); }
    catch { setNotice("Could not clear account history. Please retry."); }
  };
  const clearSaved = () => {
    if (!confirm("Delete saved translations stored in this browser?")) return;
    localStorage.removeItem("kannadamitra-saved"); setNotice("Saved translations cleared from this device.");
  };
  const resetProgress = () => {
    if (!confirm("Reset learning points, lesson completion and quiz scores?")) return;
    updateProgress(state => ({ ...state, completed: [], built: [], best: {}, points: 0, days: {}, resume: undefined, completedStages: {} }));
    setNotice("Learning progress reset on this device.");
  };

  return <div className="settings-page profile-page">
    <header className="profile-page-header"><div><div className="eyebrow">YOUR ACCOUNT</div><h1>Profile &amp; Settings</h1><p className="subhead">Manage your account, appearance, and personal data.</p></div></header>
    <section className="profile-account-card"><div className="profile-account-mark" aria-hidden="true">{account?.name?.slice(0,1).toUpperCase() || "ಕ"}</div><div className="profile-account-copy"><strong>{account?.name || (accountStatus === "error" ? "Account details unavailable" : "Loading account…")}</strong><span>{account?.email || (accountStatus === "error" ? "Check your connection and reload." : "Your signed-in account")}</span></div><button className="btn ghost profile-signout" type="button" onClick={() => void signOut()} disabled={signingOut}>{signingOut ? "Signing out…" : "Sign out"}</button></section>

    <section className="profile-settings-card" aria-label="Profile settings">
      <section className="profile-preferences-section" aria-labelledby="profile-preferences-title">
        <div className="profile-section-heading"><div><span className="eyebrow">PREFERENCES</span><h2 id="profile-preferences-title">Appearance</h2></div><p>Choose the theme used across KannadaMitra.</p></div>
        <label className="profile-appearance-control"><span>App theme</span><select aria-label="Appearance" value={dark ? "dark" : "light"} onChange={event => { setDark(event.target.value === "dark"); setNotice(""); }}><option value="light">Light</option><option value="dark">Dark</option></select></label>
      </section>
      <section className="profile-data-section" aria-labelledby="profile-data-title">
        <div className="profile-section-heading"><div><span className="eyebrow">YOUR INFORMATION</span><h2 id="profile-data-title">Data &amp; Privacy</h2></div><p>Review and manage the information connected to your learning.</p></div>
        <div className="profile-data-list">
          <div className="profile-data-row"><span className="profile-data-icon"><Icon name="history"/></span><div className="profile-data-row-copy"><strong>Translation History</strong><span>Remove translation records from your account and this browser.</span></div><button className="profile-destructive-button" type="button" onClick={() => void clearHistory()}><Icon name="delete"/><span>Clear history</span></button></div>
          <div className="profile-data-row"><span className="profile-data-icon"><Icon name="bookmark"/></span><div className="profile-data-row-copy"><strong>Saved Phrases</strong><span>Remove saved translations stored on this device.</span></div><button className="profile-destructive-button" type="button" onClick={clearSaved}><Icon name="delete"/><span>Clear saved</span></button></div>
          <div className="profile-data-row"><span className="profile-data-icon"><Icon name="learn"/></span><div className="profile-data-row-copy"><strong>Learning Progress</strong><span>Reset points, completed lessons, and quiz scores on this device.</span></div><button className="profile-destructive-button" type="button" onClick={resetProgress}><Icon name="delete"/><span>Reset progress</span></button></div>
        </div>
      </section>
      {notice&&<p className="profile-notice" role="status">{notice}</p>}
    </section>
    <div className="profile-save-row"><span className="profile-save-hint" aria-live="polite">{dark !== savedDark ? "You have unsaved changes." : ""}</span><button className="btn profile-save-button" type="button" onClick={saveProfilePreferences} disabled={!preferencesLoaded || dark === savedDark}>{dark !== savedDark ? "Save changes" : "Changes saved"}</button></div>
  </div>;
}
