"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { activities, contentPosts, moderationRecords, rewards, users } from "@/db/schema";
import { getAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { ACTIVITY_KINDS } from "@/lib/domain";
import { PHOTO_KEYS } from "@/lib/media";

async function requireAdmin() {
  const a = await getAdmin();
  if (!a) redirect("/admin");
  return a;
}
function s(fd: FormData, k: string) {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
}

export async function createPost(fd: FormData) {
  const admin = await requireAdmin();
  const kind = s(fd, "kind");
  const title = s(fd, "title");
  const excerpt = s(fd, "excerpt");
  const body = s(fd, "body");
  const coverKey = s(fd, "coverKey");
  const publish = s(fd, "publish") === "on";
  if (!["blog", "article", "announcement"].includes(kind) || title.length < 5 || body.length < 30) {
    redirect("/admin?tab=content&msg=" + encodeURIComponent("A post needs a title and at least 30 characters of body text."));
  }
  await db.insert(contentPosts).values({
    kind,
    title,
    excerpt: excerpt || body.slice(0, 160),
    body,
    coverKey: PHOTO_KEYS.includes(coverKey) ? coverKey : null,
    status: publish ? "published" : "draft",
    pinned: kind === "announcement" && s(fd, "pinned") === "on",
    authorName: admin.name,
    publishedAt: publish ? new Date() : null,
  });
  await db.insert(moderationRecords).values({ targetType: "content_post", action: publish ? "post:published" : "post:drafted", actor: admin.name });
  revalidatePath("/admin");
  revalidatePath("/updates");
  revalidatePath("/");
  redirect("/admin?tab=content&msg=" + encodeURIComponent(publish ? "Post published." : "Draft saved."));
}

export async function setPostStatus(fd: FormData) {
  const admin = await requireAdmin();
  const id = s(fd, "id");
  const status = s(fd, "status");
  if (!["draft", "published", "archived"].includes(status)) return;
  await db
    .update(contentPosts)
    .set({ status, publishedAt: status === "published" ? new Date() : null })
    .where(eq(contentPosts.id, id));
  await db.insert(moderationRecords).values({ targetType: "content_post", targetId: id, action: `post:${status}`, actor: admin.name });
  revalidatePath("/admin");
  revalidatePath("/updates");
  revalidatePath("/");
}

export async function updatePost(fd: FormData) {
  const admin = await requireAdmin();
  const id = s(fd, "id");
  const title = s(fd, "title");
  const body = s(fd, "body");
  if (title.length < 5 || body.length < 30) return;
  await db.update(contentPosts).set({ title, body, excerpt: s(fd, "excerpt") || body.slice(0, 160) }).where(eq(contentPosts.id, id));
  await db.insert(moderationRecords).values({ targetType: "content_post", targetId: id, action: "post:edited", actor: admin.name });
  revalidatePath("/admin");
  revalidatePath("/updates");
}

export async function reviewActivity(fd: FormData) {
  const admin = await requireAdmin();
  const id = s(fd, "id");
  const verdict = s(fd, "verdict");
  if (!["approved", "declined"].includes(verdict)) return;
  const [a] = await db.select().from(activities).where(eq(activities.id, id));
  if (!a || a.status !== "pending") return;
  await db.update(activities).set({ status: verdict, reviewedBy: admin.name, reviewNote: s(fd, "note") || null }).where(eq(activities.id, id));
  if (verdict === "approved") {
    const points = ACTIVITY_KINDS.find((k) => k.id === a.kind)?.points ?? 10;
    const [prior] = await db.select({ id: rewards.id }).from(rewards).where(and(eq(rewards.sourceType, "activity"), eq(rewards.sourceId, id))).limit(1);
    if (!prior) {
      await db.insert(rewards).values({
        userId: a.userId,
        kind: "activity",
        title: `Verified ${a.kind.replace("_", " ")} action`,
        description: a.title,
        points,
        sourceType: "activity",
        sourceId: id,
        awardedBy: admin.name,
      });
    }
  }
  await db.insert(moderationRecords).values({ targetType: "activity", targetId: id, action: `activity:${verdict}`, actor: admin.name });
  revalidatePath("/admin");
  revalidatePath("/account");
  revalidatePath("/recognition");
}

export async function awardKudos(fd: FormData) {
  const admin = await requireAdmin();
  const userId = s(fd, "userId");
  const note = s(fd, "note");
  if (!/^[0-9a-f-]{36}$/.test(userId) || note.length < 3) {
    redirect("/admin?tab=recognition&msg=" + encodeURIComponent("Select a participant and write a short reason for the kudos."));
  }
  await db.insert(rewards).values({
    userId,
    kind: "kudos",
    title: "Kudos from a YouSee moderator",
    description: note,
    points: 15,
    sourceType: "manual",
    awardedBy: admin.name,
  });
  await db.insert(moderationRecords).values({ targetType: "reward", action: "kudos:awarded", note, actor: admin.name });
  revalidatePath("/admin");
  revalidatePath("/recognition");
  revalidatePath("/account");
  redirect("/admin?tab=recognition&msg=" + encodeURIComponent("Kudos awarded. It is now visible in the audit log."));
}

/** Admin credentials are issued MANUALLY by the operator. No self-registration, no social login. */
export async function createAdminAccount(fd: FormData) {
  const admin = await requireAdmin();
  const email = s(fd, "email").toLowerCase();
  const password = s(fd, "password");
  const displayName = s(fd, "displayName");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 12 || displayName.length < 2) {
    redirect("/admin?tab=admins&msg=" + encodeURIComponent("Use a valid email, a name, and a password of at least 12 characters."));
  }
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) redirect("/admin?tab=admins&msg=" + encodeURIComponent("That email already has an account."));
  await db.insert(users).values({
    displayName,
    email,
    passwordHash: hashPassword(password),
    provider: "manual",
    role: "admin",
    verified: true,
    verificationNote: `Issued manually by ${admin.name}; identity checked offline before issuing credentials.`,
  });
  await db.insert(moderationRecords).values({ targetType: "admin_account", action: "admin:created", note: email, actor: admin.name });
  redirect("/admin?tab=admins&msg=" + encodeURIComponent("Admin account created and marked verified. Give the credentials to that person privately."));
}
