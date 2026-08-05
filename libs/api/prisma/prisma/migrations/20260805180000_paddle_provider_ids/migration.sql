-- Rename Stripe-specific columns to provider-agnostic names and add Game.paddleProductId.

ALTER TABLE "games" ADD COLUMN "paddleProductId" TEXT;

ALTER TABLE "orders" RENAME COLUMN "stripeSessionId" TO "providerCheckoutId";
ALTER TABLE "orders" RENAME COLUMN "stripePaymentId" TO "providerPaymentId";
ALTER INDEX "orders_stripeSessionId_key" RENAME TO "orders_providerCheckoutId_key";

ALTER TABLE "subscription_plans" RENAME COLUMN "stripePriceId" TO "providerPriceId";
ALTER INDEX "subscription_plans_stripePriceId_key" RENAME TO "subscription_plans_providerPriceId_key";

ALTER TABLE "user_subscriptions" RENAME COLUMN "stripeSubscriptionId" TO "providerSubscriptionId";
ALTER TABLE "user_subscriptions" RENAME COLUMN "stripeCustomerId" TO "providerCustomerId";
ALTER INDEX "user_subscriptions_stripeSubscriptionId_key" RENAME TO "user_subscriptions_providerSubscriptionId_key";
