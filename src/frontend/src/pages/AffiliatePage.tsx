import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  DollarSign,
  Link2,
  Share2,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const steps = [
  {
    icon: Link2,
    step: "01",
    title: "Get Your Link",
    desc: "Sign in and generate your unique referral link from your dashboard in seconds. No approval process required.",
    color: "oklch(0.72 0.17 160)",
    bg: "oklch(0.72 0.17 160 / 0.1)",
    border: "oklch(0.72 0.17 160 / 0.2)",
  },
  {
    icon: Share2,
    step: "02",
    title: "Share It",
    desc: "Post your link in your newsletter, social media, YouTube description, or anywhere your audience hangs out.",
    color: "oklch(0.65 0.15 200)",
    bg: "oklch(0.65 0.15 200 / 0.1)",
    border: "oklch(0.65 0.15 200 / 0.2)",
  },
  {
    icon: DollarSign,
    step: "03",
    title: "Earn Commission",
    desc: "Earn 10% on every completed purchase made by someone who clicked your link. Tracked automatically.",
    color: "oklch(0.82 0.18 75)",
    bg: "oklch(0.82 0.18 75 / 0.1)",
    border: "oklch(0.82 0.18 75 / 0.2)",
  },
];

const perks = [
  {
    icon: TrendingUp,
    title: "10% Commission Rate",
    desc: "On every single sale you drive",
  },
  {
    icon: Zap,
    title: "Instant Tracking",
    desc: "Real-time clicks and conversion data",
  },
  { icon: Users, title: "No Limits", desc: "Refer as many people as you want" },
  {
    icon: DollarSign,
    title: "Transparent Earnings",
    desc: "See exactly what you've earned",
  },
];

export default function AffiliatePage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const navigate = useNavigate();

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard/affiliate" });
    } else {
      navigate({ to: "/sign-in" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* ─── Hero ──────────────────────────────────────────────────── */}
      <section className="relative min-h-[72vh] flex items-center overflow-hidden pt-16">
        {/* Background gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.65 0.15 200 / 0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 60%, oklch(0.72 0.17 160 / 0.08) 0%, transparent 60%), oklch(0.1 0.005 160)",
          }}
        />
        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid opacity-40" />
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />

        <div className="container relative z-10 py-24">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-display font-bold uppercase tracking-widest"
                style={{
                  background: "oklch(0.65 0.15 200 / 0.1)",
                  border: "1px solid oklch(0.65 0.15 200 / 0.25)",
                  color: "oklch(0.65 0.15 200)",
                }}
              >
                <Link2 className="h-3.5 w-3.5" />
                Affiliate Program
              </div>

              <h1 className="text-5xl md:text-6xl xl:text-7xl font-display font-black text-foreground leading-[0.92] tracking-tight">
                Earn{" "}
                <span
                  className="relative"
                  style={{ color: "oklch(0.82 0.18 75)" }}
                >
                  10%
                </span>{" "}
                on every
                <br />
                <span className="text-primary glow-text">sale you drive</span>
              </h1>

              <p className="mt-6 text-lg text-muted-foreground font-body leading-relaxed max-w-xl mx-auto">
                Share VaultDrop with your audience. Get your unique referral
                link, share it anywhere, and earn a commission on every purchase
                made through it.
              </p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-8 flex flex-wrap justify-center gap-3"
              >
                <Button
                  size="lg"
                  onClick={handleCTA}
                  data-ocid="affiliate.join.primary_button"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-lg font-display font-bold text-base px-8 h-12"
                >
                  {isAuthenticated
                    ? "Go to My Affiliate Dashboard"
                    : "Join the Affiliate Program"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-border/60 hover:border-primary/40 font-display font-semibold text-base h-12"
                >
                  <Link to="/listings">Browse Marketplace</Link>
                </Button>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-14 flex flex-wrap justify-center gap-10 pt-8 border-t border-border/25"
              >
                {[
                  { value: "10%", label: "Commission Rate" },
                  { value: "$0", label: "Cost to Join" },
                  { value: "∞", label: "Referral Limit" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center gap-0.5"
                  >
                    <span className="text-3xl font-display font-black text-primary">
                      {stat.value}
                    </span>
                    <span className="text-xs text-muted-foreground font-body uppercase tracking-widest">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ──────────────────────────────────────────── */}
      <section className="py-24 border-t border-border/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center mb-14"
          >
            <p className="text-xs font-body uppercase tracking-widest text-primary mb-2">
              Simple Process
            </p>
            <h2 className="text-3xl font-display font-black text-foreground">
              How It Works
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: i * 0.12,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative p-6 rounded-2xl border bg-card/50 transition-all duration-300 hover:-translate-y-1 card-shimmer overflow-hidden"
                style={{ borderColor: step.border, background: step.bg }}
              >
                {/* Large step number in background */}
                <div
                  className="absolute -top-4 -right-2 font-display font-black text-8xl select-none pointer-events-none"
                  style={{ color: step.color, opacity: 0.06 }}
                >
                  {step.step}
                </div>

                <div
                  className="relative inline-flex p-3 rounded-xl mb-4"
                  style={{
                    background: step.bg,
                    border: `1px solid ${step.border}`,
                  }}
                >
                  <step.icon
                    className="h-6 w-6"
                    style={{ color: step.color }}
                  />
                </div>

                <div
                  className="text-xs font-display font-bold uppercase tracking-widest mb-2"
                  style={{ color: step.color }}
                >
                  Step {step.step}
                </div>
                <h3 className="font-display font-bold text-base text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Perks Grid ────────────────────────────────────────────── */}
      <section className="py-24 border-t border-border/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center mb-14"
          >
            <p className="text-xs font-body uppercase tracking-widest text-primary mb-2">
              Why Join
            </p>
            <h2 className="text-3xl font-display font-black text-foreground">
              Built for creators & developers
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {perks.map((perk, i) => (
              <motion.div
                key={perk.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="p-5 rounded-xl border border-border/40 bg-card/50 hover:border-primary/25 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 w-fit mb-3 group-hover:bg-primary/15 transition-colors">
                  <perk.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-display font-bold text-sm text-foreground mb-1">
                  {perk.title}
                </h3>
                <p className="text-xs text-muted-foreground font-body leading-relaxed">
                  {perk.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card/80 p-10 md:p-14 text-center"
          >
            {/* Glow blobs */}
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/8 blur-3xl" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
            <div className="absolute inset-0 dot-grid opacity-20" />

            <div className="relative z-10">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-5 text-xs font-display font-bold uppercase tracking-widest"
                style={{
                  background: "oklch(0.72 0.17 160 / 0.1)",
                  border: "1px solid oklch(0.72 0.17 160 / 0.2)",
                  color: "oklch(0.72 0.17 160)",
                }}
              >
                <Zap className="h-3 w-3" />
                Free to Join
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-black text-foreground mb-3">
                Ready to start earning?
              </h2>
              <p className="text-muted-foreground font-body max-w-md mx-auto mb-8">
                Generate your affiliate link in under 30 seconds. No
                application, no approval, no fees.
              </p>
              <Button
                size="lg"
                onClick={handleCTA}
                data-ocid="affiliate.cta.primary_button"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow font-display font-bold h-12 px-8"
              >
                {isAuthenticated
                  ? "View My Affiliate Dashboard"
                  : "Get Started — It's Free"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
