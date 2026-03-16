"use server";

import { z } from "zod";
import { cookies, headers } from "next/headers";

// ============================================================================
// 1. Zod Validation Schemas
// ============================================================================

const UpdateUserProfileSchema = z.object({
  id: z.string().uuid("Invalid User ID format"),
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email format"),
  role: z.enum(["USER", "ADMIN", "SUPERADMIN"]).optional(),
});

// Define expected structured return type wrapper
type ActionResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string; issues?: z.ZodIssue[] };

// ============================================================================
// 2. Security & Token Verification (Middleware/Gatekeeper logic)
// ============================================================================

async function verifyAuthAndGetSession() {
  const reqHeaders = await headers();
  const reqCookies = await cookies();

  // 1. Check CSRF / Origin headers if applicable
  const origin = reqHeaders.get("origin");
  if (origin && !origin.includes(process.env.NEXT_PUBLIC_APP_URL || "localhost")) {
    throw new Error("Unauthorized Origin");
  }

  // 2. Validate session token presence
  const sessionToken = reqCookies.get("session_token")?.value;
  if (!sessionToken) {
    throw new Error("Missing authentication token");
  }

  // 3. (Mock) verify token and extract user
  // const verifiedUser = await verifyToken(sessionToken);
  const currentUserId = "mock-verified-uuid-from-token"; // Replace with actual verification
  
  return { userId: currentUserId, role: "USER" };
}

// ============================================================================
// 3. Server Actions
// ============================================================================

/**
 * Updates a user's profile securely.
 * Applies Backend Skill rules: Zod Validation, Auth checking, Error Catching.
 */
export async function updateUserProfile(
  rawInput: z.infer<typeof UpdateUserProfileSchema>
): Promise<ActionResponse<{ id: string; name: string }>> {
  try {
    // 0. Authn/Authz (Security Agent Mindset)
    const session = await verifyAuthAndGetSession();

    // 1. Strict Input Validation (Schema Type Assurance)
    const validatedData = UpdateUserProfileSchema.safeParse(rawInput);
    
    if (!validatedData.success) {
      return { 
        success: false, 
        error: "Validation failed", 
        issues: validatedData.error.errors 
      };
    }

    const { id, name, email } = validatedData.data;

    // 2. Ownership / Role Verification
    if (session.userId !== id && session.role !== "ADMIN" && session.role !== "SUPERADMIN") {
      return { success: false, error: "Unauthorized operation on this resource." };
    }

    // 3. Business Logic / Database Transaction (Separation of concerns: delegate to Service layer usually)
    // const updatedUser = await UserService.update(id, { name, email });

    // Mock successful update
    return {
      success: true,
      data: {
        id,
        name,
      }
    };

  } catch (error: any) {
    // Graceful error handling - never crash, never leak sensitive stack traces
    console.error("[updateUserProfile_ERROR]", error.message);
    return {
      success: false,
      error: error.message === "Unauthorized Origin" || error.message === "Missing authentication token"
        ? "Authentication failed" 
        : "An unexpected error occurred processing your request."
    };
  }
}
