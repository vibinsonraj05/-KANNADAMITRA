import type { Metadata } from "next";
import Nav from "@/components/Nav";
import LiveBackground from "@/components/LiveBackground";
import WelcomeTransition from "@/components/WelcomeTransition";
import "./globals.css";


export const metadata: Metadata = {
  title: "KannadaMitra · Translate into Kannada",
  description: "A simple, reliable way to translate text into Kannada.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LiveBackground />
        <Nav />
        <main className="main-shell"><div className="page-content"><WelcomeTransition>{children}</WelcomeTransition></div></main>
      </body>
    </html>
  );
}
