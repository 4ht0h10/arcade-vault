import { Suspense } from "react";
import { AuthForm, AuthFormFromParams } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <div className="av-auth-wrap fade-in">
      <Suspense fallback={<AuthForm initialTab="in" />}>
        <AuthFormFromParams />
      </Suspense>
    </div>
  );
}
