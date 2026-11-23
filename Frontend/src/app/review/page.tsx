"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";
import ReviewWorkspaceReport from "@/components/household/ReviewWorkspaceReport";

export default function ReviewWorkspacePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="h-screen w-full bg-[#FBFBFC] flex overflow-hidden select-none font-['Inter',sans-serif]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSubItemLabel={"Harrison Family -\nReview Workspace"}
      />

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}

      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0">
        <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-6 sm:p-9 max-w-[1440px] w-full mx-auto">
          <ReviewWorkspaceReport
            householdName="Harrison Family"
            reviewYear="2026"
            reviewStatus="In Progress"
            onBack={() => router.push("/household/harrison-family")}
          />
        </main>
      </div>
    </div>
  );
}
