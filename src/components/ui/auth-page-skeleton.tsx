export default function AuthPageSkeleton() {
  return (
    <div className="min-h-screen flex bg-background-light dark:bg-gray-950">
      {/* Left Side - CTA & GIF (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 p-12 items-center justify-center relative overflow-hidden bg-gray-100 dark:bg-gray-900">
        <div className="relative z-10 max-w-lg w-full animate-pulse">
          <div className="h-12 w-72 rounded-md bg-gray-200 dark:bg-gray-800 mb-6" />
          <div className="space-y-3 mb-8">
            <div className="h-6 w-full rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-6 w-4/5 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
          <div className="rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 h-80" />
        </div>
      </div>

      {/* Right Side - Form Skeleton */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 pt-20 sm:pt-24 lg:pt-12">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          {/* Logo */}
          <div className="flex justify-center lg:hidden">
            <div className="w-15 h-15 rounded-full bg-gray-200 dark:bg-gray-800" />
          </div>

          {/* Header */}
          <div className="space-y-2 animate-pulse">
            <div className="h-8 w-48 rounded-md bg-gray-200 dark:bg-gray-800 mx-auto lg:mx-0" />
            <div className="h-5 w-72 rounded bg-gray-200 dark:bg-gray-800 mx-auto lg:mx-0" />
          </div>

          {/* Form Fields */}
          <div className="space-y-5 animate-pulse">
            {/* Email field */}
            <div className="space-y-1">
              <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-12 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
            </div>

            {/* Password field */}
            <div className="space-y-1">
              <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-12 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
            </div>

            {/* Forgot password link */}
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800 ml-auto" />

            {/* Submit button */}
            <div className="h-12 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="h-px bg-gray-300 dark:bg-gray-700 w-full" />
            <div className="h-4 w-8 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-px bg-gray-300 dark:bg-gray-700 w-full" />
          </div>

          {/* OAuth buttons */}
          <div className="space-y-3 animate-pulse">
            <div className="h-12 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
            <div className="h-12 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
          </div>

          {/* Sign up link */}
          <div className="h-4 w-64 rounded bg-gray-200 dark:bg-gray-800 mx-auto" />
        </div>
      </div>
    </div>
  );
}
