"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Icon, { type IconName } from "@/components/Icon";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";

const links: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/translate", label: "Translate", icon: "translate" },
  { href: "/camera", label: "Camera", icon: "camera" },
  { href: "/learn", label: "Learn", icon: "learn" },
  { href: "/settings", label: "Profile", icon: "profile" },
];

function active(href: string, path: string) {
  return href === "/" ? path === "/" : path.startsWith(href);
}

export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Could not sign out. Please retry.");
      localStorage.removeItem("kannadamitra-history");
      router.replace("/login");
    } catch (error) {
      setSigningOut(false);
      setSignOutError(error instanceof Error ? error.message : "Could not sign out. Please retry.");
    }
  };

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const sync = () => setMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => { setCollapsed(false); }, []);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.body.classList.toggle("sidebar-collapsed", collapsed && !mobile);
    return () => document.body.classList.remove("sidebar-collapsed");
  }, [collapsed, mobile]);
  useEffect(() => {
    if (!open || !mobile) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", escape);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", escape); };
  }, [open, mobile]);

  if (path === "/login" || path === "/signup") return null;
  const toggleNavigation = () => mobile ? setOpen(value => !value) : setCollapsed(value => !value);

  return <>
    <aside id="app-sidebar" className={`app-sidebar ${open ? "is-open" : ""} ${collapsed ? "is-collapsed" : ""}`} aria-hidden={mobile && !open}>
      <div className="sidebar-heading">
        <Link className="app-brand" href="/" aria-label="KannadaMitra home">
          <span className="app-brand-mark sidebar-leaf-mark"><Icon name="leaf"/></span>
          <span className="sidebar-brand-copy"><strong>KannadaMitra</strong><small>Translate · Learn · Connect</small></span>
        </Link>
      </div>
      <nav className="sidebar-links" aria-label="Main navigation">
        {links.map(item => <Link key={item.href} href={item.href} aria-label={collapsed ? item.label : undefined} aria-current={active(item.href, path) ? "page" : undefined} title={collapsed ? item.label : undefined} onClick={() => setOpen(false)}>
          <span className="sidebar-link-icon"><Icon name={item.icon}/></span><span className="sidebar-link-label">{item.label}</span>
        </Link>)}
      </nav>
      <div className="sidebar-footer"><span className="sidebar-leaf" aria-hidden="true">✦</span><p>Kannada is not just a language,<br/>it’s a culture.</p><i/></div>
      <div className="sidebar-logout-wrap">
        {signOutError&&<p className="sidebar-logout-error" role="alert">{signOutError}</p>}
        <button className="sidebar-logout" type="button" onClick={() => void signOut()} disabled={signingOut} aria-label={signingOut ? "Signing out" : "Sign out"} title={signingOut ? "Signing out" : "Sign out"}><LogOut size={16} aria-hidden="true"/><span>{signingOut ? "Signing out…" : "Sign out"}</span></button>
      </div>
    </aside>
    {mobile && open && <button className="sidebar-backdrop" type="button" aria-label="Close navigation menu" onClick={() => setOpen(false)}/>}
    <button className={`sidebar-edge-toggle ${mobile ? "is-mobile" : ""} ${mobile && open ? "is-open" : ""} ${!mobile && collapsed ? "is-collapsed" : ""}`} type="button" onClick={toggleNavigation} aria-label={mobile ? open ? "Close navigation menu" : "Open navigation menu" : collapsed ? "Expand sidebar" : "Collapse sidebar"} title={mobile ? open ? "Close navigation menu" : "Open navigation menu" : collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={mobile ? open : !collapsed} aria-controls="app-sidebar">{mobile ? open ? <ChevronLeft size={17} strokeWidth={2}/> : <ChevronRight size={17} strokeWidth={2}/> : collapsed ? <ChevronRight size={17} strokeWidth={2}/> : <ChevronLeft size={17} strokeWidth={2}/>}</button>
  </>;
}
