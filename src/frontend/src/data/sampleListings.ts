import { ListingStatus } from "../backend";

export interface SampleListing {
  id: string;
  title: string;
  description: string;
  price: bigint; // cents
  status: ListingStatus;
  previewImageKey: string | null;
  fileKey: string | null;
  createdAt: bigint;
  updatedAt: bigint;
  category: string;
  tags: string[];
}

const now = BigInt(Date.now()) * 1_000_000n;

export const SAMPLE_LISTINGS: SampleListing[] = [
  {
    id: "listing-1",
    title: "Midnight UI Kit — 200+ Components",
    description:
      "A comprehensive dark-mode UI component library built with Figma and React. Includes 200+ production-ready components, design tokens, auto-layout frames, and a full documentation site. Perfect for SaaS products and dashboards.",
    price: 4900n,
    status: ListingStatus.published,
    previewImageKey: "/assets/generated/listing-ui-kit.dim_600x400.jpg",
    fileKey: null,
    createdAt: now,
    updatedAt: now,
    category: "Design Resources",
    tags: ["Figma", "React", "UI Kit", "Dark Mode"],
  },
  {
    id: "listing-2",
    title: "Neural Typeface Collection — 12 Fonts",
    description:
      "Twelve meticulously crafted variable fonts for the modern web. Each typeface ships with multiple weights, italics, and OpenType features. Includes a specimen guide and web-font usage documentation.",
    price: 7900n,
    status: ListingStatus.published,
    previewImageKey: "/assets/generated/listing-fonts.dim_600x400.jpg",
    fileKey: null,
    createdAt: now,
    updatedAt: now,
    category: "Typography",
    tags: ["Fonts", "Variable Fonts", "Typography"],
  },
  {
    id: "listing-3",
    title: "Quantum Motion Pack — 50 After Effects Templates",
    description:
      "Cinematic motion graphics and transitions for content creators. 50 professionally animated templates for After Effects, optimized for YouTube, Instagram Reels, and broadcast. Includes 4K resolution renders.",
    price: 3900n,
    status: ListingStatus.published,
    previewImageKey: "/assets/generated/listing-motion.dim_600x400.jpg",
    fileKey: null,
    createdAt: now,
    updatedAt: now,
    category: "Motion Graphics",
    tags: ["After Effects", "Motion", "Templates", "Video"],
  },
  {
    id: "listing-4",
    title: "SaaS Boilerplate — Next.js + Stripe",
    description:
      "A production-ready SaaS starter with authentication, billing, team management, and admin dashboard. Built with Next.js 14, Prisma, Stripe, and TypeScript. Save 200+ hours of setup time.",
    price: 14900n,
    status: ListingStatus.published,
    previewImageKey: "/assets/generated/listing-saas.dim_600x400.jpg",
    fileKey: null,
    createdAt: now,
    updatedAt: now,
    category: "Code",
    tags: ["Next.js", "Stripe", "TypeScript", "Boilerplate"],
  },
  {
    id: "listing-5",
    title: "Cosmic Icon Library — 500+ Icons",
    description:
      "A hand-crafted icon system with 500+ icons in 4 styles: Outline, Filled, Duotone, and Bulk. Available in SVG, PNG, and React components. Designed on a 24px grid for pixel-perfect rendering.",
    price: 2900n,
    status: ListingStatus.published,
    previewImageKey: "/assets/generated/listing-icons.dim_600x400.jpg",
    fileKey: null,
    createdAt: now,
    updatedAt: now,
    category: "Icons",
    tags: ["Icons", "SVG", "React", "Design"],
  },
  {
    id: "listing-6",
    title: "The Freelancer's Vault — Business Templates",
    description:
      "Every template a freelancer needs: contracts, invoices, proposals, SOW documents, NDA agreements, and client onboarding kits. Available in PDF and editable DOCX format. Legally reviewed.",
    price: 1900n,
    status: ListingStatus.published,
    previewImageKey: "/assets/generated/listing-templates.dim_600x400.jpg",
    fileKey: null,
    createdAt: now,
    updatedAt: now,
    category: "Business",
    tags: ["Templates", "Freelance", "Contracts", "Business"],
  },
  {
    id: "listing-7",
    title: "NeuroFlow Dashboard — Premium Analytics Template",
    description:
      "An upcoming premium analytics dashboard template built in Figma. Real-time data visualization components, dark and light variants, fully responsive. Early access available to subscribers only.",
    price: 5900n,
    status: ListingStatus.upcoming,
    previewImageKey: null,
    fileKey: null,
    createdAt: now,
    updatedAt: now,
    category: "Design Resources",
    tags: ["Figma", "Dashboard", "Analytics", "Premium"],
  },
  {
    id: "listing-8",
    title: "Architect CSS Framework 2.0",
    description:
      "The next evolution of the Architect CSS framework. Utility-first with semantic layer, zero-runtime CSS-in-JS, and Figma plugin integration. Subscriber early access before public launch.",
    price: 3400n,
    status: ListingStatus.upcoming,
    previewImageKey: null,
    fileKey: null,
    createdAt: now,
    updatedAt: now,
    category: "Code",
    tags: ["CSS", "Framework", "Web Dev"],
  },
];

export const SUBSCRIPTION_PRICE_CENTS = 999n; // $9.99/month
