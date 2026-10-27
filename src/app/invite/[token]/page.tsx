"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, MailX, Clock, AlertCircle } from "lucide-react";
import { gooeyToast } from "goey-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiClient, type InvitationDetails } from "@/lib/api";

const ROLE_BLURB: Record<string, string> = {
  superadmin:
    "As a Super Admin, you'll oversee reports and analytics across every municipality and manage SeeBu's admins.",
  admin:
    "As an Admin, you'll review incoming reports for your municipality, route them to the right departments, and manage your team.",
  "workforce-admin":
    "As a Workforce Admin, you'll receive the reports routed to your department and assign them to your field officers.",
  workforce:
    "As a Workforce Officer, you'll receive tasks from your department, carry out the work, and upload proof photos when it's done.",
};

const article = (word: string) => (/^[aeiou]/i.test(word) ? "an" : "a");
// Admins serve a municipality ("an Admin for Cebu City") and superadmins all of them; department staff work in one.
const placePreposition = (role: string) => (role === "admin" || role === "superadmin" ? "for" : "in");

type View =
  | { kind: "loading" }
  | { kind: "invite"; invite: InvitationDetails }
  | { kind: "accepted"; email: string }
  | { kind: "declined"; inviterName: string }
  | { kind: "closed"; title: string; message: string; icon: "clock" | "alert" | "check"; email?: string };

function closedView(invite: InvitationDetails): View | null {
  switch (invite.status) {
    case "expired":
      return { kind: "closed", icon: "clock", title: "This invitation has expired", message: `Please ask ${invite.inviterName} to send you a new one.` };
    case "accepted":
      return { kind: "closed", icon: "check", title: "You've already accepted", message: "Sign in with your email and temporary password to continue.", email: invite.email };
    case "declined":
      return { kind: "closed", icon: "alert", title: "This invitation was declined", message: `If that was a mistake, please ask ${invite.inviterName} to invite you again.` };
    case "replaced":
      return { kind: "closed", icon: "alert", title: "This invitation was replaced", message: "Please use the link in your most recent invitation email." };
    case "cancelled":
      return { kind: "closed", icon: "alert", title: "This invitation was cancelled", message: `It was withdrawn, so it can no longer be used. If you think this is a mistake, please reach out to ${invite.inviterName}.` };
    case "revoked":
      return { kind: "closed", icon: "alert", title: "This invitation is no longer active", message: "Your access through this invitation was removed. If you think this is a mistake, please contact your administrator." };
    default:
      return null;
  }
}

