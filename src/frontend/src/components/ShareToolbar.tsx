import { Button } from "@/components/ui/button";
import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { SiLinkedin, SiX } from "react-icons/si";
import { toast } from "sonner";
import { cn } from "../lib/utils";

interface ShareToolbarProps {
  title: string;
  url?: string;
  className?: string;
}

export default function ShareToolbar({
  title,
  url,
  className,
}: ShareToolbarProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url ?? window.location.href;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(`Check out ${title}`);

  const handleTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1 text-xs font-display font-semibold text-muted-foreground">
        <Share2 className="h-3 w-3" />
        <span>Share</span>
      </div>

      <div className="flex items-center gap-1">
        {/* Twitter/X */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Share on X (Twitter)"
          data-ocid="listing.share_twitter_button"
          onClick={handleTwitter}
          className="h-7 w-7 border-border/50 bg-background/50 hover:bg-foreground/5 hover:border-foreground/30 text-muted-foreground hover:text-foreground transition-all duration-150"
        >
          <SiX className="h-3 w-3" />
        </Button>

        {/* LinkedIn */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Share on LinkedIn"
          data-ocid="listing.share_linkedin_button"
          onClick={handleLinkedIn}
          className="h-7 w-7 border-border/50 bg-background/50 hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/40 text-muted-foreground hover:text-[#0A66C2] transition-all duration-150"
        >
          <SiLinkedin className="h-3 w-3" />
        </Button>

        {/* Copy Link */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Copy link"
          data-ocid="listing.share_copy_button"
          onClick={() => void handleCopy()}
          className="h-7 w-7 border-border/50 bg-background/50 hover:bg-primary/10 hover:border-primary/35 text-muted-foreground hover:text-primary transition-all duration-150"
        >
          {copied ? (
            <Check className="h-3 w-3 text-primary" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  );
}
