import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export const useUserOrganization = () => {
    const [user, setUser] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadUserOrganization = async () => {
            try {
                // Get current user
                const currentUser = await base44.auth.me();
                setUser(currentUser);

                if (!currentUser) {
                    setIsLoading(false);
                    return;
                }

                // Get user's subscription (admin only)
                if (currentUser.role === 'admin') {
                    const subscriptions = await base44.entities.Subscription.filter({
                        church_admin_email: currentUser.email
                    });

                    if (subscriptions.length > 0) {
                        setSubscription(subscriptions[0]);
                    }
                }

                setError(null);
            } catch (err) {
                console.error('Error loading user organization:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        loadUserOrganization();
    }, []);

    return {
        user,
        subscription,
        isLoading,
        error,
        organizationEmail: user?.email // For filtering entities
    };
};