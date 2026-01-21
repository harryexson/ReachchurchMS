import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Lock, Mail, Loader2, CheckCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function MemberSignup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Get email from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const emailParam = urlParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
        }
    }, []);

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!email || !password || !confirmPassword || !fullName) {
            setError('All fields are required');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            // Create user account using Base44's signup
            const signupResponse = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    full_name: fullName,
                    role: 'user'
                })
            });

            if (!signupResponse.ok) {
                const errorData = await signupResponse.json();
                throw new Error(errorData.error || 'Failed to create account');
            }

            // Account created successfully
            setSuccess(true);
            toast.success('Account created successfully!');

            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = createPageUrl('MemberDashboard');
            }, 2000);

        } catch (error) {
            console.error('Signup error:', error);
            setError(error.message || 'Failed to create account. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-xl">
                    <CardContent className="pt-6 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Created!</h2>
                        <p className="text-slate-600 mb-4">
                            Your account has been successfully created. Redirecting to your dashboard...
                        </p>
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Back to Sign In Link */}
                <a 
                    href={createPageUrl('LandingPage')}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-lg">Back to sign in</span>
                </a>

                <Card className="shadow-xl">
                    <CardHeader className="text-center pb-6">
                        <CardTitle className="text-3xl font-bold text-slate-900">
                            Create your account
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSignup} className="space-y-6">
                            {/* Full Name */}
                            <div>
                                <Label className="text-base font-medium text-slate-900 mb-2 block">
                                    Full Name
                                </Label>
                                <Input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="John Doe"
                                    className="h-14 text-base bg-slate-50 border-slate-300"
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <Label className="text-base font-medium text-slate-900 mb-2 block">
                                    Email
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="h-14 pl-12 text-base bg-slate-50 border-slate-300"
                                        required
                                        disabled={!!new URLSearchParams(window.location.search).get('email')}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <Label className="text-base font-medium text-slate-900 mb-2 block">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min. 8 characters"
                                        className="h-14 pl-12 text-base bg-slate-50 border-slate-300"
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <Label className="text-base font-medium text-slate-900 mb-2 block">
                                    Confirm Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <Input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter password"
                                        className="h-14 pl-12 text-base bg-slate-50 border-slate-300"
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-14 text-lg font-semibold bg-slate-900 hover:bg-slate-800 text-white"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    'Create account'
                                )}
                            </Button>
                        </form>

                        {/* Additional Info */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-slate-600">
                                Already have an account?{' '}
                                <a 
                                    href={createPageUrl('LandingPage')}
                                    className="text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Sign in
                                </a>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Security Note */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-500">
                        🔒 Your information is secure and encrypted
                    </p>
                </div>
            </div>
        </div>
    );
}