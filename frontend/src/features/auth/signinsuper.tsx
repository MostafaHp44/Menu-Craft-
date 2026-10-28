import React, { useState } from "react";

export default function SignInSuper() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const primaryColor = "hsl(17, 84%, 43%)";

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fff8f5] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl sm:p-10">
        {/* Logo */}
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl text-white"
          style={{ backgroundColor: primaryColor }}
        >
          🔐
        </div>

        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Welcome Back!
          </h1>
          <p className="text-sm text-gray-500">
            Sign in to your super admin account
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-[#c94312] focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-20 outline-none transition focus:border-[#c94312] focus:ring-2 focus:ring-orange-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 hover:text-gray-800"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm">
            <label className="flex items-center gap-2 text-gray-600">
              <input type="checkbox" className="accent-[#c94312]" />
              Remember me
            </label>

            <button
              type="button"
              onClick={() => alert("Connect your password reset flow here.")}
              className="font-semibold hover:underline"
              style={{ color: primaryColor }}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl py-3.5 font-semibold text-white shadow-md transition hover:brightness-90 active:scale-[0.98]"
            style={{ backgroundColor: primaryColor }}
          >
            Sign In
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-gray-400">
          Secure access · Super Admin Portal
        </p>
      </div>
    </div>
  );
}
