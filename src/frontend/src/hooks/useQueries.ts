import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Analytics,
  DiscountCode,
  Listing,
  ListingId,
  ListingStatus,
  Notification,
  Order,
  OrderStatus,
  Review,
  ReviewId,
  ReviewStatus,
  ShoppingItem,
  StripeConfiguration,
  Subscription,
  SubscriptionStatus,
  UserProfile,
  WishlistSnapshot,
} from "../backend";
import { useActor } from "./useActor";

// ─── Auth / Profile ──────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      username,
      email,
    }: {
      username: string;
      email: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(username, email);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["currentUserProfile"], data);
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Listings ─────────────────────────────────────────────────────────────────

export function useGetListings() {
  const { actor, isFetching } = useActor();
  return useQuery<Listing[]>({
    queryKey: ["listings"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getListings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      title: string;
      description: string;
      price: bigint;
      status: ListingStatus;
      previewImageKey: string | null;
      fileKey: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createListing(
        params.title,
        params.description,
        params.price,
        params.status,
        params.previewImageKey,
        params.fileKey,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useUpdateListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      listingId: string;
      title: string;
      description: string;
      price: bigint;
      status: ListingStatus;
      previewImageKey: string | null;
      fileKey: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateListing(
        params.listingId,
        params.title,
        params.description,
        params.price,
        params.status,
        params.previewImageKey,
        params.fileKey,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useDeleteListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listingId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteListing(listingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useGetDownloadFileUrl() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (listingId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.getDownloadFileUrl(listingId);
    },
  });
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export function useGetUserOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["userOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["allOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      listingId: string;
      amount: bigint;
      paymentIntentId: string | null;
      discountCode?: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createOrder(
        params.listingId,
        params.amount,
        params.paymentIntentId,
        params.discountCode ?? null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userOrders"] });
      queryClient.invalidateQueries({ queryKey: ["allOrders"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      orderId: string;
      status: OrderStatus;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateOrderStatus(params.orderId, params.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userOrders"] });
      queryClient.invalidateQueries({ queryKey: ["allOrders"] });
    },
  });
}

export function useMarkOrderAsRefunded() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.markOrderAsRefunded(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allOrders"] });
      queryClient.invalidateQueries({ queryKey: ["userOrders"] });
    },
  });
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export function useGetUserSubscriptions() {
  const { actor, isFetching } = useActor();
  return useQuery<Subscription[]>({
    queryKey: ["userSubscriptions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserSubscriptions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllSubscriptions() {
  const { actor, isFetching } = useActor();
  return useQuery<Subscription[]>({
    queryKey: ["allSubscriptions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSubscriptions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateSubscription() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      stripeSubscriptionId: string;
      currentPeriodEnd: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createSubscription(
        params.stripeSubscriptionId,
        params.currentPeriodEnd,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSubscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["allSubscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useUpdateSubscriptionStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      subscriptionId: string;
      status: SubscriptionStatus;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateSubscriptionStatus(
        params.subscriptionId,
        params.status,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSubscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["allSubscriptions"] });
    },
  });
}

// ─── Users (admin) ────────────────────────────────────────────────────────────

export function useGetAllUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useBanUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.banUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useUnbanUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.unbanUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export function useGetAnalytics() {
  const { actor, isFetching } = useActor();
  return useQuery<Analytics>({
    queryKey: ["analytics"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getAnalytics();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Stripe ───────────────────────────────────────────────────────────────────

export type CheckoutSession = {
  id: string;
  url: string;
};

export function useCreateCheckoutSession() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (params: {
      items: ShoppingItem[];
      successUrl: string;
      cancelUrl: string;
    }): Promise<CheckoutSession> => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.createCheckoutSession(
        params.items,
        params.successUrl,
        params.cancelUrl,
      );
      const session = JSON.parse(result) as CheckoutSession;
      if (!session?.url) {
        throw new Error("Stripe session missing url");
      }
      return session;
    },
  });
}

export function useGetStripeSessionStatus() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.getStripeSessionStatus(sessionId);
    },
  });
}

export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isStripeConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isStripeConfigured"] });
    },
  });
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export function useGetApprovedReviews(listingId: ListingId) {
  const { actor, isFetching } = useActor();
  return useQuery<Review[]>({
    queryKey: ["approvedReviews", listingId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getApprovedReviews(listingId);
    },
    enabled: !!actor && !isFetching && !!listingId,
  });
}

export function useGetAllReviews() {
  const { actor, isFetching } = useActor();
  return useQuery<Review[]>({
    queryKey: ["allReviews"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllReviews();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      listingId: ListingId;
      rating: bigint;
      comment: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitReview(
        params.listingId,
        params.rating,
        params.comment,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["approvedReviews", variables.listingId],
      });
      queryClient.invalidateQueries({ queryKey: ["allReviews"] });
    },
  });
}

export function useModerateReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      reviewId: ReviewId;
      status: ReviewStatus;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.moderateReview(params.reviewId, params.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allReviews"] });
      // Also invalidate approved reviews for any listing
      queryClient.invalidateQueries({ queryKey: ["approvedReviews"] });
    },
  });
}

export function useDeleteReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reviewId: ReviewId) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteReview(reviewId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allReviews"] });
      queryClient.invalidateQueries({ queryKey: ["approvedReviews"] });
    },
  });
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export function useGetCallerWishlist() {
  const { actor, isFetching } = useActor();
  return useQuery<WishlistSnapshot | null>({
    queryKey: ["callerWishlist"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerWishlist();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddToWishlist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listingId: ListingId) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addToWishlist(listingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerWishlist"] });
    },
  });
}

export function useRemoveFromWishlist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listingId: ListingId) => {
      if (!actor) throw new Error("Actor not available");
      return actor.removeFromWishlist(listingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerWishlist"] });
    },
  });
}

export function useSetWishlistVisibility() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (isPublic: boolean) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setWishlistVisibility(isPublic);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerWishlist"] });
    },
  });
}

// ─── Discount Codes ───────────────────────────────────────────────────────────

export function useGetDiscountCodes() {
  const { actor, isFetching } = useActor();
  return useQuery<DiscountCode[]>({
    queryKey: ["discountCodes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDiscountCodes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateDiscountCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      code: string;
      discountPercent: bigint;
      expiresAt: bigint | null;
      usageLimit: bigint | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createDiscountCode(
        params.code,
        params.discountPercent,
        params.expiresAt,
        params.usageLimit,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discountCodes"] });
    },
  });
}

export function useDeactivateDiscountCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (codeId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deactivateDiscountCode(codeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discountCodes"] });
    },
  });
}

export function useValidateDiscountCode() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.validateDiscountCode(code);
    },
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function useGetCallerNotifications() {
  const { actor, isFetching } = useActor();
  return useQuery<Notification[]>({
    queryKey: ["callerNotifications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCallerNotifications();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUnreadNotificationCount() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["unreadNotificationCount"],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getUnreadNotificationCount();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.markNotificationRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationCount"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.markAllNotificationsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationCount"] });
    },
  });
}

export function useClearReadNotifications() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.clearReadNotifications();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationCount"] });
    },
  });
}

export function useSendAdminAnnouncement() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (params: { title: string; message: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.sendAdminAnnouncement(params.title, params.message);
    },
  });
}
