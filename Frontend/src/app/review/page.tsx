"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";
import ReviewWorkspaceReport from "@/components/household/ReviewWorkspaceReport";
import {
  fetchHouseholds,
  fetchHouseholdById,
  getActiveHouseholdInfo,
} from "@/lib/api";

export default function ReviewWorkspacePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dbHousehold, setDbHousehold] = useState<any>(null);
  const router = useRouter();

  const loadActiveHousehold = useCallback(async () => {
    try {
      const stored = getActiveHouseholdInfo();
      if (stored?.id) {
        const h = await fetchHouseholdById(stored.id);
        setDbHousehold(h);
        return;
      }
      const list = await fetchHouseholds();
      if (Array.isArray(list) && list.length > 0) {
        const h = await fetchHouseholdById(list[0].id);
        setDbHousehold(h);
      }
    } catch (err) {
      console.error("Failed to load review workspace household from DB:", err);
    }
  }, []);

  useEffect(() => {
    loadActiveHousehold();
  }, [loadActiveHousehold]);

  const latestReview = dbHousehold?.reviews?.[0];
  const householdName = dbHousehold?.householdName || "Household";
  const reviewYear = String(latestReview?.financialYear || "2026");

  return (
    <div className="h-screen w-full bg-[#FBFBFC] flex overflow-hidden select-none font-['Inter',sans-serif]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSubItemLabel={`${householdName} -\nReview Workspace`}
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
            householdId={dbHousehold?.id}
            reviewId={latestReview?.id}
            dbHousehold={dbHousehold}
            onDataChanged={loadActiveHousehold}
            householdName={householdName}
            reviewYear={reviewYear}
            reviewStatus={
              latestReview?.tchReviewStatus === "COMPLETED"
                ? "Completed"
                : "In Progress"
            }
            onBack={() =>
              router.push(
                dbHousehold?.id ? `/household/${dbHousehold.id}` : "/household"
              )
            }
          />
        </main>
      </div>
    </div>
  );
}
