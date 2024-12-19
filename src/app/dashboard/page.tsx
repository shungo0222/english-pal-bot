"use client";

import { Button } from "@/components/ui/button";
import { logoutUser } from "../utils/firebaseUtils";

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-gray-600">Welcome to your dashboard! This section is under construction.</p>
      <Button onClick={logoutUser}>Logout</Button>
    </div>
  );
}
