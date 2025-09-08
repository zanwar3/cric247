"use client";
import MobileLayout from "@/components/MobileLayout";

export default function StatisticsPage() {
  return (
    <MobileLayout>
      <div className="min-h-screen bg-slate-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">Statistics</h1>
            <p className="text-slate-300 text-sm sm:text-base">Analytics and insights for your cricket management</p>
          </div>

          {/* Coming Soon Section */}
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-200 mb-2">Analytics Dashboard Coming Soon</h3>
            <p className="text-slate-400 mb-6">
              We're building a comprehensive analytics system to help you track performance, 
              analyze trends, and make data-driven decisions for your cricket management.
            </p>
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 max-w-md mx-auto">
              <h4 className="text-slate-100 font-semibold mb-3">Features in Development:</h4>
              <ul className="text-slate-300 text-sm space-y-2 text-left">
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Player performance metrics</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Team statistics and rankings</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Match outcome analysis</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Tournament progress tracking</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Performance trends and insights</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
