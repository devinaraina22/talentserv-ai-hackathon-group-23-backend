import { auth, currentUser } from "@clerk/nextjs/server";
import { getUserProfile, upsertUserProfile } from "./db";
import type { UserProfile, UserRole } from "./types";

export async function getSessionUser(): Promise<{
  userId: string;
  email: string;
  name: string;
} | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  return {
    userId,
    email: user?.primaryEmailAddress?.emailAddress ?? "unknown@example.com",
    name: user?.fullName ?? user?.firstName ?? "User",
  };
}

export async function getSessionProfile(): Promise<UserProfile | null> {
  const session = await getSessionUser();
  if (!session) return null;
  return (await getUserProfile(session.userId)) ?? null;
}

export async function requireProfile(): Promise<UserProfile> {
  const session = await getSessionUser();
  if (!session) throw new Error("Unauthorized");
  const profile = await getUserProfile(session.userId);
  if (!profile) throw new Error("ROLE_REQUIRED");
  return profile;
}

export async function ensureProfile(defaultRole: UserRole = "Receptionist"): Promise<UserProfile> {
  const session = await getSessionUser();
  if (!session) throw new Error("Unauthorized");
  let profile = await getUserProfile(session.userId);
  if (!profile) {
    profile = {
      clerk_user_id: session.userId,
      email: session.email,
      name: session.name,
      role: defaultRole,
    };
    await upsertUserProfile(profile);
  }
  return profile;
}
