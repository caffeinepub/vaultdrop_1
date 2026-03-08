import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearch } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Coffee,
  Github,
  Heart,
  Loader2,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { OpenSourceProject } from "../backend";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import {
  useCompleteTip,
  useCreateCheckoutSession,
  useGetOpenSourceProjects,
  useGetStripeSessionStatus,
  useRecordTip,
} from "../hooks/useQueries";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTip(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

// ─── Project Card ─────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: OpenSourceProject;
  index: number;
  onTip: (project: OpenSourceProject) => void;
  tipping: boolean;
}

function ProjectCard({ project, index, onTip, tipping }: ProjectCardProps) {
  const imgSrc = project.previewImageKey?.startsWith("/")
    ? project.previewImageKey
    : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      data-ocid={`opensource.item.${index + 1}`}
      className="group relative flex flex-col rounded-2xl border border-border/50 bg-card/60 hover:border-primary/30 hover:bg-card/80 transition-all duration-300 overflow-hidden"
    >
      {/* Image / placeholder header */}
      <div className="h-40 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 shrink-0 relative">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Github className="h-12 w-12 text-primary/20" />
          </div>
        )}
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-4">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-display font-bold text-foreground text-base leading-snug">
              {project.title}
            </h3>
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-ocid={`opensource.repo.link.${index + 1}`}
              className="shrink-0 p-1.5 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
              aria-label={`View ${project.title} repository`}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <p className="text-xs font-body text-muted-foreground mb-1">
            by{" "}
            <span className="text-foreground font-medium">
              {project.creatorName}
            </span>
          </p>
          <p className="text-sm font-body text-muted-foreground line-clamp-3 mt-2">
            {project.description}
          </p>
        </div>

        {/* Tip section */}
        <div className="flex items-center justify-between pt-4 border-t border-border/30 mt-auto">
          <div className="flex items-center gap-1.5">
            <Coffee className="h-4 w-4 text-primary/60" />
            <span className="text-sm font-display font-bold text-primary">
              {formatTip(project.suggestedTipCents)}
            </span>
            <span className="text-xs font-body text-muted-foreground">
              suggested
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => onTip(project)}
            disabled={tipping}
            data-ocid={`opensource.tip.button.${index + 1}`}
            className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/25 font-display font-semibold text-xs"
            variant="outline"
          >
            {tipping ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Heart className="h-3.5 w-3.5 mr-1.5 fill-current" />
                Sponsor
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OpenSourcePage() {
  const { data: projects, isLoading } = useGetOpenSourceProjects();
  const createCheckout = useCreateCheckoutSession();
  const getSessionStatus = useGetStripeSessionStatus();
  const recordTip = useRecordTip();
  const completeTip = useCompleteTip();

  const searchParams = useSearch({ strict: false }) as {
    session_id?: string;
    project_id?: string;
    amount?: string;
  };
  const sessionId = searchParams.session_id;
  const pendingProjectId = searchParams.project_id;
  const pendingAmount = searchParams.amount;
  const processedRef = useRef<string | null>(null);

  // Handle returning from Stripe checkout
  useEffect(() => {
    if (!sessionId || processedRef.current === sessionId) return;
    if (!pendingProjectId || !pendingAmount) return;
    processedRef.current = sessionId;

    void (async () => {
      try {
        const status = await getSessionStatus.mutateAsync(sessionId);
        if (status.__kind__ === "completed") {
          const response = JSON.parse(
            (
              status as {
                __kind__: "completed";
                completed: { response: string };
              }
            ).completed.response,
          );
          const paymentIntentId =
            (response as { payment_intent?: string })?.payment_intent ?? null;
          const tip = await recordTip.mutateAsync({
            projectId: pendingProjectId,
            amount: BigInt(pendingAmount),
            paymentIntentId,
          });
          await completeTip.mutateAsync(tip.id);
          toast.success(
            "Thank you for your support! 💚 Your tip was received.",
          );
          // Clean URL
          window.history.replaceState({}, "", "/open-source");
        } else {
          toast.error("Tip payment failed. No charge was made.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to process tip");
      }
    })();
  }, [
    sessionId,
    pendingProjectId,
    pendingAmount,
    getSessionStatus,
    recordTip,
    completeTip,
  ]);

  const handleTip = async (project: OpenSourceProject) => {
    try {
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/open-source?session_id={CHECKOUT_SESSION_ID}&project_id=${project.id}&amount=${project.suggestedTipCents.toString()}`;
      const cancelUrl = `${baseUrl}/open-source`;

      const session = await createCheckout.mutateAsync({
        items: [
          {
            productName: `Tip for ${project.title}`,
            productDescription: `Support ${project.creatorName}'s open-source work on ${project.title}`,
            priceInCents: project.suggestedTipCents,
            quantity: 1n,
            currency: "usd",
          },
        ],
        successUrl,
        cancelUrl,
      });

      if (!session?.url) throw new Error("Missing session URL");
      window.location.href = session.url;
    } catch {
      toast.error("Failed to start checkout. Is Stripe configured?");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/assets/generated/opensource-hero.dim_1200x400.jpg"
              alt=""
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
          </div>
          <div className="relative container py-20 md:py-28">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <Github className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-display font-bold text-primary uppercase tracking-widest">
                  Community Fund
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-black text-foreground leading-tight mb-4">
                Open Source <span className="text-primary">Tip Jar</span>
              </h1>
              <p className="text-base md:text-lg font-body text-muted-foreground max-w-xl">
                Developers share their open-source projects here. If something
                saved you hours of work, say thanks with a one-click tip. Every
                bit of support fuels more open-source software.
              </p>
              <div className="flex items-center gap-4 mt-6 text-sm font-body text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  One-click tipping
                </div>
                <div className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-primary" />
                  Direct to developers
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Project Grid ── */}
        <section className="container py-12 md:py-16">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }, (_, i) => `sk-${i}`).map((k) => (
                <div
                  key={k}
                  className="rounded-2xl border border-border/40 overflow-hidden"
                >
                  <Skeleton className="h-40 w-full rounded-none" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-9 w-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : !projects || projects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-28 gap-5"
              data-ocid="opensource.empty_state"
            >
              <div className="p-6 rounded-full bg-muted/30 border border-border/40">
                <Github className="h-12 w-12 text-muted-foreground/40" />
              </div>
              <div className="text-center">
                <p className="font-display font-bold text-lg text-foreground">
                  No open-source projects listed yet
                </p>
                <p className="text-sm font-body text-muted-foreground mt-2 max-w-sm">
                  Developers can submit their open-source projects to receive
                  community support. Check back soon!
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={i}
                  onTip={handleTip}
                  tipping={createCheckout.isPending}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
