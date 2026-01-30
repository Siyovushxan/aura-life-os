import { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface StripeCheckoutFormProps {
    clientSecret: string;
    onSuccess: () => void;
    onClose: () => void;
}

/**
 * Inner form component that uses Stripe hooks
 */
function StripeCheckoutForm({ clientSecret, onSuccess, onClose }: StripeCheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);

        try {
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: window.location.origin + '/dashboard/settings?tab=billing&status=success',
                },
                redirect: 'if_required',
            });

            if (error) {
                setErrorMessage(error.message || 'Payment failed');
                setIsProcessing(false);
            } else {
                // Payment successful
                onSuccess();
                onClose();
            }
        } catch (err) {
            setErrorMessage('An unexpected error occurred');
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement
                options={{
                    layout: 'tabs',
                    wallets: {
                        applePay: 'auto',
                        googlePay: 'auto',
                    },
                }}
            />

            {errorMessage && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <p className="text-red-400 text-sm">{errorMessage}</p>
                </div>
            )}

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all"
                    disabled={isProcessing}
                >
                    Bekor qilish
                </button>
                <button
                    type="submit"
                    disabled={!stripe || isProcessing}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isProcessing ? 'Kutilmoqda...' : 'TO\'LASH'}
                </button>
            </div>
        </form>
    );
}

interface StripePaymentWrapperProps {
    clientSecret: string;
    onSuccess: () => void;
    onClose: () => void;
}

/**
 * Wrapper component that provides Stripe context
 */
export function StripePaymentWrapper({ clientSecret, onSuccess, onClose }: StripePaymentWrapperProps) {
    const options = {
        clientSecret,
        appearance: {
            theme: 'night' as const,
            variables: {
                colorPrimary: '#06B6D4',
                colorBackground: '#0A0A0A',
                colorText: '#FFFFFF',
                colorDanger: '#EF4444',
                fontFamily: 'system-ui, sans-serif',
                borderRadius: '1rem',
            },
        },
    };

    return (
        <Elements stripe={stripePromise} options={options}>
            <StripeCheckoutForm
                clientSecret={clientSecret}
                onSuccess={onSuccess}
                onClose={onClose}
            />
        </Elements>
    );
}
