import { callBackend } from "./groqService";

export const paymentService = {
    /**
     * Generates a Click.uz checkout URL
     */
    generateClickUrl(amount: number, userId: string, planId: string) {
        const baseUrl = "https://my.click.uz/services/pay";
        const merchantId = process.env.NEXT_PUBLIC_CLICK_MERCHANT_ID || "YOUR_MERCHANT_ID";
        const serviceId = process.env.NEXT_PUBLIC_CLICK_SERVICE_ID || "YOUR_SERVICE_ID";

        const params = new URLSearchParams({
            service_id: serviceId,
            merchant_id: merchantId,
            amount: amount.toFixed(2),
            transaction_param: `${userId}_${planId}`, // Combined ID for webhook callback
            return_url: window.location.origin + "/dashboard/settings?tab=billing&status=success",
        });
        return `${baseUrl}?${params.toString()}`;
    },

    /**
     * Generates a Payme checkout URL
     */
    generatePaymeUrl(amount: number, userId: string, planId: string) {
        const merchantId = process.env.NEXT_PUBLIC_PAYME_MERCHANT_ID || "YOUR_MERCHANT_ID";
        const amountInTiyin = Math.round(amount * 100);

        // Format: m={merchant_id};ac.user_id={userId};ac.plan_id={planId};a={amount};c={return_url}
        const params = `m=${merchantId};ac.user_id=${userId};ac.plan_id=${planId};a=${amountInTiyin};c=${window.location.origin}/dashboard/settings?tab=billing&status=success`;
        const encodedParams = btoa(params);
        return `https://checkout.paycom.uz/${encodedParams}`;
    },

    /**
     * Fetches a Stripe Client Secret from our Cloud Function
     */
    async createStripePaymentIntent(amount: number, userId: string, planId: string) {
        try {
            const result = await callBackend("createPaymentIntent", {
                amount,
                planId,
                currency: "usd"
            });

            if (result.success) {
                return result.clientSecret;
            }
            throw new Error(result.error || "Failed to create payment intent");
        } catch (error) {
            console.error("Payment Intent Error:", error);
            return null;
        }
    }
};
