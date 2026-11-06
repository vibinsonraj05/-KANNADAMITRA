"use client";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { usePathname, useRouter } from "next/navigation";

export default function WelcomeTransition({children}:{children:React.ReactNode}){
  const router=useRouter();
  const pathname=usePathname();
  const [ready,setReady]=useState(false);const [welcome,setWelcome]=useState(false);const [leaving,setLeaving]=useState(false);
  const [authorized,setAuthorized]=useState(false);
  useEffect(()=>{let active=true;if(pathname==="/login"||pathname==="/signup"){setAuthorized(false);setReady(true);fetch("/api/auth/me").then(response=>{if(response.ok&&active)router.replace("/")}).catch(()=>{});return()=>{active=false}}fetch("/api/auth/me").then(response=>{if(!active)return;if(response.ok){setAuthorized(true);if(sessionStorage.getItem("kannadamitra-welcome-pending")==="true"){sessionStorage.removeItem("kannadamitra-welcome-pending");setWelcome(true)}}else{setAuthorized(false);router.replace("/login")}}).catch(()=>{if(active){setAuthorized(false);router.replace("/login")}}).finally(()=>{if(active)setReady(true)});return()=>{active=false}},[pathname,router]);
  const enter=()=>{if(leaving)return;setLeaving(true);const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches||localStorage.getItem("kannadamitra-reduce-motion")==="true";window.setTimeout(()=>{setWelcome(false);router.replace("/")},reduced?80:600)};
  if(!ready)return <div className="welcome-screen welcome-loading" aria-label="Loading KannadaMitra"><span className="welcome-mark" lang="kn">ಕ</span></div>;
  if(pathname==="/login"||pathname==="/signup")return <div className="welcome-entered">{children}</div>;
  if(!authorized)return <div className="welcome-screen welcome-loading" aria-label="Checking your account"><span className="welcome-mark" lang="kn">ಕ</span></div>;
  if(welcome)return <section className={`welcome-screen ${leaving?"welcome-leaving":""}`} aria-labelledby="welcome-title"><div className="welcome-art" aria-hidden="true"><span className="welcome-glass-character" lang="kn">ಅ</span></div><div className="welcome-content"><span className="welcome-mark" lang="kn">ಕ</span><p className="welcome-brand">KannadaMitra</p><h1 id="welcome-title">Namaskara.</h1><p className="welcome-tagline">Welcome to KannadaMitra</p><p className="welcome-copy">Your Kannada journey starts here. Translate, explore, and learn at your own pace.</p><button className="btn welcome-continue" onClick={enter}>Continue <Icon name="arrow"/></button></div></section>;
  return <div className="welcome-entered">{children}</div>;
}
