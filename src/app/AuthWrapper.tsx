"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { observeAuthState } from "./utils/firebaseUtils";

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Monitor authentication status
    const unsubscribe = observeAuthState((user) => {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return <>{children}</>; // Show child elements only if authenticated
}