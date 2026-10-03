import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Phone, MapPin, Send, Globe, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cms, request } from "@/integrations/cpanel/client";
import { cn } from "@/lib/utils";

interface ContactInfo {
  icon: React.ElementType;
  label: string;
  value: string;
  href: string | null;
}

const iconMap: Record<string, React.ElementType> = {
  contact_email: Mail,
  contact_phone: Phone,
  contact_location: MapPin,
  contact_website: Globe,
};

const defaultContactInfo: ContactInfo[] = [
  {
    icon: Mail,
    label: "Email",
    value: "contact@tobiyastudio.com",
    href: "mailto:contact@tobiyastudio.com",
  },
  { icon: Phone, label: "Phone", value: "+251 922039319", href: "tel:+251922039319" },
  {
    icon: MapPin,
    label: "Location",
    value: "Creative Hub, Piyasa, Addis Ababa, Ethiopia",
    href: "https://maps.app.goo.gl/aFwbM2AsthHskViJ9",
  },
  {
    icon: Globe,
    label: "Website",
    value: "www.tobiyastudio.com",
    href: "https://www.tobiyastudio.com",
  },
];

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100, "That name is too long."),
  email: z.string().trim().email("Please enter a valid email address.").max(200),
  subject: z
    .string()
    .trim()
    .min(3, "Please add a short subject.")
    .max(150, "Please keep the subject under 150 characters."),
  message: z
    .string()
    .trim()
    .min(20, "Please tell us a little more — at least 20 characters.")
    .max(4000, "Please keep your message under 4000 characters."),
});

type ContactFormValues = z.infer<typeof contactSchema>;

/** Coordinates for Creative Hub, Piyasa — matches the address shown alongside. */
const MAP_EMBED_SRC =
  "https://www.google.com/maps?q=9.0378,38.7520&z=15&output=embed";

