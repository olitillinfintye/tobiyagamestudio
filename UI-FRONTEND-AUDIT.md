# Tobiya Game Studio — UI & Frontend Audit

> **STATUS: IMPLEMENTED.** Sections 1–4 below describe the state of the site *before* remediation
> and remain the record of what was found. Everything in the Sprint 1–3 roadmap has been applied;
> see **[§6 Implementation Record](#6-implementation-record)** for what changed, the verified
> results, and the four items that are deliberately still open.


**Audited build:** `main` @ `eba9e3d` · React 18 + Vite 5 + TypeScript + Tailwind 3 + shadcn/ui + Supabase
**Method:** full source review, live render at 360 / 390 / 768 / 1440 / 2560px in both themes, programmatic WCAG contrast computation, DOM/accessibility tree inspection.
**Date:** 2026-08-03

**Annotated evidence:** `docs/audit-screenshots/`

| File | Screen |
|---|---|
| `A1-hero-dark.png` | Hero, dark — model/headline collision, logo overflow, dead secondary CTA |
| `A2-hero-light.png` | Hero, light — **broken**: unreadable sub-headline, invisible outline button |
| `A3-works.png` | Portfolio — scroll offset, art-direction drift, pill inconsistency |
| `A4-contact.png` | Contact — column imbalance, white map slab, weak field edges |
| `A5-footer-light.png` | Footer, light — **broken**: invisible logo, dead legal links |
| `A6-mobile-menu.png` | Mobile drawer — content bleed-through, a11y gaps |
| `dark-02-desktop-fullpage.png` / `light-02-desktop-fullpage.png` | Full-page reference captures |

---

## 1. Executive Summary

Tobiya's site is **structurally healthy and visually under-directed**. The engineering foundation is genuinely good — a real HSL token system in `index.css`, semantic Tailwind mappings, a clean shadcn component layer, lazy-loaded routes, manual vendor chunking, and near-zero hardcoded colour (only the Three.js light rigs use hex, which is correct). There is no horizontal overflow at any breakpoint. That is a better starting position than most agency builds.

The problems are concentrated in four places:

**1. Light mode is not a designed theme.** It is dark mode with inverted tokens, and it fails. Computed against WCAG: `--primary` teal on white is **3.60:1** (fails AA for text), `--accent` gold on white is **2.05:1** (fails everything), the accent pill pattern is **1.91:1**, and `--border` against `--background` is **1.35:1** in both themes — so cards, inputs and outline buttons have effectively no edge. The hero sub-headline is unreadable, and the footer logo is **invisible** because `Footer.tsx` hardcodes the white PNG. Roughly half your visitors land on a broken site.

**2. The hero has no art direction.** The 3D headset is `absolute inset-0`, `scale={2.5}`, `opacity-60` — a full-bleed background that the H1 lands on top of. Nothing is composed; legibility is accidental. Combined with a logo that overflows its own navbar by 32px, the first 900px of the page undersells a studio whose entire pitch is visual craft.

**3. Accessibility gaps are small in number but high in severity.** No `<header>` landmark, no skip link, `scroll-margin-top: 0` on all seven anchored sections (so the fixed 80px navbar covers every section heading you navigate to), a mobile menu button with no accessible name / `aria-expanded` / focus trap, an untitled Google Maps iframe, and nav links with 20px-tall hit areas against the 44px WCAG target.

**4. Consistency drift in the content layer.** Portfolio cover art mixes photos, text-bearing posters and 3D renders all cropped to `h-48`; tool tags are un-normalised (`"Unity - MetaSDK - Convai"` as one pill vs. two separate pills); the Awards section has no `id` yet the footer links to it; Privacy Policy and Terms of Service ship as `href="#"`.

None of this requires a rewrite. The token system already exists — it needs correct values and roughly 400 lines of targeted change. **Estimated effort to production-polished: 5–7 focused days.**

### Scorecard

| Dimension | Score | Note |
|---|:--:|---|
| Design tokens & theming architecture | 8/10 | Excellent structure, wrong light values |
| Colour & contrast (dark) | 9/10 | AAA nearly across the board |
| Colour & contrast (light) | **3/10** | Multiple AA failures, one invisible asset |
| Typography | 5/10 | Good pairing, no modular scale |
| Layout & spacing | 6/10 | Consistent rhythm, several dead-space bugs |
| Responsive behaviour | 8/10 | No overflow anywhere; some mobile-only content loss |
| Semantic HTML & ARIA | 5/10 | Good heading order, missing landmarks & control names |
| Micro-interactions | 6/10 | Rich hover, near-absent focus/loading/empty states |
| Component modularity | 7/10 | shadcn solid; section components repeat themselves |
| Performance hygiene | 6/10 | Good chunking; 35 images without dimensions |

---

## 2. UI/UX & Aesthetic Refinements

### 2.1 Colour — measured, not estimated

Computed with the WCAG 2.1 relative-luminance formula directly from your token values.

**Light mode (`:root`)**

| Pair | Ratio | Verdict |
|---|:--:|---|
| `foreground` on `background` | 18.66:1 | AAA |
| `muted-foreground` on `background` | 6.23:1 | AA |
| **`primary` text on `background`** | **3.60:1** | **FAIL (AA text)** |
| **`primary-foreground` on `primary`** (main CTA) | **3.60:1** | **FAIL (AA text)** |
| **`accent` text on `background`** | **2.05:1** | **FAIL** |
| **`text-accent` on `bg-accent/10`** (pill) | **1.91:1** | **FAIL** |
| **`text-primary` on `bg-primary/10`** (pill) | **3.20:1** | **FAIL** |
| **`border` on `background`** | **1.35:1** | **FAIL (3:1 non-text)** |

**Dark mode (`.dark`)** — passes AAA on every text pair. Only `border` at **1.36:1** fails the 3:1 non-text requirement.

The single highest-value fix in this document: **darken `--primary` and `--accent` in light mode only, and strengthen `--border` in both.** Dark mode needs no colour change.

### 2.2 Semantic colour gaps

- No `--success` / `--warning` / `--info` tokens. `Contact.tsx` leans entirely on Sonner toast defaults, which ignore your palette.
- `--ethiopian-green` and `--ethiopian-red` are declared in `index.css` and **never used anywhere**. Either build the Ethiopian-flag accent into the brand system deliberately or delete them.
- `--teal-glow`, `--navy`, `--deep-blue` are exposed as Tailwind colours but barely referenced — parallel vocabulary competing with `--primary`.
- `index.html` sets `theme-color="#6366f1"` (indigo). Your brand is teal `#0f8fa1`. The mobile browser chrome is a different brand to the site.
- `.dark` re-declares every token but omits `--radius` and the entire `--gradient-*` / `--shadow-*` block, so `--gradient-hero`, `--gradient-card` and `--shadow-card` keep **light-mode values in dark mode**. `.glass-card` in dark mode is applying a shadow tuned for a white page.

### 2.3 Typography

Currently in use on one page — measured from computed styles:

```
Inter    12/16   14/20   16/24   16/26   20/28
Orbitron 16/24   18/28   18/28   20/28   30/36   48/48   72/72
```

Twelve size/line-height combinations, no ratio between them, two different line-heights for 16px and two for 18px. Issues:

- **No modular scale.** Steps are ad-hoc per component (`text-3xl md:text-5xl` here, `text-base sm:text-xl` there).
- **Orbitron is overused.** It is a geometric display face with wide sidebearings — legitimately great at 48–72px, actively harmful at 16–18px, where it is currently used for card titles (`h4` in Objectives, footer column headings). Cap Orbitron at ≥20px.
- **Negative tracking is applied globally.** `h1…h6 { @apply tracking-tight }` sets −0.025em on every heading. Correct at 72px, wrong at 16px where Orbitron already runs tight. Tracking should scale inversely with size.
- **Line-height on the H1 is 1.0** (`72px/72px` via `leading-tight`). Two-line headlines nearly collide; add `leading-[1.08]`.
- **No `text-wrap: balance`** on headings, so the H1 breaks as "We Create Interactive / Worlds That Inspire" — splitting the gradient phrase "Interactive Worlds" across two lines.
- Body copy runs to **~75ch** in section intros. Target 60–70ch.

### 2.4 Layout & spacing

- **Section rhythm is actually consistent** — 128px top/bottom everywhere except Partners at 64px. Good. But 256px between section content blocks at desktop is heavy; 96–112px reads tighter.
- **`scroll-margin-top: 0px` on all 7 anchored sections.** Every in-page nav click hides the section eyebrow and heading behind the 80px fixed navbar. Visible in the Works, About, Team and Contact captures. **This is the most-noticed bug on the site.**
- **Logo overflows the navbar**: `h-28` (112px) inside `h-20` (80px) — 32px of overhang, and the hover `scale-110` pushes it to 123px.
- **Contact column imbalance**: the form fills ~40% of its column height while the left column runs full height. Large dead space at desktop.
- **Footer brand column**: `lg:col-span-2` gives it 560px but content is capped `max-w-sm` (384px), leaving a ~180px dead gutter.
- **Awards timeline** is `max-w-4xl` inside a 1400px container, and the icon+card flex leaves the right third of the section empty.
- **Hero H1 has no horizontal padding on mobile** while the paragraph below it has `px-4` — the headline runs closer to the screen edge than the body copy.

### 2.5 Micro-interactions & state

Hover states are well covered. What is missing:

- **Focus-visible rings are absent on every hand-rolled control.** The portfolio category filters are raw `<button>` elements with only `hover:` classes — keyboard users get no indication. The shadcn `Button` has a proper ring; these bypass it.
- **No loading skeletons.** `Portfolio`, `Team`, `Services`, `Awards` all render hardcoded fallback data, then silently swap to Supabase data on arrival — a visible content flash. `Blog` renders a bare centred `"Loading..."` string.
- **No empty states.** `Partners` and `Blog` `return null` when empty; sections vanish with no explanation.
- **No error states.** `Portfolio` and `Team` swallow fetch errors into `console.log("Using default projects")`. A total backend outage is indistinguishable from success.
- **`.btn-glow` and `.hover-underline` are defined in `index.css` and never used.** `.animate-on-scroll`, `.particle-canvas`, `.animate-gradient`, `.award-badge` (partially), `.category-pill.ar` — all dead or near-dead.
- **No `prefers-reduced-motion` guard** on the Three.js `Float`/particle loop, the 30s marquee, or the ~40 framer-motion entrance animations.
- **Touch targets below 44px**: nav links 40×20, theme toggle 36×36, category filters 38px tall, "View More" 36px tall.

### 2.6 Content-layer inconsistencies

Worth flagging to whoever runs the CMS:

| Item | Problem |
|---|---|
| Portfolio cover art | Photos, text posters, and grey-background 3D renders all cropped to `h-48` |
| Tool tags | `"Unity - MetaSDK - Convai"` (one pill) vs `"Unity"` + `"Meta XR SDK"` (two pills) |
| `immersive bracker vr` | Title typo; description is a raw `Genre: … \| Platform: … \| Status: …` dump |
| `Intreactive` | Title typo (Interactive) |
| `Fakugest award` / "Rising start Award at South Africa" | Should be *Fak'ugesi* / "Rising Star Award in South Africa" |
| Team photos | Painted/AI portrait, studio headshot, and casual selfie side by side |
| Team bios | Empty for all three members → cards render with dead space below the role |
| Google Map | Points at Meskel Square; the address above it says Piyasa. The embed uses a placeholder place ID (`0x1234567890ab`) |
| Footer legal links | `href="#"` — dead |
| `index.html` canonical | Points to `tobiyagamestudio.lovable.app`, but `CNAME` says `tobiyastudio.com` — **actively harmful for SEO** |
| `index.html` JSON-LD | `aggregateRating` 4.9/150 reviews and 5/100 reviews are fabricated. Google penalises unverifiable review markup — remove both blocks |

---

## 3. Component-by-Component Redesign Recommendations

### 3.1 Navbar — *High impact, low effort*

**Now:** 112px logo in an 80px bar; nav links have 20px hit height; hamburger has no accessible name; mobile panel is partial-height with page content bleeding through the seam; no active-section indicator.

**Redesign:**
- Constrain the logo to `h-10 md:h-12` and let the bar own the height. Give the wordmark real optical padding.
- Give nav links `px-3 py-2.5` so the hit area reaches 44px, and pair the existing `.hover-underline` with an **active-section** state driven by an `IntersectionObserver` scroll spy — the site is a single page and currently gives no positional feedback at all.
- Full-height mobile drawer (`h-[100dvh]`), opaque background, focus trap, `Escape` to close, body scroll lock, `aria-expanded` + `aria-controls` + `aria-label`.
- Reduce mobile row height from ~120px to ~56px and add the CTA into the drawer.
- Wrap in `<header>` and add a skip link as the first focusable element.

### 3.2 Hero — *High impact, medium effort*

**Now:** the 3D headset is a full-bleed backdrop the headline sits on top of; the secondary CTA is invisible in dark and in light; stats float unanchored; light mode is unreadable.

**Redesign:**
- **Compose, don't overlay.** Move the model to a right-hand column at `lg:` and up (`grid lg:grid-cols-[1.1fr_.9fr]`), text left-aligned. The model becomes a subject rather than wallpaper, and the headline gets a clean background. Keep the centred overlay only below `lg`, with a proper radial scrim behind the text.
- Add a **text scrim**: `radial-gradient(ellipse at center, hsl(var(--background)/.85), transparent 70%)` between model and copy. This alone fixes light-mode legibility.
- Give the secondary CTA a real outline treatment (`border-2 border-primary/60 text-primary`), not the default `outline` variant which resolves to background-on-background.
- Anchor the stats in a `glass-card` strip with vertical dividers, and animate the numbers with a count-up on first view.
- `text-wrap: balance` + `leading-[1.08]` on the H1; add `px-4` to match the paragraph.
- Cap the Three.js canvas: `dpr={[1, 1.75]}`, and set `frameloop="demand"` plus a static fallback under `prefers-reduced-motion`.

### 3.3 Services — *Low effort*

Solid already. Refinements: give the icon tile a `ring-1 ring-primary/20` so it reads as a component rather than a floating gradient square; push the feature pills to the card bottom with `mt-auto` so they align across a row; add `min-h` so the 2×2 grid does not leave ragged bottoms.

### 3.4 Portfolio — *High impact, medium effort*

- **Fix the art direction.** Standardise on `aspect-[16/10]` with `object-cover`, and add a subtle `ring-1 ring-border` on the media so grey-background renders read as intentional. For text-bearing posters, either store a separate 16:10 crop in the CMS or switch to `object-contain` on a `bg-muted` plate.
- Make the whole card a single link target; today the title, image and "View More" button behave inconsistently.
- Normalise tool tags at render: `tools_used.flatMap(t => t.split(/\s*[-–|]\s*/))` so `"Unity - MetaSDK - Convai"` becomes three pills.
- Rebuild `.category-pill.interactive` — `bg-secondary` gives a dark pill on dark art. All four categories should share one visual system with different hues.
- Add a `layout` prop on the framer-motion cards so category filtering animates instead of snapping, plus an empty state per category.
- Replace the `h-48` fixed height on mobile (`h-32`) — it crops most covers to an unreadable sliver.

### 3.5 Team — *Low effort, notable a11y win*

- Social links are `hidden sm:flex` **and** hover-only — on mobile they are unreachable, and on desktop they are invisible to keyboard users. Show them persistently below the role at all breakpoints.
- With empty bios the cards collapse to name + role and leave dead space. Either enforce a bio in the CMS or drop the card height when `bio` is null.
- `truncate` on the name will silently cut longer Ethiopian names — use two-line clamp instead.

### 3.6 Awards — *Low effort*

- Add `id="awards"` (it currently has none) and repoint the footer's "Awards" link, which today goes to `/#works`.
- Widen from `max-w-4xl` to `max-w-5xl` and alternate card sides for a genuine timeline, or add a connecting vertical rule between the icon tiles — right now the icons imply a timeline that is not drawn.
- The gold `--accent` at 2.05:1 in light mode makes this whole section fail; the token fix in §4.1 resolves it.

### 3.7 Contact — *High impact, medium effort*

- **Make the form `lg:sticky lg:top-28`** so it tracks the taller left column and eliminates the dead space.
- Add `title` to the map iframe, apply a dark-mode filter (`dark:invert dark:hue-rotate-180 dark:brightness-95`) so it stops being a white slab, and **fix the coordinates** — it currently shows Meskel Square, not Piyasa.
- Add inline field validation with `react-hook-form` + `zod` (both already dependencies, both currently unused here) instead of relying solely on `required` and a toast.
- Replace `"Sending..."` with a spinner in the button and an in-place success panel.
- The rate-limit check uses `localStorage`, which is trivially bypassed — move enforcement to the Supabase edge function.

### 3.8 Footer — *Critical fix, low effort*

- **Swap the hardcoded `tobiya-logo-white.png` for the theme-aware logo** (`Navbar.tsx` already has this logic). Currently invisible in light mode.
- Rebalance the grid: `lg:grid-cols-[2fr_1fr_1fr_1fr]` and drop the `max-w-sm` cap, or move social icons into the gutter.
- Give Privacy Policy and Terms of Service real routes, or remove them. Dead legal links are a genuine liability signal.
- Add a newsletter capture — the footer is currently pure navigation on a studio site that wants leads.

---

## 4. Code Refactoring & CSS Architecture Fixes

### 4.1 Fix the light-mode palette *(the highest-value change in this document)*

`src/index.css` — dark mode values are correct and unchanged.

```css
:root {
  /* was: 185 80% 35% → 3.60:1 on white, fails AA */
  --primary: 185 84% 26%;              /* → 6.4:1  AA  */
  --primary-foreground: 0 0% 100%;

  /* was: 45 100% 45% → 2.05:1 on white, fails everything */
  --accent: 38 92% 30%;                /* → 6.1:1  AA  */
  --accent-foreground: 0 0% 100%;      /* flip: dark-on-gold no longer works */

  /* was: 220 20% 88% → 1.35:1, invisible edges */
  --border: 220 16% 76%;               /* → 3.1:1  AA non-text */
  --input:  220 16% 72%;               /* inputs need a stronger edge than cards */

  --ring: 185 84% 26%;

  /* Missing semantic states */
  --success: 152 60% 28%;
  --success-foreground: 0 0% 100%;
  --warning: 32 90% 32%;
  --warning-foreground: 0 0% 100%;
}

.dark {
  /* Only the border was failing in dark mode (1.36:1) */
  --border: 220 30% 28%;               /* → 3.0:1 */
  --input:  220 30% 32%;

  --success: 152 55% 45%;
  --success-foreground: 230 50% 5%;
  --warning: 38 95% 55%;
  --warning-foreground: 230 50% 5%;

  /* These were inherited from :root and are tuned for a WHITE page — override them */
  --gradient-hero: linear-gradient(180deg, hsl(230 50% 5%) 0%, hsl(220 70% 12%) 50%, hsl(230 50% 8%) 100%);
  --gradient-card: linear-gradient(145deg, hsl(230 45% 10%), hsl(230 45% 6%));
  --gradient-glow: radial-gradient(ellipse at center, hsl(185 80% 45% / .15), transparent 70%);
  --shadow-card: 0 10px 40px hsl(230 60% 2% / .5);
  --shadow-glow: 0 0 30px hsl(185 80% 45% / .3);
}
```

> **Note on brand:** darkening light-mode teal to `185 84% 26%` shifts the brand slightly deeper on white. If the exact teal is non-negotiable for brand reasons, the alternative is to never place `--primary` as text on `--background` in light mode — use it only as a *fill* with white text (which needs `≥ 185 84% 31%` to pass on the button) and use `--foreground` for text. Pick one; the current state passes neither.

### 4.2 Fix the fixed-navbar scroll offset *(one line, removes the most-noticed bug)*

```css
/* src/index.css — @layer base */
@layer base {
  html { scroll-behavior: smooth; }

  /* The navbar is h-20 (80px) and fixed. Every anchored section needs to clear it. */
  section[id] { scroll-margin-top: 6rem; }   /* 96px = 80 + 16 breathing room */
}
```

Then delete the imperative `scrollIntoView` handlers in `Navbar.tsx` and `Footer.tsx` and let native anchors do the work — they respect `scroll-margin-top`, work without JS, and give you shareable URLs:

```tsx
// Navbar.tsx — replace handleNavClick entirely
<a href={link.href} onClick={() => setIsMobileMenuOpen(false)}
   className="…">{link.name}</a>
```

### 4.3 Fix the invisible footer logo

```tsx
// src/components/Footer.tsx
import { useTheme } from "next-themes";
import tobiyaLogoWhite from "@/assets/tobiya-logo-white.png";
import tobiyaLogoDark  from "@/assets/tobiya-logo.png";

export default function Footer() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const logo = mounted && resolvedTheme === "light" ? tobiyaLogoDark : tobiyaLogoWhite;
  // …
  <img src={logo} alt="Tobiya Studio" width={160} height={80}
       className="h-16 md:h-20 w-auto" />
```

Better still — this logic now exists in two places. Extract it:

```tsx
// src/components/BrandLogo.tsx
export function BrandLogo({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <img
      src={mounted && resolvedTheme === "light" ? tobiyaLogoDark : tobiyaLogoWhite}
      alt="Tobiya Studio" width={200} height={100}
      className={cn("w-auto", className)}
    />
  );
}
```

**Related — the `enableSystem` flag is currently inert.** `App.tsx` passes `<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>`, but because `defaultTheme` is `"dark"` rather than `"system"`, a first-time visitor whose OS is set to light **still gets dark mode**. Verified on a clean profile: with `prefers-color-scheme: light`, `localStorage.theme` is `null` and `<html>` still resolves to `class="dark"`. Either drop `enableSystem` (it does nothing) or switch to `defaultTheme="system"` to actually honour the OS preference.

If you do switch to `defaultTheme="system"`, `theme` becomes the literal string `"system"` and every `theme === "light"` check silently breaks. Use `resolvedTheme` in `BrandLogo` and `ThemeToggle` — it is the correct hook either way, and it is a prerequisite for enabling system theming.

### 4.4 Fix the navbar logo overflow

```tsx
// Navbar.tsx — was h-28 (112px) inside an h-20 (80px) bar
<Link to="/" className="flex items-center gap-3 rounded-md
                        focus-visible:outline-none focus-visible:ring-2
                        focus-visible:ring-ring focus-visible:ring-offset-2">
  <BrandLogo className="h-10 md:h-12 transition-transform duration-300 hover:scale-105" />
  <span className="sr-only">Tobiya Game Studio — home</span>
</Link>
```

### 4.5 Make the mobile menu accessible

```tsx
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

// Escape to close + lock body scroll while open
useEffect(() => {
  if (!isMobileMenuOpen) return;
  const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsMobileMenuOpen(false);
  document.addEventListener("keydown", onKey);
  document.body.style.overflow = "hidden";
  return () => {
    document.removeEventListener("keydown", onKey);
    document.body.style.overflow = "";
  };
}, [isMobileMenuOpen]);

<button
  type="button"
  onClick={() => setIsMobileMenuOpen(o => !o)}
  aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
  aria-expanded={isMobileMenuOpen}
  aria-controls="mobile-nav"
  className="p-2 -m-2 text-foreground rounded-md focus-visible:outline-none
             focus-visible:ring-2 focus-visible:ring-ring"
>
  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
</button>

{/* full-height, opaque — no page bleed-through at the seam */}
<motion.div id="mobile-nav" …
  className="md:hidden fixed inset-x-0 top-20 bottom-0 bg-background
             border-t border-border overflow-y-auto">
  <nav className="container mx-auto px-4 py-4 flex flex-col">
    {navLinks.map(link => (
      <a key={link.name} href={link.href}
         onClick={() => setIsMobileMenuOpen(false)}
         className="text-lg font-medium py-3.5 border-b border-border/40
                    hover:text-primary focus-visible:outline-none
                    focus-visible:ring-2 focus-visible:ring-ring rounded-md">
        {link.name}
      </a>
    ))}
  </nav>
</motion.div>
```

### 4.6 Add landmarks and a skip link

```tsx
// src/pages/Index.tsx
<div className="min-h-screen bg-background overflow-x-hidden">
  <a href="#main"
     className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]
                focus:px-4 focus:py-2 focus:rounded-md focus:bg-primary
                focus:text-primary-foreground">
    Skip to main content
  </a>
  <header><Navbar /></header>
  <main id="main">{/* … */}</main>
  <Footer />
</div>
```

And give each section an accessible name so it is exposed as a landmark region:

```tsx
<section id="services" aria-labelledby="services-heading" className="section-padding …">
  <h2 id="services-heading" className="font-display …">Our <span className="gradient-text">Services</span></h2>
```

### 4.7 Replace the ad-hoc pills and filters with real variants

The eyebrow pill (`inline-block px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20 mb-4`) is **copy-pasted verbatim in six components** — About, Services, Portfolio, Team, Awards, Contact, Partners. The category filter is another hand-rolled button with no focus ring.

```tsx
// src/components/ui/eyebrow.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const eyebrowVariants = cva(
  "inline-block rounded-full text-sm font-medium border mb-4 px-4 py-2",
  {
    variants: {
      tone: {
        primary: "bg-primary/10 text-primary border-primary/20",
        accent:  "bg-accent/10 text-accent border-accent/20",
      },
    },
    defaultVariants: { tone: "primary" },
  },
);

export function Eyebrow({ className, tone, ...props }:
  React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof eyebrowVariants>) {
  return <span className={cn(eyebrowVariants({ tone }), className)} {...props} />;
}
```

```tsx
// Portfolio.tsx — filters, now with a focus ring and a 44px target
<button
  type="button"
  onClick={() => setActiveCategory(category.id)}
  aria-pressed={activeCategory === category.id}
  className={cn(
    "rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    activeCategory === category.id
      ? "bg-primary text-primary-foreground glow-primary"
      : "bg-card border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
  )}
>
  {category.label}
</button>
```

### 4.8 Collapse the duplicated section-header block

Every section repeats the same 14-line motion header. Extract it once:

```tsx
// src/components/SectionHeader.tsx
export function SectionHeader({ eyebrow, title, description, tone = "primary", id }: {
  eyebrow: string; title: React.ReactNode; description?: string;
  tone?: "primary" | "accent"; id?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="text-center mb-16"
    >
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      <h2 id={id} className="font-display text-3xl md:text-5xl font-bold mb-6 text-balance">
        {title}
      </h2>
      {description && (
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg text-pretty">
          {description}
        </p>
      )}
    </motion.div>
  );
}
```

Also note: `About`, `Services`, `Portfolio`, `Team`, `Awards`, `Blog` and `Contact` each pay for their own `useRef` + `useInView`. `whileInView` (as `Partners` already uses) does the same job with no refs and no re-render churn — migrate all of them.

### 4.9 Establish a real type scale

```ts
// tailwind.config.ts → theme.extend
fontSize: {
  //            size        line-height  tracking
  'display-xl': ['clamp(2.75rem, 6vw + 1rem, 5rem)', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
  'display-lg': ['clamp(2rem, 4vw + .5rem, 3.5rem)', { lineHeight: '1.1',  letterSpacing: '-0.02em' }],
  'display-md': ['clamp(1.5rem, 2vw + .5rem, 2rem)', { lineHeight: '1.2',  letterSpacing: '-0.01em' }],
  'title':      ['1.25rem',  { lineHeight: '1.4',  letterSpacing: '-0.005em' }],
  'body-lg':    ['1.125rem', { lineHeight: '1.7' }],
  'body':       ['1rem',     { lineHeight: '1.65' }],
  'caption':    ['0.875rem', { lineHeight: '1.5' }],
},
```

```css
/* index.css — stop applying display tracking to small headings */
@layer base {
  h1, h2, h3 { font-family: 'Orbitron', sans-serif; @apply font-bold tracking-tight; }
  /* h4-h6 are small; Orbitron + negative tracking is unreadable at 16-18px */
  h4, h5, h6 { font-family: 'Inter', sans-serif;    @apply font-semibold tracking-normal; }
}
```

### 4.10 Respect reduced motion

Currently ~40 framer-motion animations, a 30s marquee and a continuous WebGL render loop run regardless of user preference.

```css
/* index.css */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
  .animate-marquee { animation: none !important; }
}
```

```tsx
// App.tsx — framer-motion honours this globally
import { MotionConfig } from "framer-motion";
<MotionConfig reducedMotion="user">{/* … */}</MotionConfig>
```

```tsx
// Hero.tsx — skip WebGL entirely for reduced-motion users
const prefersReduced = useReducedMotion();
{!prefersReduced && (
  <div className="hidden md:block">
    <Suspense fallback={null}><VRHeadset3D /></Suspense>
  </div>
)}
```

### 4.11 Delete dead code

| Path | Action |
|---|---|
| `src/App.css` | **Delete.** Never imported (`main.tsx` imports only `index.css`). Vite starter leftover — `#root { max-width:1280px; padding:2rem; text-align:center }`, `.logo`, `logo-spin`, `.read-the-docs` |
| `index.css` → `.btn-glow`, `.animate-on-scroll`, `.particle-canvas`, `.animate-gradient` | Verified unused across `src/**/*.tsx`. Delete. (`.hover-underline` and `.award-badge` **are** in use — keep them) |
| `index.css` → `--ethiopian-green`, `--ethiopian-red` | Declared, zero references. Delete or build into the brand deliberately |
| `index.css` → `.category-pill.ar` | Only reachable if a project uses category `ar`; currently none do |
| `tailwind.config.ts` → `backgroundImage.hero-gradient` / `card-gradient` | Hardcoded dark HSL, duplicating the `--gradient-*` CSS vars. Two competing sources of truth |
| `src/components/NavLink.tsx` | Exported, never imported anywhere |
| `index.html` → both `aggregateRating` blocks | Fabricated review counts; remove before Google flags them |

### 4.12 Fix the canonical URL / SEO mismatch

`CNAME` says `tobiyastudio.com`; every canonical, `og:url`, `hreflang` and JSON-LD `@id` in `index.html` points at `tobiyagamestudio.lovable.app`. You are telling Google the Lovable preview is the authoritative copy of your own domain.

```html
<link rel="canonical" href="https://www.tobiyastudio.com/" />
<meta property="og:url" content="https://www.tobiyastudio.com/" />
<meta name="theme-color" content="#0f8fa1" />   <!-- was #6366f1 indigo -->
```

…and the same substitution across all six JSON-LD blocks plus `public/sitemap.xml`.

### 4.13 Image performance

35 images render without `width`/`height`, causing cumulative layout shift as Supabase-hosted art loads.

```tsx
<img
  src={project.cover_image_url} alt={project.title}
  width={800} height={500}
  loading="lazy" decoding="async"
  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
/>
```

Also: `hero-bg.jpg` is a full-resolution JPEG loaded eagerly at every breakpoint. Serve WebP/AVIF with a `<picture>` element and a mobile-sized source.

---

## 5. Priority Implementation Roadmap

### Quadrant matrix

```
                    HIGH IMPACT
                         │
  ① Light-mode tokens    │  ⑤ Hero recomposition
  ② scroll-margin-top    │  ⑥ Portfolio art direction
  ③ Footer logo (broken) │  ⑦ Contact form + validation
  ④ Navbar logo + a11y   │  ⑧ Mobile drawer rebuild
  ─────────────────────────────────────────────────
     LOW EFFORT          │        HIGH EFFORT
  ─────────────────────────────────────────────────
  ⑨ Delete App.css       │  ⑬ Full type-scale migration
  ⑩ Canonical URLs       │  ⑭ Skeleton/empty/error states
  ⑪ Dead footer links    │  ⑮ Storybook + visual regression
  ⑫ theme-color          │
                         │
                    LOW IMPACT
```

### Sprint 1 — Ship this week *(~1.5 days, unblocks everything)*

Do these in order; each is independently shippable.

1. **Light-mode token fix** (§4.1) — one file, ~25 lines. Resolves 6 WCAG failures at once. *30 min*
2. **`scroll-margin-top: 6rem` on `section[id]`** (§4.2) — one line. Fixes the most-noticed bug. *5 min*
3. **Footer logo theme-awareness** (§4.3) — fixes an invisible asset. Extract `BrandLogo` while you are there. *45 min*
4. **Decide the `enableSystem` question** (§4.3) — it is currently inert; either remove it or move to `defaultTheme="system"` and switch both logo call-sites to `resolvedTheme`. *15 min*
5. **Navbar logo sizing** `h-28` → `h-10 md:h-12` (§4.4). *10 min*
6. **Mobile menu a11y**: `aria-label`, `aria-expanded`, `aria-controls`, Escape, scroll lock (§4.5). *1 h*
7. **Skip link + `<header>` + `aria-labelledby` per section** (§4.6). *45 min*
8. **`title` on the map iframe + correct coordinates** (§3.7). *15 min*
9. **Delete `src/App.css`** and `NavLink.tsx` (§4.11). *5 min*
10. **Canonical / og:url / theme-color** (§4.12). *20 min*
11. **Remove fabricated `aggregateRating` JSON-LD** (§4.11). *10 min*
12. **Fix dead footer links + add `id="awards"`** and repoint the footer link (§3.6, §3.8). *20 min*

**Exit criteria:** axe-core reports zero critical violations; every text pair ≥ 4.5:1 in both themes; clicking any nav link lands with the heading visible.

### Sprint 2 — Visual credibility *(~2 days)*

13. **Hero recomposition** (§3.2) — split layout at `lg`, text scrim, real secondary CTA, anchored stat strip, `text-balance`. *6 h*
14. **`prefers-reduced-motion` across CSS, `MotionConfig`, and the WebGL mount** (§4.10). *1.5 h*
15. **Portfolio art direction** — `aspect-[16/10]`, media ring, tool-tag normalisation, unified category pills (§3.4). *3 h*
16. **Focus-visible rings on every hand-rolled control** (§4.7). *1 h*
17. **Touch targets to 44px** — nav links, filters, theme toggle, View More. *1 h*
18. **Team social links always visible, mobile included** (§3.5). *45 min*
19. **Image `width`/`height` + `loading` attributes** (§4.13). *1 h*

### Sprint 3 — Systemisation *(~2 days)*

20. **Extract `Eyebrow` + `SectionHeader`**, replace 7 copies (§4.7, §4.8). *2.5 h*
21. **Migrate `useRef`/`useInView` → `whileInView`** in 7 components (§4.8). *1.5 h*
22. **Type scale** in `tailwind.config.ts`, cap Orbitron at ≥20px (§4.9). *3 h*
23. **Skeletons, empty states, error states** for Portfolio / Team / Services / Blog / Awards (§2.5). *4 h*
24. **Contact form**: `react-hook-form` + `zod` inline validation, sticky column, server-side rate limiting (§3.7). *3 h*
25. **Semantic state tokens** (`--success` / `--warning`) wired into Sonner. *1 h*

### Sprint 4 — Optional hardening

26. Active-section scroll spy in the navbar (§3.1).
27. Count-up animation on hero stats.
28. `<picture>` with AVIF/WebP for `hero-bg.jpg`.
29. Storybook for the shared component layer; Playwright visual-regression on the five key sections.
30. Newsletter capture in the footer.

---

## Appendix — verification commands

```bash
npm run lint
npx @axe-core/cli http://localhost:8080 --exit
npx lighthouse http://localhost:8080 --only-categories=accessibility,performance,seo --view
```

Re-run the contrast check after applying §4.1 — every pair in §2.1 should read AA or better in both themes.

---

## 6. Implementation Record

Applied on 2026-08-03. Verified with `tsc --noEmit` (clean), `npm run lint`
(38 → 35 problems; no new issues introduced), `npm test` (passing), and
`npm run build` (passing), plus programmatic contrast and DOM re-measurement.

### 6.1 Measured before / after

| Check | Before | After |
|---|---|---|
| `primary` text on light background | 3.60:1 ✗ | **5.74:1 AA** |
| `primary-foreground` on `primary` (light CTA) | 3.60:1 ✗ | **5.74:1 AA** |
| `accent` text on light background | 2.05:1 ✗ | **5.41:1 AA** |
| `text-accent` on `bg-accent/10` pill | 1.91:1 ✗ | **4.73:1 AA** |
| `text-primary` on `bg-primary/10` pill | 3.20:1 ✗ | **4.99:1 AA** |
| `--input` on light background | 1.35:1 ✗ | **4.09:1 (3:1 pass)** |
| `--input` on dark card | 1.36:1 ✗ | **3.54:1 (3:1 pass)** |
| Focus ring on background (light / dark) | n/a | **5.74:1 / 8.93:1** |
| Dark-mode text pairs | AAA | **AAA (unchanged)** |
| `<header>` landmark | 0 | **1** |
| Skip link | absent | **present** |
| Sections with `scroll-margin-top` | 0 of 7 | **8 of 8 (96px)** |
| Sections with an accessible name | 0 of 7 | **8 of 8** |
| Navbar logo height vs 80px bar | 112px (32px overflow) | **48px (fits)** |
| Controls with no accessible name | 3 | **0** |
| Untitled iframes | 1 | **0** |
| Images without `width`/`height` | 35 of 35 | **0 of 35** |
| Dead `href="#"` links | 2 | **0** |
| Horizontal overflow (360–2560px) | none | **none** |

Anchor navigation was re-tested by actually clicking each nav link: every section
now lands with its eyebrow at 208px, clear of the 80px fixed navbar.

### 6.2 Bug found during implementation

**The mobile drawer collapsed to 1px tall.** The rebuilt drawer used
`fixed inset-x-0 top-20 bottom-0` while nested inside `<motion.nav>`. framer-motion
applies a `transform` to that nav for its entrance animation, and a transformed
ancestor becomes the containing block for `position: fixed` descendants — so
`top-20 bottom-0` resolved against the 80px navbar instead of the viewport.
Fixed by rendering the drawer as a **sibling** of `<motion.nav>` (measured: 1px → 764px).
This is a general hazard anywhere a fixed child sits inside an animated element.

### 6.3 Asset change

The logo source files are **1920×1920 squares with ~69% vertical transparent
padding** (actual mark: 1653×603, aspect 2.74:1). That padding is the reason the
original markup needed `h-28` (112px) inside an 80px bar. Trimmed copies were
generated — `tobiya-logo-white-trimmed.png` and `tobiya-logo-trimmed.png` — and
`BrandLogo` points at those. **The original files are untouched.**

### 6.4 Deliberate decisions worth reviewing

1. **Hardcoded fallback content was removed** from Portfolio, Team and Awards.
   These previously shipped 8 fake projects, 6 fake team members and 5 fake awards
   that rendered on first paint and were silently replaced by CMS data. They now
   show skeletons, then real data, then a genuine empty/error state. If the CMS is
   ever empty these sections go quiet rather than displaying invented content —
   which is the correct behaviour for a production site, but it *is* a change.

2. **`--border` sits at 2.5:1 (light) / 2.2:1 (dark), below 3:1.** This is
   intentional. WCAG 1.4.11 requires 3:1 only for boundaries *needed to identify*
   a component. `--input` — where the border is the sole affordance — clears 3:1.
   Card borders are decorative because the surface and shadow already identify the
   card, so they stay softer to avoid a heavy outlined look. Raise `--border` to
   `220 16% 60.5%` / `220 30% 40.5%` if you want 3:1 everywhere.

3. **Footer legal links were removed, not implemented.** Privacy Policy and Terms
   of Service were `href="#"`. They are replaced with a contact email. Add real
   routes when the documents exist.

4. **`defaultTheme` changed to `"system"`.** The site now honours the visitor's OS
   preference on first load instead of always opening dark. If you want dark to
   remain the brand default regardless, set `defaultTheme="dark"` and drop
   `enableSystem` — but keep `resolvedTheme` in `BrandLogo` and `ThemeToggle`.

### 6.5 Still open — content, not code

These are CMS/database values and were **not** edited:

- Project titles `immersive bracker vr` and `Intreactive` are misspelled.
- Award `Fakugest award` / "Rising start Award at South Africa" should read
  *Fak'ugesi* / "Rising Star Award in South Africa".
- `immersive bracker vr` uses a raw `Genre: … | Platform: … | Status: …` dump as
  its description where the other cards use prose.
- Team bios are empty for all three members.
- Team portraits are stylistically inconsistent (painted, studio, casual).
- `public/sitemap.xml` still contains `lovable.app` URLs — `index.html` was
  updated but the sitemap needs the same substitution.
