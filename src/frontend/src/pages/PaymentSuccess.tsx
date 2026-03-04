import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Download } from "lucide-react";
import { motion } from "motion/react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

export default function PaymentSuccess() {
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
            <div className="p-5 rounded-full bg-primary/10 border border-primary/25 shadow-glow">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-display font-black text-foreground">
            Payment Successful!
          </h1>
          <p className="mt-3 text-muted-foreground font-body">
            Your purchase is confirmed. Head to your downloads to access your
            files.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Button
              asChild
              className="bg-primary text-primary-foreground shadow-glow font-display font-bold"
            >
              <Link to="/dashboard/downloads">
                <Download className="mr-2 h-4 w-4" />
                Go to Downloads
              </Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="font-display font-semibold"
            >
              <Link to="/listings">
                Continue Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
