"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Eye, EyeOff } from "lucide-react";

export default function ForgotPasswordForm() {
  const [step, setStep] = useState<"forgot" | "create" | "success">("forgot");
  const [showToast, setShowToast] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Formik for Step 1: Forgot Password (Email)
  const forgotFormik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .trim()
        .email("Please enter a valid email address")
        .required("Email address is required"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      // Simulate API latency
      await new Promise((resolve) => setTimeout(resolve, 600));
      setSubmitting(false);
      setShowToast(true);

      // Advance to "Create New Password" screen after user sees success message
      setTimeout(() => {
        setShowToast(false);
        setStep("create");
      }, 2400);
    },
  });

  // Formik for Step 2: Create New Password
  const createPasswordFormik = useFormik({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords must match")
        .required("Confirm password is required"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setSubmitting(false);
      setStep("success");
    },
  });

  return (
    <div className="w-full max-w-[418px] mx-auto select-none">
      {/* STEP 1: Reset Your Password (matching Figma Node 1015:7929 & 1015:8103) */}
      {step === "forgot" && (
        <div>
          {/* Header */}
          <div className="mb-[36px]">
            <h1 className="text-[34px] font-bold tracking-[-0.68px] text-[#102A42] leading-[44px]">
              Reset Your Password
            </h1>
            <p className="text-[18px] text-[#423B3B] mt-2 font-normal leading-[24px]">
              Welcome back! Please enter your details.
            </p>
          </div>

          {/* Formik Form */}
          <form
            onSubmit={forgotFormik.handleSubmit}
            noValidate
            className="space-y-[24px]"
          >
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-[16px] font-medium text-[#423B3B] mb-2 leading-[20px]"
              >
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Your Email Id"
                  value={forgotFormik.values.email}
                  onChange={(e) => {
                    if (showToast) setShowToast(false);
                    forgotFormik.handleChange(e);
                  }}
                  onBlur={forgotFormik.handleBlur}
                  className={`w-full h-[50px] px-[14px] py-[10px] text-[16px] text-[#423B3B] placeholder-[#94A3B8] bg-white rounded-[8px] border transition-colors outline-none shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] ${
                    forgotFormik.touched.email && forgotFormik.errors.email
                      ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                      : "border-[rgba(28,48,74,0.2)] hover:border-[#102A42]/40 focus:border-[#102A42] focus:ring-1 focus:ring-[#102A42]/20"
                  }`}
                />
              </div>
              {forgotFormik.touched.email && forgotFormik.errors.email && (
                <p className="text-[13px] text-red-500 mt-1.5 font-normal leading-tight">
                  {forgotFormik.errors.email}
                </p>
              )}
            </div>

            {/* Reset Password Button */}
            <button
              type="submit"
              disabled={forgotFormik.isSubmitting}
              className="w-full h-[50px] bg-[#102A42] hover:bg-[#163859] active:bg-[#0a1e30] text-white font-semibold text-[18px] rounded-[8px] flex items-center justify-center transition-colors duration-150 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]"
            >
              {forgotFormik.isSubmitting ? (
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
                  <span>Sending...</span>
                </span>
              ) : (
                <span>Reset Password</span>
              )}
            </button>

            {/* Toast message shown below reset password button (matching Figma Node 1015:8146) */}
            {showToast && (
              <div className="w-full h-[40px] bg-[rgba(217,217,217,0.2)] border border-[rgba(107,107,107,0.2)] rounded-[8px] flex items-center justify-center gap-[8px] px-[21px] py-[13px] animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="border border-[#6B6B6B] rounded-[13px] flex items-center justify-center size-[22px] shrink-0">
                  <Image
                    src="/images/auth/check-icon.svg"
                    alt=""
                    width={14}
                    height={14}
                    className="w-[14px] h-[14px]"
                  />
                </div>
                <span className="text-[13px] text-[#6B6B6B] font-normal leading-[16px] whitespace-nowrap">
                  A password reset email is successfully sent to you
                </span>
              </div>
            )}

            {/* Back to Login Link */}
            <div className="pt-2 text-center">
              <Link
                href="/"
                className="text-[14px] font-semibold text-[#423B3B] underline hover:text-[#102A42] cursor-pointer inline-block transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: Create New Password (matching Figma Node 1015:8038) */}
      {step === "create" && (
        <div className="animate-in fade-in duration-250">
          {/* Header */}
          <div className="mb-[36px]">
            <h1 className="text-[34px] font-bold tracking-[-0.68px] text-[#102A42] leading-[44px]">
              Create New Password
            </h1>
            <p className="text-[18px] text-[#423B3B] mt-2 font-normal leading-[24px]">
              Welcome back! Please enter your details.
            </p>
          </div>

          {/* Formik Form */}
          <form
            onSubmit={createPasswordFormik.handleSubmit}
            noValidate
            className="space-y-[24px]"
          >
            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-[16px] font-medium text-[#423B3B] mb-2 leading-[20px]"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={createPasswordFormik.values.password}
                  onChange={createPasswordFormik.handleChange}
                  onBlur={createPasswordFormik.handleBlur}
                  className={`w-full h-[50px] px-[14px] pr-[44px] py-[10px] text-[16px] text-[#423B3B] placeholder-[#94A3B8] bg-white rounded-[8px] border transition-colors outline-none shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] ${
                    createPasswordFormik.touched.password &&
                    createPasswordFormik.errors.password
                      ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                      : "border-[rgba(28,48,74,0.2)] hover:border-[#102A42]/40 focus:border-[#102A42] focus:ring-1 focus:ring-[#102A42]/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors focus:outline-none flex items-center justify-center p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-[20px] h-[20px] stroke-[1.75]" />
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
              {createPasswordFormik.touched.password &&
                createPasswordFormik.errors.password && (
                  <p className="text-[13px] text-red-500 mt-1.5 font-normal leading-tight">
                    {createPasswordFormik.errors.password}
                  </p>
                )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-[16px] font-medium text-[#423B3B] mb-2 leading-[20px]"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={createPasswordFormik.values.confirmPassword}
                  onChange={createPasswordFormik.handleChange}
                  onBlur={createPasswordFormik.handleBlur}
                  className={`w-full h-[50px] px-[14px] pr-[44px] py-[10px] text-[16px] text-[#423B3B] placeholder-[#94A3B8] bg-white rounded-[8px] border transition-colors outline-none shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] ${
                    createPasswordFormik.touched.confirmPassword &&
                    createPasswordFormik.errors.confirmPassword
                      ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                      : "border-[rgba(28,48,74,0.2)] hover:border-[#102A42]/40 focus:border-[#102A42] focus:ring-1 focus:ring-[#102A42]/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors focus:outline-none flex items-center justify-center p-1"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-[20px] h-[20px] stroke-[1.75]" />
                  ) : (
                    <Image
                      src="/images/auth/eye.svg"
                      alt="Show confirm password"
                      width={18}
                      height={13}
                      className="w-[18px] h-[13px] opacity-75 hover:opacity-100"
                    />
                  )}
                </button>
              </div>
              {createPasswordFormik.touched.confirmPassword &&
                createPasswordFormik.errors.confirmPassword && (
                  <p className="text-[13px] text-red-500 mt-1.5 font-normal leading-tight">
                    {createPasswordFormik.errors.confirmPassword}
                  </p>
                )}
            </div>

            {/* Create Password Button */}
            <button
              type="submit"
              disabled={createPasswordFormik.isSubmitting}
              className="w-full h-[50px] bg-[#102A42] hover:bg-[#163859] active:bg-[#0a1e30] text-white font-semibold text-[18px] rounded-[8px] flex items-center justify-center transition-colors duration-150 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]"
            >
              {createPasswordFormik.isSubmitting ? (
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
                  <span>Updating...</span>
                </span>
              ) : (
                <span>Create Password</span>
              )}
            </button>

            {/* Back to Login Link */}
            <div className="pt-2 text-center">
              <Link
                href="/"
                className="text-[14px] font-semibold text-[#423B3B] underline hover:text-[#102A42] cursor-pointer inline-block transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: Success Screen */}
      {step === "success" && (
        <div className="text-center animate-in fade-in duration-200 py-4">
          <div className="w-14 h-14 mx-auto mb-4 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200">
            <svg
              className="w-7 h-7"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M5 10l3.5 3.5 7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-[24px] font-bold text-[#102A42] mb-2 leading-tight">
            Password Updated
          </h2>
          <p className="text-[16px] text-[#64748B] mb-6 leading-relaxed">
            Your new password has been set successfully. You can now log in.
          </p>
          <Link
            href="/"
            className="w-full h-[50px] bg-[#102A42] hover:bg-[#163859] text-white font-semibold text-[18px] rounded-[8px] flex items-center justify-center transition-colors shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]"
          >
            Sign In Now
          </Link>
        </div>
      )}
    </div>
  );
}
