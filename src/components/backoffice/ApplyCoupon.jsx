import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function ApplyCoupon({ subscription, onSuccess }) {
    const [couponCode, setCouponCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState(null);

    const handleApply = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const response = await base44.functions.invoke('applyCoupon', {
                subscription_id: subscription.id,
                coupon_code: couponCode
            });

            if (response.data?.success) {
                setMessageType('success');
                setMessage(response.data.message);
                setCouponCode("");
                
                if (onSuccess) {
                    onSuccess(response.data);
                }
            } else {
                setMessageType('error');
                setMessage(response.data?.error || 'Failed to apply coupon');
            }
        } catch (err) {
            setMessageType('error');
            setMessage(err.message || 'Failed to apply coupon');
        } finally {
            setLoading(false);
        }
    };

    if (!subscription.stripe_subscription_id) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                    This subscription must have Stripe billing set up before applying coupons.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
                <CardTitle className="text-blue-900">Apply Coupon</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleApply} className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            disabled={loading}
                            required
                        />
                        <Button
                            type="submit"
                            disabled={loading || !couponCode}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Applying...
                                </>
                            ) : (
                                "Apply"
                            )}
                        </Button>
                    </div>

                    {message && (
                        <Alert variant={messageType === 'success' ? 'default' : 'destructive'} className={messageType === 'success' ? 'bg-green-50 border-green-200' : ''}>
                            {messageType === 'success' ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                                <AlertCircle className="w-4 h-4" />
                            )}
                            <AlertDescription className={messageType === 'success' ? 'text-green-700' : ''}>
                                {message}
                            </AlertDescription>
                        </Alert>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}