import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, SlidersHorizontal } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { type Listing, ListingStatus } from "../backend";
import Footer from "../components/Footer";
import ListingCard from "../components/ListingCard";
import Navbar from "../components/Navbar";
import { SAMPLE_LISTINGS } from "../data/sampleListings";
import { useGetListings } from "../hooks/useQueries";

const CATEGORIES = [
  "All",
  "Design Resources",
  "Typography",
  "Motion Graphics",
  "Code",
  "Icons",
  "Business",
  "Developer Tools",
];

export default function ListingsPage() {
  const { data: backendListings, isLoading } = useGetListings();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  // Merge backend + sample data (backend takes priority)
  const allListings = useMemo(() => {
    if (backendListings && backendListings.length > 0) {
      return backendListings;
    }
    return SAMPLE_LISTINGS as unknown as Listing[];
  }, [backendListings]);

  const visibleListings = useMemo(() => {
    return allListings.filter((l) => {
      if (l.status === ListingStatus.draft) return false;
      if (
        search &&
        !l.title.toLowerCase().includes(search.toLowerCase()) &&
        !l.description.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (category !== "All") {
        const listingCategory = "category" in l ? (l.category as string) : null;
        if (listingCategory !== category) return false;
      }
      return true;
    });
  }, [allListings, search, category]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-28 pb-10 border-b border-border/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-xs font-body uppercase tracking-widest text-primary mb-2">
              All Products
            </p>
            <h1 className="text-4xl font-display font-black text-foreground">
              Browse the Vault
            </h1>
            <p className="mt-2 text-muted-foreground font-body max-w-lg">
              Premium digital downloads — UI kits, typefaces, templates, code,
              and more.
            </p>
          </motion.div>

          {/* Search */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search listings…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted/50 border-border/60 font-body"
              />
            </div>
          </div>

          {/* Category filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat}
                data-ocid="listings.category.tab"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-display font-semibold transition-all ${
                  category === cat
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Listings grid */}
      <main className="flex-1 py-10">
        <div className="container">
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }, (_, i) => `skel-${i}`).map((key) => (
                <div
                  key={key}
                  className="rounded-xl border border-border/40 overflow-hidden"
                >
                  <Skeleton className="aspect-[3/2] w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="p-4 rounded-full bg-muted/40 border border-border/40">
                <SlidersHorizontal className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-display font-semibold text-lg text-foreground">
                No listings found
              </p>
              <p className="text-sm text-muted-foreground font-body">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground font-body">
                  <span className="text-foreground font-semibold">
                    {visibleListings.length}
                  </span>{" "}
                  products
                </p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {visibleListings.map((listing, i) => (
                  <ListingCard key={listing.id} listing={listing} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
