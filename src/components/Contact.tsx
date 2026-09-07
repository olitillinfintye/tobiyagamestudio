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
import { SectionHeader } from "./SectionHeader";
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
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="section-padding relative bg-secondary/30"
    >
      <div className="absolute inset-0 grid-overlay opacity-20" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        <SectionHeader
          id="contact-heading"
          eyebrow="Get in Touch"
          title={
            <>
              Let's <span className="gradient-text">Connect</span>
            </>
          }
          description="Ready to bring your XR vision to life? Let's discuss how we can create immersive experiences together."
        />

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto items-start">
          {/* Contact details */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="space-y-6 md:space-y-8"
          >
            <div>
              <h3 className="font-display text-display-md font-bold mb-3">Contact Information</h3>
              <p className="text-muted-foreground text-pretty">
                We're here to help and answer any questions you might have. We look forward to
                hearing from you.
              </p>
            </div>

            <ul className="space-y-4">
              {contactInfo.map((info) => (
                <li key={info.label} className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                    <info.icon className="w-5 h-5 text-primary" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-muted-foreground">{info.label}</span>
                    {info.href ? (
                      <a
                        href={info.href}
                        target={info.href.startsWith("http") ? "_blank" : undefined}
                        rel={info.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="inline-block rounded py-1 font-medium hover:text-primary transition-colors focus-ring"
                      >
                        {info.value}
                      </a>
                    ) : (
                      <span className="font-medium">{info.value}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <div className="glass-card overflow-hidden">
              <iframe
                src={MAP_EMBED_SRC}
                title="Map showing Tobiya Game Studio at Creative Hub, Piyasa, Addis Ababa"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                // Tones the bright Google tiles down to match the dark surface
                className="rounded-xl dark:invert dark:hue-rotate-180 dark:brightness-95 dark:contrast-90"
              />
            </div>
          </motion.div>

          {/* Form — sticky so it tracks the taller details column instead of
              leaving a large dead space at desktop. */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:sticky lg:top-28"
          >
            {submitted ? (
              <div className="glass-card p-8 text-center" role="status">
                <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-success" aria-hidden="true" />
                <h3 className="font-display text-display-sm font-bold mb-2">Message sent</h3>
                <p className="text-muted-foreground mb-6">
                  Thanks for reaching out — we typically reply within two business days.
                </p>
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="glass-card p-6 md:p-8 space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-medium">
                      Your name
                    </label>
                    <Input
                      id="name"
                      autoComplete="name"
                      placeholder="Abebe Bekele"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "name-error" : undefined}
                      className={cn("bg-background/60", errors.name && "border-destructive")}
                      {...register("name")}
                    />
                    <span id="name-error">{fieldError(errors.name?.message)}</span>
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium">
                      Email address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      className={cn("bg-background/60", errors.email && "border-destructive")}
                      {...register("email")}
                    />
                    <span id="email-error">{fieldError(errors.email?.message)}</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="mb-2 block text-sm font-medium">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    placeholder="Project inquiry"
                    aria-invalid={!!errors.subject}
                    aria-describedby={errors.subject ? "subject-error" : undefined}
                    className={cn("bg-background/60", errors.subject && "border-destructive")}
                    {...register("subject")}
                  />
                  <span id="subject-error">{fieldError(errors.subject?.message)}</span>
                </div>

                <div>
                  <label htmlFor="message" className="mb-2 block text-sm font-medium">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    rows={5}
                    placeholder="Tell us about your project, timeline, and what success looks like."
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? "message-error" : undefined}
                    className={cn("resize-none bg-background/60", errors.message && "border-destructive")}
                    {...register("message")}
                  />
                  <span id="message-error">{fieldError(errors.message?.message)}</span>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 w-full text-base font-semibold glow-primary"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" aria-hidden="true" />
                      Send message
                    </>
                  )}
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
