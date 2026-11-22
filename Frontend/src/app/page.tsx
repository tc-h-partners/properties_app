import Image from "next/image";
import SignInCard from "@/components/SignInCard";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#0E2841]">
      {/* Background Image matching Figma Login Concept 1 */}
      <div className="absolute inset-0 z-0 w-full h-full pointer-events-none">
        <Image
          src="/images/auth/login-bg.png"
          alt="Properties Advisor Background"
          fill
          priority
          quality={100}
          sizes="100vw"
          className="object-cover object-center select-none"
        />
        {/* Subtle overlay to ensure perfect contrast matching Figma */}
        <div className="absolute inset-0 bg-[#0E2841]/30 pointer-events-none" />
      </div>

      {/* Centered Sign In Card */}
      <div className="relative z-10 w-full flex items-center justify-center py-6">
        <SignInCard />
      </div>
    </main>
  );
}
