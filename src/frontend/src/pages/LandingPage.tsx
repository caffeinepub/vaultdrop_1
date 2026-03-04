import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Lock,
  Shield,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { ListingStatus } from "../backend";
import Footer from "../components/Footer";
import ListingCard from "../components/ListingCard";
import Navbar from "../components/Navbar";
import {
  SAMPLE_LISTINGS,
  SUBSCRIPTION_PRICE_CENTS,
} from "../data/sampleListings";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const publishedListings = SAMPLE_LISTINGS.filter(
  (l) => l.status === ListingStatus.published,
).slice(0, 6);

const features = [
  {
    icon: Download,
    title: "Instant Downloads",
    desc: "Get your files immediately after purchase. No waiting, no delays.",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    desc: "Powered by Stripe. Your payment info is never stored on our servers.",
  },
  {
    icon: Zap,
    title: "Early Access",
    desc: "Subscribe to unlock upcoming releases before they go public.",
  },
];

const subscriptionPerks = [
  "Early access to all upcoming listings",
  "New products before public launch",
  "Subscriber-only deals and bundles",
  "Priority support",
];

// Decorative floating product cards for hero right side
const heroProducts = [
  {
    img: "/assets/generated/listing-ui-kit.dim_600x400.jpg",
    title: "Midnight UI Kit",
    price: "$49",
    delay: 0,
    offsetY: 0,
  },
  {
    img: "/assets/generated/listing-saas.dim_600x400.jpg",
    title: "SaaS Boilerplate",
    price: "$149",
    delay: 0.12,
    offsetY: 40,
  },
  {
    img: "/assets/generated/listing-motion.dim_600x400.jpg",
    title: "Quantum Motion Pack",
    price: "$39",
    delay: 0.24,
    offsetY: 80,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { identity, login, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const handleCTA = async () => {
    if (isAuthenticated) {
      navigate({ to: "/listings" });
    } else {
      await login();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden gradient-hero">
        {/* Background image — increased opacity for real depth */}
        <div
          className="absolute inset-0 opacity-35 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url(/assets/generated/hero-bg.dim_1600x900.jpg)",
          }}
        />
        {/* Dot grid overlay */}
        <div className="absolute inset-0 dot-grid opacity-60" />
        {/* Gradient fade to background at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
        {/* Left vignette */}
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-background/60 to-transparent pointer-events-none hidden lg:block" />

        <div className="container relative z-10 py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — copy */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <Badge className="mb-7 bg-primary/10 text-primary border-primary/25 font-display font-semibold text-xs px-3 py-1.5 tracking-wide">
                <Sparkles className="h-3 w-3 mr-1.5" />
                Premium Digital Marketplace
              </Badge>

              <h1 className="text-5xl md:text-6xl xl:text-7xl font-display font-black text-foreground leading-[0.92] tracking-tight">
                The vault for
                <br />
                <span className="text-primary glow-text">premium</span>
                <br />
                digital goods
              </h1>

              <p className="mt-6 text-lg text-muted-foreground font-body leading-relaxed max-w-md">
                Exclusive UI kits, typefaces, code, motion packs, and templates.
                Subscribe for early access to drops before they go public.
              </p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-9 flex flex-wrap gap-3"
              >
                <Button
                  size="lg"
                  onClick={handleCTA}
                  disabled={isLoggingIn}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-lg font-display font-bold text-base px-7 h-12"
                >
                  {isLoggingIn
                    ? "Connecting…"
                    : isAuthenticated
                      ? "Browse Now"
                      : "Get Started"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-border/60 hover:border-primary/40 font-display font-semibold text-base h-12"
                >
                  <Link to="/listings">Browse Listings</Link>
                </Button>
              </motion.div>

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-14 flex flex-wrap gap-8 pt-8 border-t border-border/25"
              >
                {[
                  { value: "200+", label: "Digital Products" },
                  { value: "4.9★", label: "Average Rating" },
                  { value: "5k+", label: "Happy Customers" },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col gap-0.5">
                    <span className="text-2xl font-display font-black text-primary">
                      {stat.value}
                    </span>
                    <span className="text-xs text-muted-foreground font-body uppercase tracking-widest">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — floating product cards */}
            <div className="relative hidden lg:flex justify-end items-center h-[480px]">
              {/* Background glow blob */}
              <div className="absolute right-8 top-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-primary/8 blur-3xl" />

              <div className="relative w-[300px]">
                {heroProducts.map((product, i) => (
                  <motion.div
                    key={product.title}
                    initial={{ opacity: 0, x: 40, y: product.offsetY }}
                    animate={{ opacity: 1, x: 0, y: product.offsetY }}
                    transition={{
                      delay: 0.4 + product.delay,
                      duration: 0.6,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="absolute w-[260px] rounded-xl overflow-hidden border border-border/60 bg-card shadow-card-glow"
                    style={{
                      top: `${i * 120}px`,
                      right: i % 2 === 0 ? "0px" : "24px",
                      zIndex: heroProducts.length - i,
                    }}
                  >
                    <div className="aspect-[16/7] overflow-hidden">
                      <img
                        src={product.img}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="px-3 py-2.5 flex items-center justify-between">
                      <p className="font-display font-bold text-xs text-foreground truncate">
                        {product.title}
                      </p>
                      <span className="font-display font-black text-sm text-primary ml-3 shrink-0">
                        {product.price}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ──────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border/30">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex gap-4 p-6 rounded-xl border border-border/40 bg-card/50 hover:border-primary/25 transition-colors group"
              >
                <div className="shrink-0 p-2.5 rounded-lg bg-primary/10 border border-primary/20 h-fit group-hover:bg-primary/15 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-foreground">
                    {f.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground font-body leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured listings ─────────────────────────────────────── */}
      <section className="py-20 border-t border-border/30">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-body uppercase tracking-widest text-primary mb-2">
                Latest Drops
              </p>
              <h2 className="text-3xl font-display font-black text-foreground">
                Featured Listings
              </h2>
            </div>
            <Button
              variant="ghost"
              asChild
              className="font-display font-semibold text-sm hidden sm:flex text-muted-foreground hover:text-primary"
            >
              <Link to="/listings">
                View all <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {publishedListings.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Subscription CTA ──────────────────────────────────────── */}
      <section className="py-20 border-t border-border/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card/80 p-8 md:p-12"
          >
            {/* Glow blobs */}
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-primary/5 blur-2xl" />
            {/* Dot grid inside CTA */}
            <div className="absolute inset-0 dot-grid opacity-30" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="h-4 w-4 text-primary" />
                  <Badge className="bg-primary/10 text-primary border-primary/25 font-display font-semibold text-xs">
                    Subscriber Early Access
                  </Badge>
                </div>
                <h2 className="text-3xl font-display font-black text-foreground">
                  Get in before everyone else
                </h2>
                <p className="mt-2 text-muted-foreground font-body max-w-md">
                  Subscribe for{" "}
                  <span className="text-primary font-display font-bold">
                    ${(Number(SUBSCRIPTION_PRICE_CENTS) / 100).toFixed(2)}/mo
                  </span>{" "}
                  and unlock upcoming drops weeks before they go public.
                </p>

                <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {subscriptionPerks.map((perk) => (
                    <li
                      key={perk}
                      className="flex items-center gap-2 text-sm font-body text-muted-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="shrink-0">
                <Button
                  size="lg"
                  onClick={handleCTA}
                  disabled={isLoggingIn}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow font-display font-bold h-12 px-7"
                >
                  <Star className="mr-2 h-4 w-4" />
                  {isAuthenticated ? "Subscribe Now" : "Sign In to Subscribe"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