export default function Contact() {
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>(defaultContactInfo);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    const fetchContactInfo = async () => {
      const { data } = await cms
        .from("site_settings")
        .select("*")
        .in("key", ["contact_email", "contact_phone", "contact_location", "contact_website"]);

      if (!data || data.length === 0) return;

      setContactInfo(
        data.map((setting: { key: string; label?: string; value: string }) => {
          const icon = iconMap[setting.key] || Globe;
          let href: string | null = null;

          if (setting.key === "contact_email") href = `mailto:${setting.value}`;
          else if (setting.key === "contact_phone") href = `tel:${setting.value.replace(/\s/g, "")}`;
          else if (setting.key === "contact_website")
            href = setting.value.startsWith("http") ? setting.value : `https://${setting.value}`;

          return { icon, label: setting.label || setting.key, value: setting.value, href };
        }),
      );
    };

    fetchContactInfo();
  }, []);

  /**
   * Courtesy throttle only — localStorage is trivially cleared, so this stops
   * accidental double-submits, not abuse. Real rate limiting belongs in the
  * PHP API.
   */
  const isThrottled = () => {
    const last = localStorage.getItem("lastContactSubmit");
    if (last && Date.now() - Number(last) < 60_000) {
      toast.error("Please wait a moment before sending another message.");
      return true;
    }
    return false;
  };

  const onSubmit = async (values: ContactFormValues) => {
    if (isThrottled()) return;

    const payload = {
      name: values.name,
      email: values.email,
      subject: values.subject,
      message: values.message,
    };

    try {
      const { error } = await request("contact", payload);

      if (error) throw error;

      localStorage.setItem("lastContactSubmit", Date.now().toString());
      setSubmitted(true);
      reset();
      toast.success("Message sent — we'll get back to you soon.");
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast.error("We couldn't send that. Please try again, or email us directly.");
    }
  };

  const fieldError = (message?: string) =>
    message ? (
      <p role="alert" className="mt-1.5 text-sm text-destructive">
        {message}
      </p>
    ) : null;

  return (
    <section id="contact" aria-labelledby="contact-heading" className="section-padding relative">
      <div className="container mx-auto grid items-stretch gap-6 px-5 lg:grid-cols-2 lg:gap-10">
        {/* Portal + contact details */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
          className="vr-portal flex min-h-[460px] flex-col justify-end p-7 sm:p-10"
        >
          <span className="p-ring s" aria-hidden="true" />
          <span className="p-ring" aria-hidden="true" />
          <div className="relative">
            <span className="mono text-primary">Contact</span>
            <h2 id="contact-heading" className="mt-3 text-[clamp(2.25rem,4.4vw,3.75rem)] font-semibold leading-none tracking-[-0.03em]">
              Step through.
              <br />
              Let's build together.
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {contactInfo.map((info) => (
                <li key={info.label} className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
                    <info.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="mono block text-muted-foreground">{info.label}</span>
                    {info.href ? (
                      <a
                        href={info.href}
                        target={info.href.startsWith("http") ? "_blank" : undefined}
                        rel={info.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="break-words rounded text-sm font-medium transition-colors hover:text-primary focus-ring"
                      >
                        {info.value}
                      </a>
                    ) : (
                      <span className="break-words text-sm font-medium">{info.value}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }}
        >
          {submitted ? (
            <div className="glass-card flex h-full flex-col items-center justify-center p-8 text-center" role="status">
              <CheckCircle2 className="mb-4 h-12 w-12 text-success" aria-hidden="true" />
              <h3 className="mb-2 text-2xl font-semibold">Transmission received</h3>
              <p className="mb-6 text-muted-foreground">Thanks for reaching out — we typically reply within two business days.</p>
              <Button variant="outline" className="vr-btn-ghost" onClick={() => setSubmitted(false)}>
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="glass-card grid h-full content-start gap-4 p-6 sm:p-10">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mono mb-2 block text-muted-foreground">
                    Name
                  </label>
                  <Input
                    id="name"
                    autoComplete="name"
                    placeholder="Abebe Bekele"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    className={cn("h-12 rounded-xl bg-background/60", errors.name && "border-destructive")}
                    {...register("name")}
                  />
                  <span id="name-error">{fieldError(errors.name?.message)}</span>
                </div>
                <div>
                  <label htmlFor="email" className="mono mb-2 block text-muted-foreground">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className={cn("h-12 rounded-xl bg-background/60", errors.email && "border-destructive")}
                    {...register("email")}
                  />
                  <span id="email-error">{fieldError(errors.email?.message)}</span>
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="mono mb-2 block text-muted-foreground">
                  Project type / subject
                </label>
                <Input
                  id="subject"
                  placeholder="VR experience, game, AR app…"
                  aria-invalid={!!errors.subject}
                  aria-describedby={errors.subject ? "subject-error" : undefined}
                  className={cn("h-12 rounded-xl bg-background/60", errors.subject && "border-destructive")}
                  {...register("subject")}
                />
                <span id="subject-error">{fieldError(errors.subject?.message)}</span>
              </div>

              <div>
                <label htmlFor="message" className="mono mb-2 block text-muted-foreground">
                  Message
                </label>
                <Textarea
                  id="message"
                  rows={5}
                  placeholder="Tell us about the world you want to build"
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? "message-error" : undefined}
                  className={cn("resize-none rounded-xl bg-background/60", errors.message && "border-destructive")}
                  {...register("message")}
                />
                <span id="message-error">{fieldError(errors.message?.message)}</span>
              </div>

              <Button type="submit" disabled={isSubmitting} className="vr-btn-prime h-12 w-full rounded-xl text-base font-semibold">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" aria-hidden="true" />
                    Send transmission →
                  </>
                )}
              </Button>
            </form>
          )}
        </motion.div>

        <div className="glass-card overflow-hidden lg:col-span-2">
          <iframe
            src={MAP_EMBED_SRC}
            title="Map showing Tobiya Game Studio at Creative Hub, Piyasa, Addis Ababa"
            width="100%"
            height="260"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block invert hue-rotate-180 brightness-90 contrast-90"
          />
        </div>
      </div>
    </section>
  );
}