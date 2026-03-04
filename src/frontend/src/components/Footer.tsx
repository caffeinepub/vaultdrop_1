import { Link } from "@tanstack/react-router";
import { Heart, Vault } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`;

  return (
    <footer className="border-t border-border/40 bg-background/60 backdrop-blur-sm">
      <div className="container py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-1 rounded-md bg-primary/10 border border-primary/20">
              <Vault className="h-4 w-4 text-primary" />
            </div>
            <span className="font-display font-black text-sm text-foreground">
              Vault<span className="text-primary">Drop</span>
            </span>
          </Link>

          {/* Attribution */}
          <p className="text-xs text-muted-foreground font-body flex items-center gap-1">
            © {year}. Built with{" "}
            <Heart className="h-3 w-3 text-destructive fill-destructive inline" />{" "}
            using{" "}
            <a
              href={caffeineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
