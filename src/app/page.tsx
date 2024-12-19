"use client";

import { LoginForm } from "@/components/login-form";
import { loginUser } from "./utils/firebaseUtils";

export default function Home() {
  const handleLogin = async (email: string, password: string) => {
    try {
      await loginUser(email, password); // Firebase Authentication
    } catch (error) {
      console.error("Login error:", error);
      alert("Failed to log in. Please check your email and password.");
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm onSubmit={handleLogin} />
      </div>
    </div>
  );
}
