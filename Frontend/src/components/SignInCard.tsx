"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { EyeOff, X, CheckCircle2, AlertCircle } from "lucide-react";
import { loginApi } from "@/lib/api";

interface FormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function SignInCard() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Formik validation schema using Yup
  const validationSchema = Yup.object({
    email: Yup.string()
      .trim()
      .email("Please enter a valid email address")
      .required("Email address is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    rememberMe: Yup.boolean(),
  });

  const formik = useFormik<FormValues>({
    initialValues: {
      email: "testuser@test.com",
      password: "",
      rememberMe: true,
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setErrorMessage("");
      try {
        await loginApi(values.email.trim(), values.password);
        setSubmittedEmail(values.email);
        setIsSuccess(true);
        setSubmitting(false);
        setTimeout(() => {
          router.push("/dashboard");
        }, 400);
      } catch (err: any) {
        setErrorMessage(err.message || "Invalid email or password");
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="w-full max-w-[440px] select-none">
      {/* Success Notification Alert */}
      {isSuccess && (
        <div className="mb-3 bg-emerald-500/90 backdrop-blur-md text-white text-sm rounded-xl p-3.5 shadow-lg flex items-center justify-between border border-emerald-400/30">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
            <span>
              Signed in as <strong className="font-semibold">{submittedEmail}</strong>. Redirecting...
            </span>
          </div>
          <button
            onClick={() => setIsSuccess(false)}
            className="text-white/80 hover:text-white transition-colors ml-2"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Notification Alert */}
      {errorMessage && (
        <div className="mb-3 bg-red-500/90 backdrop-blur-md text-white text-sm rounded-xl p-3.5 shadow-lg flex items-center justify-between border border-red-400/30">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-white" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage("")}
            className="text-white/80 hover:text-white transition-colors ml-2"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Login Card - matching Figma Login Concept 1 (1015:8174) */}
      <div className="bg-white rounded-[12px] shadow-[0px_10px_25px_-5px_rgba(0,0,0,0.05),0px_8px_10px_-6px_rgba(0,0,0,0.05)] p-[33px] border border-[#E2E8F0]/60">
        {/* Header */}
        <div className="mb-[24px]">
          <h1 className="text-[24px] font-bold tracking-[-0.6px] text-[#0F172A] leading-[32px]">
            Welcome back
          </h1>
          <p className="text-[14px] text-[#64748B] mt-[6px] leading-[20px]">
            Enter your login details to access the Adviser.
          </p>
        </div>

        {/* Formik Form */}
        <form onSubmit={formik.handleSubmit} noValidate className="space-y-[20px]">
          {/* Email Address Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-[14px] font-medium text-[#334155] mb-[6px]"
            >
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full h-[44px] px-[17px] py-[12px] text-[15px] text-[#0F172A] placeholder-[#94A3B8] bg-white rounded-[8px] border transition-colors outline-none ${
                  formik.touched.email && formik.errors.email
                    ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                    : "border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#0E2841] focus:ring-1 focus:ring-[#0E2841]/20"
                }`}
              />
            </div>
            {formik.touched.email && formik.errors.email && (
              <p className="text-[12px] text-red-500 mt-1.5 font-normal leading-tight">
                {formik.errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-[6px]">
              <label
                htmlFor="password"
                className="text-[14px] font-medium text-[#334155]"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[14px] font-semibold text-[#191616] hover:underline cursor-pointer"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full h-[44px] pl-[17px] pr-[44px] py-[12px] text-[15px] text-[#0F172A] placeholder-[#94A3B8] bg-white rounded-[8px] border transition-colors outline-none tracking-tight ${
                  formik.touched.password && formik.errors.password
                    ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                    : "border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#0E2841] focus:ring-1 focus:ring-[#0E2841]/20"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors focus:outline-none flex items-center justify-center p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-[18px] h-[18px] stroke-[1.75]" />
                ) : (
                  <Image
                    src="/images/auth/eye.svg"
                    alt="Show password"
                    width={18}
                    height={13}
                    className="w-[18px] h-[13px] opacity-75 hover:opacity-100"
                  />
                )}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <p className="text-[12px] text-red-500 mt-1.5 font-normal leading-tight">
                {formik.errors.password}
              </p>
            )}
          </div>

          {/* Keep me signed in Checkbox */}
          <div className="flex items-center gap-[8px] pt-[2px]">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={formik.values.rememberMe}
              onChange={formik.handleChange}
              className="w-[16px] h-[16px] rounded-[4px] border border-[#CBD5E1] text-[#0E2841] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#0E2841]"
            />
            <label
              htmlFor="rememberMe"
              className="text-[14px] text-[#475569] cursor-pointer select-none"
            >
              Keep me signed in
            </label>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="w-full h-[44px] mt-[6px] bg-[#0E2841] hover:bg-[#163859] active:bg-[#091a2b] text-white font-semibold text-[16px] rounded-[8px] flex items-center justify-center gap-[8px] transition-colors duration-150 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed shadow-sm"
          >
            {formik.isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Signing In...</span>
              </span>
            ) : (
              <>
                <span>Sign In</span>
                <Image
                  src="/images/auth/sign-in-arrow.svg"
                  alt=""
                  width={14}
                  height={14}
                  className="w-[13.5px] h-[13.5px]"
                />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
