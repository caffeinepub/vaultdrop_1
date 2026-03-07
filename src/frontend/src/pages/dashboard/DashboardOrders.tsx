import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileText, Package, ShoppingBag } from "lucide-react";
import { motion } from "motion/react";
import { type Listing, type Order, OrderStatus } from "../../backend";
import { SAMPLE_LISTINGS } from "../../data/sampleListings";
import {
  useGetCallerUserProfile,
  useGetListings,
  useGetUserOrders,
} from "../../hooks/useQueries";
import { downloadReceipt } from "../../utils/generateReceipt";

function formatPrice(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case OrderStatus.completed:
      return (
        <Badge className="bg-primary/15 text-primary border-primary/25 font-display font-semibold text-xs">
          Completed
        </Badge>
      );
    case OrderStatus.pending:
      return (
        <Badge className="bg-warning/15 text-warning border-warning/25 font-display font-semibold text-xs">
          Pending
        </Badge>
      );
    case OrderStatus.refunded:
      return (
        <Badge className="bg-destructive/15 text-destructive border-destructive/25 font-display font-semibold text-xs">
          Refunded
        </Badge>
      );
  }
}

export default function DashboardOrders() {
  const { data: orders, isLoading: ordersLoading } = useGetUserOrders();
  const { data: backendListings } = useGetListings();
  const { data: userProfile } = useGetCallerUserProfile();

  const listings =
    backendListings && backendListings.length > 0
      ? backendListings
      : (SAMPLE_LISTINGS as unknown as Listing[]);

  const getListingTitle = (listingId: string) => {
    return listings.find((l) => l.id === listingId)?.title ?? listingId;
  };

  const handleDownloadReceipt = (order: Order) => {
    if (!userProfile) return;
    downloadReceipt({
      order,
      listingTitle: getListingTitle(order.listingId),
      userProfile,
    });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-display font-black text-foreground">
            Orders
          </h1>
        </div>
        <p className="text-sm text-muted-foreground font-body">
          All your purchases in one place
        </p>
      </motion.div>

      {/* Table */}
      {ordersLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => `skel-${i}`).map((key) => (
            <Skeleton key={key} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          data-ocid="orders.empty_state"
          className="flex flex-col items-center justify-center py-24 gap-4"
        >
          <div className="p-4 rounded-full bg-muted/40 border border-border/40">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-display font-semibold text-foreground">
            No orders yet
          </p>
          <p className="text-sm text-muted-foreground font-body">
            Browse the store to find your first product
          </p>
        </motion.div>
      ) : (
        <TooltipProvider>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border border-border/60 overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Product
                  </TableHead>
                  <TableHead className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Date
                  </TableHead>
                  <TableHead className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Amount
                  </TableHead>
                  <TableHead className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground w-[80px]">
                    Receipt
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: Order, index: number) => (
                  <TableRow
                    key={order.id}
                    className="border-border/40 hover:bg-muted/30"
                  >
                    <TableCell className="font-body font-medium text-foreground">
                      {getListingTitle(order.listingId)}
                    </TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="font-display font-bold text-primary text-sm">
                      {formatPrice(order.amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      {order.status === OrderStatus.completed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => handleDownloadReceipt(order)}
                              data-ocid={`orders.receipt.button.${index + 1}`}
                            >
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">Download Receipt</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p>Download Receipt</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        </TooltipProvider>
      )}
    </div>
  );
}