export default function InvitationPage() {
  const params = useParams<{ token: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const [view, setView] = useState<View>({ kind: "loading" });
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient.invitations
      .get(token)
      .then(({ data }) => {
        if (!cancelled) setView(closedView(data) ?? { kind: "invite", invite: data });
      })
      .catch((err) => {
        if (cancelled) return;
        const offline = String(err?.message || "").startsWith("API network error");
        setView({
          kind: "closed",
          icon: "alert",
          title: "We couldn't open this invitation",
          message: offline
            ? "We couldn't reach SeeBu just now. Please check your connection and try again in a moment."
            : err?.message || "Please use the link from your invitation email.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const accept = async () => {
    setBusy("accept");
    try {
      const { data } = await apiClient.invitations.accept(token);
      setView({ kind: "accepted", email: data.email });
    } catch (err: any) {
      gooeyToast.error("Couldn't Accept Invitation", { description: err?.message || "Please try again." });
    } finally {
      setBusy(null);
    }
  };

  const decline = async (inviterName: string) => {
    setBusy("decline");
    try {
      await apiClient.invitations.decline(token);
      setView({ kind: "declined", inviterName });
    } catch (err: any) {
      gooeyToast.error("Couldn't Decline Invitation", { description: err?.message || "Please try again." });
    } finally {
      setBusy(null);
    }
  };

  const loginHref = (email?: string) => `/auth/login${email ? `?email=${encodeURIComponent(email)}` : ""}`;

  return (
    <div className="min-h-screen flex bg-background-light dark:bg-gray-950">
      {/* Left Side */}
      <div className="hidden lg:flex lg:w-1/2 p-12 items-center justify-center relative overflow-hidden auth-bg">
        <div className="relative z-10 max-w-lg w-full">
          <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6">
            Be Part of the <span className="font-display italic text-yellow-500">Solution</span>
          </h1>
          <p className="text-gray-700 text-lg mb-8 leading-relaxed">
            Join the team helping Cebu resolve community concerns faster — from the first report to the finished fix.
          </p>
          <div className="rounded-2xl overflow-hidden">
            <Image src="/gifs/auth.webp" alt="SeeBu in action" width={800} height={600} unoptimized className="w-full h-auto" />
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 pt-20 sm:pt-24 lg:pt-12">
        <div className="w-full max-w-md animate-in fade-in duration-500" aria-live="polite">
          <div className="md:hidden mb-6 flex justify-center">
            <Image src="/assets/logo-128.png" alt="SeeBu Logo" width={60} height={60} />
          </div>

          {view.kind === "loading" && (
            <div className="space-y-4" role="status">
              <span className="sr-only">Loading invitation…</span>
              <Skeleton className="h-10 w-2/3 bg-slate-200" />
              <Skeleton className="h-5 w-full bg-slate-200" />
              <Skeleton className="h-5 w-5/6 bg-slate-200" />
              <Skeleton className="h-28 w-full bg-slate-200" />
              <Skeleton className="h-12 w-full bg-slate-200" />
            </div>
          )}

          {view.kind === "invite" && (
            <div className="space-y-6 sm:space-y-8">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 text-primary font-bold tracking-widest text-xs uppercase mb-3 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <span className="material-symbols-outlined text-base" aria-hidden="true">mail</span>
                  Invitation
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-text-main dark:text-white mb-2 sm:mb-3">
                  You&apos;re invited!
                </h2>
                <p className="text-base text-text-muted dark:text-gray-400 leading-relaxed">
                  <strong className="text-text-main dark:text-white">{view.invite.inviterName}</strong> has invited you to become{" "}
                  {article(view.invite.roleLabel)} <strong className="text-text-main dark:text-white">{view.invite.roleLabel}</strong>{" "}
                  {placePreposition(view.invite.role)}{" "}
                  <strong className="text-text-main dark:text-white">{view.invite.placeName}</strong>.
                </p>
                <p className="mt-3 text-sm text-text-muted dark:text-gray-400 leading-relaxed">{ROLE_BLURB[view.invite.role]}</p>
              </div>

              <dl className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted dark:text-gray-400">Role</dt>
                  <dd className="font-semibold text-text-main dark:text-white text-right">{view.invite.roleLabel}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted dark:text-gray-400">Name</dt>
                  <dd className="font-semibold text-text-main dark:text-white text-right">{view.invite.inviteeName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted dark:text-gray-400">Email</dt>
                  <dd className="font-semibold text-text-main dark:text-white text-right break-all">{view.invite.email}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted dark:text-gray-400">Expires</dt>
                  <dd className="font-semibold text-text-main dark:text-white text-right">
                    {new Date(view.invite.expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </dd>
                </div>
              </dl>

              <div className="grid grid-cols-2 gap-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      disabled={busy !== null}
                      className="h-12 text-base bg-sky-700 hover:bg-sky-800 text-white font-bold"
                    >
                      Decline
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="sm:rounded-[16px] rounded-[16px] max-w-[90vw] sm:max-w-md w-full">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl">Decline this invitation?</AlertDialogTitle>
                      <AlertDialogDescription className="text-base text-slate-600 dark:text-slate-400">
                        Your account won&apos;t be activated, and we&apos;ll let {view.invite.inviterName} know.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4 gap-3 sm:gap-3">
                      <AlertDialogCancel className="h-11 rounded-md font-bold bg-sky-700 hover:bg-sky-800 text-white border-sky-700 m-0">
                        Keep Invitation
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => decline(view.invite.inviterName)}
                        className="h-11 rounded-md bg-red-600 text-white hover:bg-red-700 font-bold shadow-sm"
                      >
                        Decline
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button
                  type="button"
                  onClick={accept}
                  disabled={busy !== null}
                  className="h-12 text-base bg-primary hover:bg-primary-dark text-white font-bold shadow-lg disabled:opacity-60"
                >
                  {busy === "accept" ? "Accepting…" : "Accept Invitation"}
                </Button>
              </div>

              <p className="text-xs text-text-muted dark:text-gray-400 text-center lg:text-left">
                By accepting, you agree to SeeBu&apos;s{" "}
                <Link href="/terms" target="_blank" className="text-primary underline">Terms of Service</Link> and{" "}
                <Link href="/privacy" target="_blank" className="text-primary underline">Privacy Policy</Link>.
              </p>
            </div>
          )}

          {view.kind === "accepted" && (
            <div className="space-y-6 text-center lg:text-left">
              <CheckCircle2 className="h-14 w-14 text-emerald-600 mx-auto lg:mx-0" aria-hidden="true" />
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-text-main dark:text-white mb-2">Invitation accepted!</h2>
                <p className="text-base text-text-muted dark:text-gray-400 leading-relaxed">
                  Welcome aboard! Next, sign in with <strong className="text-text-main dark:text-white break-all">{view.email}</strong> and the
                  temporary password from your invitation email. You&apos;ll then choose your own password.
                </p>
              </div>
              <Button asChild className="w-full h-12 text-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg">
                <Link href={loginHref(view.email)}>Continue to Sign In</Link>
              </Button>
            </div>
          )}

          {view.kind === "declined" && (
            <div className="space-y-6 text-center lg:text-left">
              <MailX className="h-14 w-14 text-slate-500 mx-auto lg:mx-0" aria-hidden="true" />
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-text-main dark:text-white mb-2">Invitation declined</h2>
                <p className="text-base text-text-muted dark:text-gray-400 leading-relaxed">
                  Thank you for letting us know. We&apos;ve told {view.inviterName}, and no account was activated. You can close this page.
                </p>
              </div>
              <Link href="/" className="inline-block text-primary font-bold hover:underline">Go to the SeeBu home page</Link>
            </div>
          )}

          {view.kind === "closed" && (
            <div className="space-y-6 text-center lg:text-left">
              {view.icon === "clock" ? (
                <Clock className="h-14 w-14 text-amber-600 mx-auto lg:mx-0" aria-hidden="true" />
              ) : view.icon === "check" ? (
                <CheckCircle2 className="h-14 w-14 text-emerald-600 mx-auto lg:mx-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="h-14 w-14 text-slate-500 mx-auto lg:mx-0" aria-hidden="true" />
              )}
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-text-main dark:text-white mb-2">{view.title}</h2>
                <p className="text-base text-text-muted dark:text-gray-400 leading-relaxed">{view.message}</p>
              </div>
              {view.icon === "check" ? (
                <Button asChild className="w-full h-12 text-lg bg-primary hover:bg-primary-dark text-white font-bold shadow-lg">
                  <Link href={loginHref(view.email)}>Sign In</Link>
                </Button>
              ) : (
                <Link href="/" className="inline-block text-primary font-bold hover:underline">Go to the SeeBu home page</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
