import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { E2E_ROLE_COOKIE, getE2eSessionUser, getE2eUser, isE2eMode, parseE2eRole } from "./e2e";
import { getUserProfile, logAudit, upsertUserProfile } from "./db";
import { roleForEmail } from "./roles";
import type { UserProfile } from "./types";

export async function getSessionUser(): Promise<{
  userId: string;
  email: string;
  name: string;
} | null> {
  if (isE2eMode()) {
    const e2e = await getE2eSessionUser();
    if (e2e) return e2e;
    const cookieRole = (await cookies()).get(E2E_ROLE_COOKIE)?.value;
    if (!cookieRole) return null;
    const user = getE2eUser(parseE2eRole(cookieRole));
    return { userId: user.userId, email: user.email, name: user.name };
  }

  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  return {
    userId,
    email: user?.primaryEmailAddress?.emailAddress ?? "unknown@example.com",
    name: user?.fullName ?? user?.firstName ?? "User",
  };
}

export async function ensureUserProfile(session: {
  userId: string;
  email: string;
  name: string;
}): Promise<UserProfile> {
  const existing = await getUserProfile(session.userId);
  const role = roleForEmail(session.email);

  if (!existing) {
    const profile = await upsertUserProfile({
      clerk_user_id: session.userId,
      email: session.email,
      name: session.name,
      role,
    });
    await logAudit({
      user_id: session.userId,
      user_email: session.email,
      user_role: profile.role,
      action: "ASSIGN_ROLE",
      entity_type: "patient",
      entity_id: session.userId,
      details: `Role set to ${profile.role}`,
    });
    return profile;
  }

  if (
    existing.role !== role ||
    existing.email !== session.email ||
    existing.name !== session.name
  ) {
    return upsertUserProfile({
      ...existing,
      email: session.email,
      name: session.name,
      role,
      department: role === "Patient" || role === "Admin" ? undefined : existing.department,
    });
  }

  return existing;
}

export async function getSessionProfile(): Promise<UserProfile | null> {
  const session = await getSessionUser();
  if (!session) return null;
  return (await getUserProfile(session.userId)) ?? null;
}

export async function requireProfile(): Promise<UserProfile> {
  const session = await getSessionUser();
  if (!session) throw new Error("Unauthorized");
  return ensureUserProfile(session);
}
