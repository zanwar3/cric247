"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
        </svg>
      ),
    },
    {
      name: "Profiles",
      href: "/profiles",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
    },
    {
      name: "Tournaments",
      href: "/tournaments",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      name: "Matches",
      href: "/matches",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
  ];

  const crudActions = [
    {
      name: "Create Profile",
      href: "/profiles",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      name: "Create Team",
      href: "/teams",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      name: "Create Tournament",
      href: "/tournaments",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      name: "Schedule Match",
      href: "/matches",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: "bg-orange-600 hover:bg-orange-700",
    },
  ];

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <>
      {/* CRUD Actions Dropdown - Full Width Bottom Sheet */}
      {isDropdownOpen && (
        <div className="fixed bottom-20 left-0 right-0 z-40">
          <div className="bg-slate-800 border border-slate-700 rounded-t-3xl shadow-2xl p-6 pb-8 mx-4">
            {/* Handle Bar */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-1 bg-slate-600 rounded-full"></div>
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-100">Quick Actions</h3>
              <button
                onClick={() => setIsDropdownOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
              {crudActions.map((action) => (
                <Link
                  key={action.name}
                  href={action.href}
                  onClick={() => setIsDropdownOpen(false)}
                  className={`flex flex-col items-center p-5 rounded-xl text-white ${action.color} transition-all duration-200 hover:scale-105 shadow-lg`}
                >
                  <span className="mb-3">{action.icon}</span>
                  <span className="font-medium text-center text-sm leading-tight">{action.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 shadow-lg z-50">
        <div className="flex justify-around items-center py-2">
          {navigationItems.slice(0, 2).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "text-blue-400 bg-slate-700"
                    : "text-slate-300 hover:text-blue-400 hover:bg-slate-700"
                }`}
              >
                <span className={`${isActive ? "text-blue-400" : "text-slate-400"}`}>
                  {item.icon}
                </span>
                <span className="text-xs font-medium mt-1">{item.name}</span>
                {isActive && (
                  <div className="w-1 h-1 bg-blue-400 rounded-full mt-1"></div>
                )}
              </Link>
            );
          })}

          {/* Centered + Button */}
          <button
            onClick={toggleDropdown}
            className="flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 -mt-6"
          >
            <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-all duration-300 hover:scale-110">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-xs font-medium mt-1 text-slate-300">Actions</span>
          </button>

          {navigationItems.slice(2).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "text-blue-400 bg-slate-700"
                    : "text-slate-300 hover:text-blue-400 hover:bg-slate-700"
                }`}
              >
                <span className={`${isActive ? "text-blue-400" : "text-slate-400"}`}>
                  {item.icon}
                </span>
                <span className="text-xs font-medium mt-1">{item.name}</span>
                {isActive && (
                  <div className="w-1 h-1 bg-blue-400 rounded-full mt-1"></div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
