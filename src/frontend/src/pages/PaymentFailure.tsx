import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, XCircle } from "lucide-react";
import { motion } from "motion/react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

export default function PaymentFailure() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center pt-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-sm mx-auto px-4"
        >
          <div className="mb-6 flex justify-center">
            <div className="p-5 rounded-full bg-destructive/10 border border-destructive/25">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <h1 className="text-3xl font-display font-black text-foreground">
            Payment Failed
          </h1>
          <p className="mt-3 text-muted-foreground font-body">
            Something went wrong with your payment. No charge has been made.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              variant="outline"
              className="font-display font-bold border-border/60 hover:border-primary/40"
              data-ocid="payment.back.button"
            >
              <Link to="/listings">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Listings
              </Link>
            </Button>
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-display font-bold"
              data-ocid="payment.retry.button"
            >
              <Link to="/listings">Try Again</Link>
            </Button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
