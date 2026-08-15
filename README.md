# Food Share Connect

Prompt:

Build a complete, responsive web application called "Food Rescue: Don't Waste, Donate Food" using React, Next.js (App Router, "use client"), Tailwind CSS, and Lucide React icons.

Design System

Typography: A modern, playful hierarchy — bold, rounded display type (e.g. Baloo 2, Fredoka, or Poppins ExtraBold) for major headings and section titles, paired with a clean, neutral sans-serif (e.g. Inter or Manrope) for navigation, body copy, labels, and supporting text. Push strong contrast between the two: large/heavy display weights for headlines, smaller/lighter body weights for detail — so the page is easy to scan at a glance.

Visual Language: Soft and organic — generously rounded corners (cards, buttons, inputs, images), curved section dividers/blobs instead of hard straight breaks, subtle layered shadows for depth, generous whitespace, and occasional oversized decorative elements (blobs, food illustrations, soft gradient shapes) placed around — never inside — the main content.

Color Palette: Warm, high-contrast, editorial-friendly — a light neutral background (warm off-white/cream), emerald-green as the primary action color, orange as a vibrant secondary accent, plus supporting warm tones (yellow, coral) for badges, highlights, and illustrations. Colors should be used deliberately to separate sections and establish hierarchy, not just decorate.

Layout: Centered grid system with balanced margins, responsive multi-column layouts on desktop collapsing cleanly to single-column on mobile. Content grouped into consistent card-based sections with uniform padding, spacing, and alignment throughout.

Buttons & Interactive Elements: Fully rounded (pill or large-radius) shapes, high-contrast solid fills for primary actions, clear outline/ghost style for secondary actions, and visibly distinct hover/focus states so interactive elements are always recognizable.

UX Principles: Prioritize visual scanning and clear grouping — strong section hierarchy (eyebrow labels, bold headings, supporting subtext), comfortable whitespace between groups, and consistent, predictable patterns for cards, badges, and CTAs across every page.

Pages to Build

1. Landing Page (/)

Header: "Food Rescue" text logo, "Log In" text link, solid green "Sign Up" button

Hero: Headline "Rescue Food, Feed Hope.", sub-headline about connecting donors to NGOs/shelters in real-time, two CTAs ("I Want to Donate" solid, "I Need Food" outline)

"How Food Rescue Works" — 3 cards: List Surplus Food, Real-Time Alerts, Rescue & Deliver

Footer: project name, © 2026, placeholder links

2. Food Donation Form (/donate)

Header with logo + "Back to Home"

Title: "Donate Surplus Food" with explanatory subtext

Two-column layout: form card (Donor Name, Phone, Food Title, Category dropdown, Quantity/Serves, Expiration/Pickup Deadline, Pickup Address, Veg/Non-Veg + Allergen badges, Pickup Notes, Photo Upload, "Publish Food Donation" button) alongside a Safety & Trust sidebar ("Safety First Guidelines" checklist + "What Happens Next?" 3-step timeline)

3. Live Receiver Feed (/feed)

Top nav: logo, "Active Claims" counter, profile avatar

Header: "Live Food Feed" with dynamic donation counter, search bar, filter chips (All, Vegetarian, Cooked Meals, Raw Produce, Closing Soon)

Responsive grid of donation cards (Donor Name, Time Posted, Food Title, Quantity, Distance, Pickup Deadline, Veg/Refrigeration badges, "Claim Food" button)

Empty state fallback when no donations match

Apply the design system consistently across all three pages so they feel like one cohesive product.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/120d526c-78a7-4b17-88ec-a96dd164647e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
