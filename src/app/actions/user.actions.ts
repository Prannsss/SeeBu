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
  phone: z.string().optional(),
  role: z.enum(["CLIENT", "USER", "ADMIN", "SUPERADMIN", "WORKFORCE_ADMIN", "WORKFORCE_OFFICER"]).optional(),
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
  const sessionToken = reqCookies.get("auth-token")?.value;
  if (!sessionToken) {
    throw new Error("Missing authentication token");
  }

  // 3. We cannot decrypt JWT reliably without the secret on the edge, 
  // so we'll just pass the token to the backend when needed.
  return { token: sessionToken };
}

// ============================================================================
// 3. Server Actions
// ============================================================================
export async function getUserProfile() {
  try {
    const session = await verifyAuthAndGetSession();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    
    const response = await fetch(`${apiUrl}/api/v1/users/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${session.token}`,
        "Content-Type": "application/json"
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      throw new Error(`Failed to fetch profile: ${response.statusText}`);
    }

    const { data } = await response.json();
    return data;
  } catch (error: any) {
    console.error("[getUserProfile_ERROR]", error.message);
    return null;
  }
}

export async function logoutUser() {
  const reqCookies = await cookies();
  reqCookies.delete("auth-token");
  reqCookies.delete("user-role");
}
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

    const { id, name, email, phone } = validatedData.data;

    // 2. Business Logic / Database Transaction (Separation of concerns: delegate to Service layer usually)
    // We send a request to backend to update user
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const response = await fetch(`${apiUrl}/api/v1/users/me`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${session.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ full_name: name, email, contact_number: phone })
    });

    if (!response.ok) {
      return { success: false, error: "Profile update failed in backend" };
    }

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