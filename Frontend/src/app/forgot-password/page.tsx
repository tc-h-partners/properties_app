import type { Metadata } from "next";
import Image from "next/image";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset Your Password | Adviser Portal",
  description: "Reset your password to regain access to your Adviser portal account.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0E2841] overflow-x-hidden">
      {/* Left Form Section (40.3% in Figma: 580px of 1440px) */}
      <section className="w-full lg:w-[40.3%] min-h-screen flex items-center justify-center px-6 sm:px-12 lg:px-16 py-10 bg-white shrink-0">
        <ForgotPasswordForm />
      </section>

      {/* Right Illustration Section (flex-1 expands seamlessly with zero fractional seam gaps) */}
      <section className="w-full lg:flex-1 min-h-[460px] lg:min-h-screen bg-[#0E2841] flex items-center justify-center p-8 sm:p-12 lg:p-16 relative overflow-hidden select-none">
        <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center">
          <Image
            src="/images/auth/reset-password-art.png"
            alt="Reset Password Illustration"
            fill
            priority
            quality={100}
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-contain"
          />
        </div>
      </section>
    </main>
  );
}
