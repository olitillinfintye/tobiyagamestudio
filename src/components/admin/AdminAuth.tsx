import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, MailCheck, KeyRound } from "lucide-react";
import { cms } from "@/integrations/cpanel/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type AuthMode = "login" | "forgot" | "reset";

const emailSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(200),
});

const credentialsSchema = emailSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const newPasswordSchema = z
  .object({
    password: z.string().min(12, "Password must be at least 12 characters.").max(72),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

type EmailValues = z.infer<typeof emailSchema>;
type CredentialValues = z.infer<typeof credentialsSchema>;
type NewPasswordValues = z.infer<typeof newPasswordSchema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-sm text-destructive">
      {message}
    </p>
  );
}

function Shell({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="glass-card w-full max-w-md p-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 rounded text-primary hover:underline focus-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to site
        </Link>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function CredentialsForm({ onModeChange }: {
  onModeChange: (m: AuthMode) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CredentialValues>({ resolver: zodResolver(credentialsSchema), mode: "onBlur" });

  const onSubmit = async (values: CredentialValues) => {
    const { error } = await cms.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) toast.error(error.message);
    else toast.success("Logged in.");
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@tobiyastudio.com"
            aria-invalid={!!errors.email}
            className={cn("bg-background/60", errors.email && "border-destructive")}
            {...register("email")}
          />
          <FieldError message={errors.email?.message} />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            {(
              <button
                type="button"
                onClick={() => onModeChange("forgot")}
                className="rounded text-sm text-primary hover:underline focus-ring"
              >
                Forgot password?
              </button>
            )}
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            className={cn("bg-background/60", errors.password && "border-destructive")}
            {...register("password")}
          />
          <FieldError message={errors.password?.message} />
        </div>

        <Button type="submit" disabled={isSubmitting} className="h-11 w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>

    </>
  );
}

/** Step 1 of recovery: request the reset email. */
function ForgotPasswordForm({ onModeChange }: { onModeChange: (m: AuthMode) => void }) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailValues>({ resolver: zodResolver(emailSchema), mode: "onBlur" });

  const onSubmit = async ({ email }: EmailValues) => {
    const { error } = await cms.auth.resetPasswordForEmail(email);

    if (error && /rate|limit|too many/i.test(error.message)) {
      toast.error("Too many attempts. Please wait a minute and try again.");
      return;
    }
    if (error) {
      toast.error(error.message);
      return;
    }

    setSentTo(email);
  };

  if (sentTo) {
    return (
      <div className="text-center" role="status">
        <MailCheck className="mx-auto mb-4 h-12 w-12 text-success" aria-hidden="true" />
        <h2 className="font-display text-lg font-bold">Check your inbox</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          If an account exists for <span className="font-medium text-foreground">{sentTo}</span>,
          we've sent a link to reset the password. It expires in one hour.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Nothing arrived? Check spam, or try again in a minute.
        </p>
        <Button variant="outline" onClick={() => onModeChange("login")} className="mt-6 h-11 w-full">
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <label htmlFor="reset-email" className="mb-2 block text-sm font-medium">
          Email
        </label>
        <Input
          id="reset-email"
          type="email"
          autoComplete="email"
          placeholder="you@tobiyastudio.com"
          aria-invalid={!!errors.email}
          className={cn("bg-background/60", errors.email && "border-destructive")}
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />
      </div>

      <Button type="submit" disabled={isSubmitting} className="h-11 w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Sending…
          </>
        ) : (
          "Send reset link"
        )}
      </Button>

      <button
        type="button"
        onClick={() => onModeChange("login")}
        className="w-full rounded py-2 text-center text-sm text-muted-foreground hover:text-foreground focus-ring"
      >
        Back to login
      </button>
    </form>
  );
}

/** Step 2 of recovery: set the new password using the session from the email link. */
function ResetPasswordForm({ onDone }: { onDone: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordValues>({ resolver: zodResolver(newPasswordSchema), mode: "onBlur" });

  const onSubmit = async (values: NewPasswordValues) => {
    const { error } = await cms.auth.updateUser({ password: values.password });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated. You're signed in.");
    onDone();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <label htmlFor="new-password" className="mb-2 block text-sm font-medium">
          New password
        </label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 12 characters"
          aria-invalid={!!errors.password}
          className={cn("bg-background/60", errors.password && "border-destructive")}
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />
      </div>

      <div>
        <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium">
          Confirm new password
        </label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter the password"
          aria-invalid={!!errors.confirm}
          className={cn("bg-background/60", errors.confirm && "border-destructive")}
          {...register("confirm")}
        />
        <FieldError message={errors.confirm?.message} />
      </div>

      <Button type="submit" disabled={isSubmitting} className="h-11 w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Updating…
          </>
        ) : (
          "Update password"
        )}
      </Button>
    </form>
  );
}

interface AdminAuthProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  /** Called once the password has been successfully changed. */
  onResetComplete: () => void;
}

export default function AdminAuth({ mode, onModeChange, onResetComplete }: AdminAuthProps) {
  if (mode === "reset") {
    return (
      <Shell
        title="Set a new password"
        description="Choose a new password for your admin account."
      >
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-muted-foreground">
          <KeyRound className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span>This link is single-use and expires one hour after it was sent.</span>
        </div>
        <ResetPasswordForm onDone={onResetComplete} />
      </Shell>
    );
  }

  if (mode === "forgot") {
    return (
      <Shell
        title="Reset your password"
        description="Enter the email on your admin account and we'll send a reset link."
      >
        <ForgotPasswordForm onModeChange={onModeChange} />
      </Shell>
    );
  }

  return (
    <Shell title="Admin Login">
      <CredentialsForm onModeChange={onModeChange} />
    </Shell>
  );
}
