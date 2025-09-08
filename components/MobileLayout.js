"use client";
import TopNav from "./TopNav";
import BottomNav from "./BottomNav";

export default function MobileLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Top Navigation */}
      <TopNav />
      
      {/* Main Content */}
      <main className="min-h-screen pt-4 pb-20">
        {children}
      </main>
      
      {/* Bottom Navigation with Centered + Button */}
      <BottomNav />
    </div>
  );
}
