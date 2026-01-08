import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Loader2, Heart, DollarSign, AlertCircle, CreditCard, Building2, Zap, QrCode, MessageSquare, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Translations
const translations = {
    en: {
        title: "Give to",
        tagline: "Thank you for supporting our mission and ministry!",
        signedIn: "Signed in as",
        selectAmount: "Select Amount",
        customAmount: "Or Enter Custom Amount",
        donationType: "Donation Type",
        recurring: "Make this a recurring donation",
        recurringDesc: "Set up automatic donations",
        frequency: "Frequency",
        weekly: "Weekly",
        monthly: "Monthly",
        annually: "Annually",
        fullName: "Full Name",
        email: "Email Address",
        phone: "Phone Number",
        address: "Mailing Address",
        addressHelp: "Required for tax receipt purposes",
        securePayment: "🔒 Secure Payment",
        secureDesc: "Your payment is processed securely through Stripe. We never store your credit card information.",
        proceedCard: "Continue with Card",
        proceedBank: "Continue with Bank Account",
        processingCard: "Processing Card Payment...",
        processingBank: "Processing Bank Payment...",
        taxDeductible: "All donations are tax-deductible. You'll receive a receipt via email.",
        thankYou: "Thank You for Your Generosity!",
        thankYouMsg: "Your donation has been received and recorded. You'll receive a receipt via email shortly.",
        thankYouMsg2: "Your gift makes a difference in our community and helps us continue our mission.",
        makeAnother: "Make Another Donation",
        cancelled: "Donation Cancelled",
        cancelledMsg: "No charges were made.",
        returning: "Returning to donation page...",
        quickGive: "⚡ Quick Give",
        quickGiveDesc: "Instant donation - no form required",
        textGive: "💬 Text to Give",
        textGiveDesc: "Text 'GIVE' to donate instantly",
        qrGive: "📱 QR Code",
        qrGiveDesc: "Scan with phone camera",
        paymentMethod: "Payment Method"
    },
    es: {
        title: "Donar a",
        tagline: "¡Gracias por apoyar nuestra misión y ministerio!",
        signedIn: "Conectado como",
        selectAmount: "Seleccionar Monto",
        customAmount: "O Ingrese un Monto Personalizado",
        donationType: "Tipo de Donación",
        recurring: "Hacer esta una donación recurrente",
        recurringDesc: "Configurar donaciones automáticas",
        frequency: "Frecuencia",
        weekly: "Semanal",
        monthly: "Mensual",
        annually: "Anual",
        fullName: "Nombre Completo",
        email: "Correo Electrónico",
        phone: "Número de Teléfono",
        address: "Dirección Postal",
        addressHelp: "Requerido para el recibo de impuestos",
        securePayment: "🔒 Pago Seguro",
        secureDesc: "Su pago se procesa de forma segura a través de Stripe. Nunca almacenamos su información de tarjeta de crédito.",
        proceedCard: "Continuar con Tarjeta",
        proceedBank: "Continuar con Cuenta Bancaria",
        processingCard: "Procesando Pago con Tarjeta...",
        processingBank: "Procesando Pago Bancario...",
        taxDeductible: "Todas las donaciones son deducibles de impuestos. Recibirá un recibo por correo electrónico.",
        thankYou: "¡Gracias por Su Generosidad!",
        thankYouMsg: "Su donación ha sido recibida y registrada. Recibirá un recibo por correo electrónico en breve.",
        thankYouMsg2: "Su regalo hace la diferencia en nuestra comunidad y nos ayuda a continuar nuestra misión.",
        makeAnother: "Hacer Otra Donación",
        cancelled: "Donación Cancelada",
        cancelledMsg: "No se realizaron cargos.",
        returning: "Regresando a la página de donaciones...",
        quickGive: "⚡ Donación Rápida",
        quickGiveDesc: "Donación instantánea - sin formulario",
        textGive: "💬 Donar por Texto",
        textGiveDesc: "Envía 'DONAR' para donar al instante",
        qrGive: "📱 Código QR",
        qrGiveDesc: "Escanear con la cámara del teléfono",
        paymentMethod: "Método de Pago"
    },
    fr: {
        title: "Faire un Don à",
        tagline: "Merci de soutenir notre mission et notre ministère!",
        signedIn: "Connecté en tant que",
        selectAmount: "Sélectionner le Montant",
        customAmount: "Ou Entrez un Montant Personnalisé",
        donationType: "Type de Don",
        recurring: "Faire de ceci un don récurrent",
        recurringDesc: "Configurer des dons automatiques",
        frequency: "Fréquence",
        weekly: "Hebdomadaire",
        monthly: "Mensuel",
        annually: "Annuel",
        fullName: "Nom Complet",
        email: "Adresse E-mail",
        phone: "Numéro de Téléphone",
        address: "Adresse Postale",
        addressHelp: "Requis pour le reçu fiscal",
        securePayment: "🔒 Paiement Sécurisé",
        secureDesc: "Votre paiement est traité en toute sécurité via Stripe. Nous ne stockons jamais vos informations de carte de crédit.",
        proceedCard: "Continuer avec Carte",
        proceedBank: "Continuer avec Compte Bancaire",
        processingCard: "Traitement du Paiement par Carte...",
        processingBank: "Traitement du Paiement Bancaire...",
        taxDeductible: "Tous les dons sont déductibles d'impôts. Vous recevrez un reçu par e-mail.",
        thankYou: "Merci pour Votre Générosité!",
        thankYouMsg: "Votre don a été reçu et enregistré. Vous recevrez un reçu par e-mail sous peu.",
        thankYouMsg2: "Votre don fait une différence dans notre communauté et nous aide à poursuivre notre mission.",
        makeAnother: "Faire un Autre Don",
        cancelled: "Don Annulé",
        cancelledMsg: "Aucun frais n'a été effectué.",
        returning: "Retour à la page de don...",
        quickGive: "⚡ Don Rapide",
        quickGiveDesc: "Don instantané - aucun formulaire requis",
        textGive: "💬 Donner par SMS",
        textGiveDesc: "Envoyez 'DONNER' pour donner instantanément",
        qrGive: "📱 Code QR",
        qrGiveDesc: "Scanner avec l'appareil photo du téléphone",
        paymentMethod: "Méthode de Paiement"
    },
    ja: {
        title: "寄付する",
        tagline: "私たちの使命と奉仕を支援していただきありがとうございます！",
        signedIn: "サインイン中",
        selectAmount: "金額を選択",
        customAmount: "またはカスタム金額を入力",
        donationType: "寄付の種類",
        recurring: "これを定期的な寄付にする",
        recurringDesc: "自動寄付を設定",
        frequency: "頻度",
        weekly: "毎週",
        monthly: "毎月",
        annually: "毎年",
        fullName: "氏名",
        email: "メールアドレス",
        phone: "電話番号",
        address: "住所",
        addressHelp: "税務領収書に必要です",
        securePayment: "🔒 安全な支払い",
        secureDesc: "お支払いはStripeを通じて安全に処理されます。クレジットカード情報は保存されません。",
        proceedCard: "カードで続ける",
        proceedBank: "銀行口座で続ける",
        processingCard: "カード決済処理中...",
        processingBank: "銀行決済処理中...",
        taxDeductible: "すべての寄付は税控除の対象となります。領収書がメールで送信されます。",
        thankYou: "ご寄付ありがとうございます！",
        thankYouMsg: "ご寄付を受け取り、記録いたしました。まもなく領収書がメールで送信されます。",
        thankYouMsg2: "あなたの贈り物は私たちのコミュニティに変化をもたらし、使命を継続するのに役立ちます。",
        makeAnother: "別の寄付をする",
        cancelled: "寄付がキャンセルされました",
        cancelledMsg: "料金は発生しませんでした。",
        returning: "寄付ページに戻っています...",
        quickGive: "⚡ クイック寄付",
        quickGiveDesc: "即座に寄付 - フォーム不要",
        textGive: "💬 テキストで寄付",
        textGiveDesc: "'GIVE'をテキストして即座に寄付",
        qrGive: "📱 QRコード",
        qrGiveDesc: "携帯電話のカメラでスキャン",
        paymentMethod: "支払い方法"
    },
    zh: {
        title: "捐赠给",
        tagline: "感谢您支持我们的使命和事工！",
        signedIn: "已登录为",
        selectAmount: "选择金额",
        customAmount: "或输入自定义金额",
        donationType: "捐赠类型",
        recurring: "将此设为定期捐赠",
        recurringDesc: "设置自动捐赠",
        frequency: "频率",
        weekly: "每周",
        monthly: "每月",
        annually: "每年",
        fullName: "全名",
        email: "电子邮件地址",
        phone: "电话号码",
        address: "邮寄地址",
        addressHelp: "税务收据所需",
        securePayment: "🔒 安全支付",
        secureDesc: "您的付款通过 Stripe 安全处理。我们从不存储您的信用卡信息。",
        proceedCard: "继续使用银行卡",
        proceedBank: "继续使用银行账户",
        processingCard: "正在处理银行卡付款...",
        processingBank: "正在处理银行付款...",
        taxDeductible: "所有捐款均可抵税。您将通过电子邮件收到收据。",
        thankYou: "感谢您的慷慨！",
        thankYouMsg: "您的捐款已收到并记录。您很快将通过电子邮件收到收据。",
        thankYouMsg2: "您的礼物在我们的社区中产生了影响，并帮助我们继续我们的使命。",
        makeAnother: "再次捐赠",
        cancelled: "捐赠已取消",
        cancelledMsg: "未产生任何费用。",
        returning: "返回捐赠页面...",
        quickGive: "⚡ 快速捐赠",
        quickGiveDesc: "即时捐赠 - 无需表格",
        textGive: "💬 短信捐赠",
        textGiveDesc: "发送'GIVE'即时捐赠",
        qrGive: "📱 二维码",
        qrGiveDesc: "用手机相机扫描",
        paymentMethod: "支付方式"
    }
};

export default function PublicGiving() {
    const [amount, setAmount] = useState("");
    const [customAmount, setCustomAmount] = useState("");
    const [donationType, setDonationType] = useState("offering");
    const [donorName, setDonorName] = useState("");
    const [donorEmail, setDonorEmail] = useState("");
    const [donorPhone, setDonorPhone] = useState("");
    const [donorAddress, setDonorAddress] = useState("");
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringFrequency, setRecurringFrequency] = useState("monthly");
    const [paymentMethod, setPaymentMethod] = useState("card");
    const [isProcessing, setIsProcessing] = useState(false);
    const [churchName, setChurchName] = useState("Our Church");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [goalData, setGoalData] = useState(null);
    const [currentMonthTotal, setCurrentMonthTotal] = useState(0);
    const [givingCategories, setGivingCategories] = useState([]);
    const [language, setLanguage] = useState('en');
    const [currency, setCurrency] = useState('USD');
    const [showQuickGive, setShowQuickGive] = useState(false);
    const [branding, setBranding] = useState({
        logo_url: "",
        primary_color: "#3b82f6",
        secondary_color: "#10b981",
        hero_image_url: "",
        tagline: ""
    });

    useEffect(() => {
        // Auto-detect language and currency
        const browserLang = navigator.language.split('-')[0];
        const supportedLangs = ['en', 'es', 'fr', 'ja', 'zh'];
        setLanguage(supportedLangs.includes(browserLang) ? browserLang : 'en');

        // Auto-detect currency based on locale
        const locale = navigator.language;
        if (locale.includes('CA')) setCurrency('CAD');
        else if (locale.includes('GB')) setCurrency('GBP');
        else if (locale.includes('EU') || locale.includes('FR') || locale.includes('DE') || locale.includes('ES') || locale.includes('IT')) setCurrency('EUR');
        else if (locale.includes('ZA')) setCurrency('ZAR');
        else if (locale.includes('NG')) setCurrency('NGN');
        else if (locale.includes('KE')) setCurrency('KES');
        else if (locale.includes('GH')) setCurrency('GHS');
        else if (locale.includes('JP')) setCurrency('JPY');
        else if (locale.includes('CN')) setCurrency('CNY');
        else setCurrency('USD');

        loadInitialData();
        
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true' || urlParams.get('cancelled') === 'true') {
            const isSuccess = urlParams.get('success') === 'true';
            const isCancelled = urlParams.get('cancelled') === 'true';
            
            window.history.replaceState({}, document.title, window.location.pathname);
            
            if (isSuccess) {
                sessionStorage.setItem('donation_success', 'true');
            }
            if (isCancelled) {
                sessionStorage.setItem('donation_cancelled', 'true');
            }
        }
    }, []);

    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            let user = null;
            try {
                user = await base44.auth.me();
                setCurrentUser(user);
                setIsAuthenticated(true);
                
                setDonorName(user.full_name || "");
                setDonorEmail(user.email || "");
                setDonorPhone(user.phone_number || "");
                
                if (user.member_id) {
                    try {
                        const members = await base44.entities.Member.filter({ id: user.member_id });
                        if (members.length > 0) {
                            setDonorAddress(members[0].address || "");
                        }
                    } catch (memberError) {
                        console.log('Could not load member data');
                    }
                }
            } catch (authError) {
                setIsAuthenticated(false);
            }

            const settings = await base44.entities.ChurchSettings.list();
            if (settings.length > 0) {
                const churchSettings = settings[0];
                if (churchSettings.church_name) {
                    setChurchName(churchSettings.church_name);
                }
                setBranding({
                    logo_url: churchSettings.logo_url || "",
                    primary_color: churchSettings.primary_color || "#3b82f6",
                    secondary_color: churchSettings.secondary_color || "#10b981",
                    hero_image_url: churchSettings.hero_image_url || "",
                    tagline: churchSettings.tagline || ""
                });
                
                if (churchSettings.show_goal_on_public_page && churchSettings.donation_goal_monthly) {
                    setGoalData({
                        goal: churchSettings.donation_goal_monthly,
                        title: churchSettings.donation_goal_title || "Monthly Goal",
                        description: churchSettings.donation_goal_description || ""
                    });
                    
                    const now = new Date();
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                    const donations = await base44.entities.Donation.list('-donation_date', 1000);
                    const monthlyDonations = donations.filter(d => d.donation_date >= monthStart);
                    const total = monthlyDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
                    setCurrentMonthTotal(total);
                }
            }

            const categories = await base44.entities.GivingCategory.filter({ 
                is_active: true,
                show_on_public_page: true
            });
            setGivingCategories(categories.sort((a, b) => a.display_order - b.display_order));
        } catch (error) {
            console.error("Failed to load initial data:", error);
        }
        setIsLoading(false);
    };

    // Currency symbols and suggested amounts
    const currencySymbols = {
        USD: '$', CAD: '$', EUR: '€', GBP: '£', 
        ZAR: 'R', NGN: '₦', KES: 'KSh', GHS: '₵',
        JPY: '¥', CNY: '¥'
    };
    
    const suggestedAmountsByCurrency = {
        USD: [25, 50, 100, 250, 500],
        CAD: [30, 65, 130, 325, 650],
        EUR: [20, 45, 90, 225, 450],
        GBP: [20, 40, 80, 200, 400],
        ZAR: [400, 900, 1800, 4500, 9000],
        NGN: [10000, 25000, 50000, 125000, 250000],
        KES: [2500, 6000, 12000, 30000, 60000],
        GHS: [300, 700, 1400, 3500, 7000],
        JPY: [3000, 7000, 14000, 35000, 70000],
        CNY: [180, 360, 720, 1800, 3600]
    };
    
    const suggestedAmounts = suggestedAmountsByCurrency[currency] || suggestedAmountsByCurrency.USD;
    const currencySymbol = currencySymbols[currency] || '$';
    const t = translations[language];

    const handleQuickGive = async (quickAmount) => {
        if (!donorName || !donorEmail) {
            alert("Please fill in your name and email first");
            return;
        }
        setAmount(String(quickAmount));
        setCustomAmount("");
        setShowQuickGive(false);
        setTimeout(() => handleDonate(quickAmount), 100);
    };

    const handleDonate = async (quickAmount = null) => {
        const donationAmount = quickAmount || (amount === 'custom' ? parseFloat(customAmount) : parseFloat(amount));
        
        if (!donationAmount || donationAmount <= 0) {
            alert("Please enter a valid donation amount");
            return;
        }

        if (!donorName || !donorEmail || !donorPhone || !donorAddress) {
            alert("Please fill in all required fields");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(donorEmail)) {
            alert("Please enter a valid email address");
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const baseUrl = window.location.origin + window.location.pathname;
            const successUrl = `${baseUrl}?success=true&t=${Date.now()}`;
            const cancelUrl = `${baseUrl}?cancelled=true&t=${Date.now()}`;

            const response = await base44.functions.invoke('createDonationCheckout', {
                amount: donationAmount,
                currency: currency,
                donation_type: donationType,
                donor_name: donorName,
                donor_email: donorEmail,
                donor_phone: donorPhone,
                donor_address: donorAddress,
                recurring: isRecurring,
                recurring_frequency: isRecurring ? recurringFrequency : null,
                successUrl: successUrl,
                cancelUrl: cancelUrl,
                metadata: {
                    donor_name: donorName,
                    donor_email: donorEmail,
                    donor_phone: donorPhone,
                    donor_address: donorAddress,
                    donation_type: donationType,
                    recurring: isRecurring ? 'true' : 'false',
                    recurring_frequency: isRecurring ? recurringFrequency : '',
                    source: 'public_giving_page',
                    user_id: currentUser?.id || 'public',
                    member_id: currentUser?.member_id || null,
                    language: language,
                    currency: currency,
                    payment_method: paymentMethod
                }
            });

            if (response.data && response.data.checkout_url) {
                if (window.self !== window.top) {
                    window.top.location.href = response.data.checkout_url;
                } else {
                    window.location.href = response.data.checkout_url;
                }
            } else {
                throw new Error("No checkout URL received");
            }
        } catch (error) {
            console.error("Donation error:", error);
            setError(error.response?.data?.message || error.message || "Failed to process donation");
            setIsProcessing(false);
            alert("Failed to process donation. Please try again.");
        }
    };

    const donationSuccess = sessionStorage.getItem('donation_success') === 'true';
    const donationCancelled = sessionStorage.getItem('donation_cancelled') === 'true';

    if (donationSuccess) {
        sessionStorage.removeItem('donation_success');
    }
    if (donationCancelled) {
        sessionStorage.removeItem('donation_cancelled');
    }

    if (donationSuccess) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 flex items-center justify-center p-6"
            >
                <Card className="max-w-2xl w-full shadow-2xl border-0">
                    <CardContent className="pt-12 pb-12 text-center space-y-6">
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg"
                        >
                            <CheckCircle className="w-14 h-14 text-white" />
                        </motion.div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            {t.thankYou}
                        </h1>
                        <p className="text-lg text-slate-700">{t.thankYouMsg}</p>
                        <p className="text-slate-600">{t.thankYouMsg2}</p>
                        <Button
                            onClick={() => window.location.href = window.location.pathname}
                            className="mt-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
                        >
                            {t.makeAnother}
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    if (donationCancelled) {
        setTimeout(() => {
            window.location.href = window.location.pathname;
        }, 3000);
        
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center p-6">
                <Card className="max-w-2xl w-full shadow-xl border-0">
                    <CardContent className="pt-12 pb-12 text-center space-y-6">
                        <h2 className="text-3xl font-bold text-slate-900">{t.cancelled}</h2>
                        <p className="text-xl text-slate-600">{t.cancelledMsg}</p>
                        <p className="text-slate-500">{t.returning}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 text-green-600 animate-spin" />
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
            style={{
                background: `linear-gradient(135deg, ${branding.primary_color}08 0%, ${branding.secondary_color}08 100%)`
            }}
        >
            {/* Language & Currency Selectors */}
            <div className="fixed top-4 right-4 z-50 flex gap-2">
                <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-32 bg-white/90 backdrop-blur-sm shadow-lg border-0">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="USD">USD $</SelectItem>
                        <SelectItem value="CAD">CAD $</SelectItem>
                        <SelectItem value="EUR">EUR €</SelectItem>
                        <SelectItem value="GBP">GBP £</SelectItem>
                        <SelectItem value="ZAR">ZAR R</SelectItem>
                        <SelectItem value="NGN">NGN ₦</SelectItem>
                        <SelectItem value="KES">KES KSh</SelectItem>
                        <SelectItem value="GHS">GHS ₵</SelectItem>
                        <SelectItem value="JPY">JPY ¥</SelectItem>
                        <SelectItem value="CNY">CNY ¥</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-32 bg-white/90 backdrop-blur-sm shadow-lg border-0">
                        <Globe className="w-4 h-4 mr-2" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="ja">日本語</SelectItem>
                        <SelectItem value="zh">中文</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    {branding.logo_url ? (
                        <img 
                            src={branding.logo_url} 
                            alt={`${churchName} Logo`}
                            className="h-20 sm:h-32 w-auto max-w-[400px] mx-auto mb-6 object-contain"
                        />
                    ) : (
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68d38ad0f4d6d5d05900d129/2ca3c03b0_ReachLOGOEdited08_44_18AM.png"
                            alt="REACH ChurchConnect Logo"
                            className="h-20 sm:h-32 w-auto max-w-[400px] mx-auto mb-6 object-contain"
                        />
                    )}
                    
                    <motion.div 
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
                        style={{ 
                            background: `linear-gradient(135deg, ${branding.primary_color} 0%, ${branding.secondary_color} 100%)` 
                        }}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </motion.div>
                    
                    <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-3">
                        {t.title} {churchName}
                    </h1>
                    {branding.tagline && (
                        <p className="text-lg text-slate-600 mb-3">{branding.tagline}</p>
                    )}
                    <p className="text-base sm:text-lg text-slate-600">{t.tagline}</p>
                    {isAuthenticated && (
                        <p className="text-sm text-green-600 mt-3 font-medium">
                            ✓ {t.signedIn} {currentUser?.full_name || currentUser?.email}
                        </p>
                    )}
                </motion.div>

                {/* Quick Action Cards */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid sm:grid-cols-3 gap-4 mb-8"
                >
                    <Card 
                        className="cursor-pointer hover:shadow-xl transition-all border-2 hover:border-green-500 bg-white/80 backdrop-blur-sm"
                        onClick={() => setShowQuickGive(true)}
                    >
                        <CardContent className="p-6 text-center">
                            <Zap className="w-10 h-10 mx-auto mb-3 text-yellow-500" />
                            <h3 className="font-bold text-slate-900 mb-1">{t.quickGive}</h3>
                            <p className="text-xs text-slate-600">{t.quickGiveDesc}</p>
                        </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-xl transition-all border-2 hover:border-blue-500 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6 text-center">
                            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-blue-500" />
                            <h3 className="font-bold text-slate-900 mb-1">{t.textGive}</h3>
                            <p className="text-xs text-slate-600">{t.textGiveDesc}</p>
                        </CardContent>
                    </Card>

                    <Card 
                        className="cursor-pointer hover:shadow-xl transition-all border-2 hover:border-purple-500 bg-white/80 backdrop-blur-sm"
                        onClick={() => window.location.href = '/QRCodeDonation'}
                    >
                        <CardContent className="p-6 text-center">
                            <QrCode className="w-10 h-10 mx-auto mb-3 text-purple-500" />
                            <h3 className="font-bold text-slate-900 mb-1">{t.qrGive}</h3>
                            <p className="text-xs text-slate-600">{t.qrGiveDesc}</p>
                        </CardContent>
                    </Card>
                </motion.div>

                {error && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-6"
                    >
                        <Alert className="bg-red-50 border-red-200">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <AlertDescription className="text-red-900">
                                <p className="font-semibold">Error Processing Donation</p>
                                <p className="text-sm mt-1">{error}</p>
                            </AlertDescription>
                        </Alert>
                    </motion.div>
                )}

                {/* Goal Progress */}
                <AnimatePresence>
                    {goalData && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="shadow-2xl mb-8 bg-gradient-to-br from-green-50 to-emerald-50 border-0 overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-3xl" />
                                <CardContent className="pt-8 pb-8 relative">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-2xl font-bold text-slate-900">{goalData.title}</h3>
                                                {goalData.description && (
                                                    <p className="text-sm text-slate-600 mt-2">{goalData.description}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-4xl font-bold text-green-600">
                                                    ${currentMonthTotal.toLocaleString()}
                                                </p>
                                                <p className="text-sm text-slate-600 mt-1">
                                                    of ${goalData.goal.toLocaleString()} goal
                                                </p>
                                            </div>
                                        </div>
                                        <div className="relative h-5 bg-white/60 rounded-full overflow-hidden shadow-inner">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min((currentMonthTotal / goalData.goal) * 100, 100)}%` }}
                                                transition={{ duration: 1, delay: 0.5 }}
                                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 rounded-full"
                                            />
                                        </div>
                                        <div className="flex justify-between text-sm font-medium text-slate-700">
                                            <span>{Math.round((currentMonthTotal / goalData.goal) * 100)}% reached</span>
                                            <span>${(goalData.goal - currentMonthTotal).toLocaleString()} remaining</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Donation Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="shadow-2xl border-0 overflow-hidden bg-white/90 backdrop-blur-sm">
                        <CardHeader 
                            className="text-white relative overflow-hidden pb-8"
                            style={{
                                background: `linear-gradient(135deg, ${branding.primary_color} 0%, ${branding.secondary_color} 100%)`
                            }}
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                            <CardTitle className="text-3xl relative z-10">Make a Donation</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-8">
                            {/* Amount Selection */}
                            <div className="space-y-4">
                                <Label className="text-lg font-semibold">{t.selectAmount}</Label>
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                    {suggestedAmounts.map(amt => (
                                        <motion.div key={amt} whileTap={{ scale: 0.95 }}>
                                            <Button
                                                type="button"
                                                variant={amount === String(amt) ? "default" : "outline"}
                                                onClick={() => {
                                                    setAmount(String(amt));
                                                    setCustomAmount("");
                                                }}
                                                className={`w-full h-16 text-xl font-bold transition-all ${
                                                    amount === String(amt) 
                                                        ? 'shadow-lg scale-105' 
                                                        : 'hover:scale-105'
                                                }`}
                                                style={amount === String(amt) ? {
                                                    background: `linear-gradient(135deg, ${branding.primary_color} 0%, ${branding.secondary_color} 100%)`
                                                } : {}}
                                            >
                                                ${amt}
                                            </Button>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="customAmount" className="text-base font-semibold">{t.customAmount}</Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 text-xl font-semibold">{currencySymbol}</span>
                                    <Input
                                        id="customAmount"
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={customAmount}
                                        onChange={(e) => {
                                            setCustomAmount(e.target.value);
                                            setAmount('custom');
                                        }}
                                        placeholder="Enter amount"
                                        className="pl-12 text-2xl h-16 border-2 focus:ring-4 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="donationType" className="text-base font-semibold">{t.donationType}</Label>
                                <Select value={donationType} onValueChange={setDonationType}>
                                    <SelectTrigger className="h-12 text-lg border-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {givingCategories.length > 0 ? (
                                            givingCategories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.category_code}>
                                                    {cat.category_name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <>
                                                <SelectItem value="tithe">Tithe</SelectItem>
                                                <SelectItem value="offering">Offering</SelectItem>
                                                <SelectItem value="building_fund">Building Fund</SelectItem>
                                                <SelectItem value="missions">Missions</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Payment Method */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">{t.paymentMethod}</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <motion.div whileTap={{ scale: 0.98 }}>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('card')}
                                            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                                                paymentMethod === 'card'
                                                    ? 'border-blue-500 bg-blue-50 shadow-md'
                                                    : 'border-slate-200 hover:border-blue-300'
                                            }`}
                                        >
                                            <CreditCard className="w-8 h-8 mb-2 text-blue-600" />
                                            <p className="font-semibold text-slate-900">Card</p>
                                            <p className="text-xs text-slate-600">Credit or Debit</p>
                                        </button>
                                    </motion.div>

                                    <motion.div whileTap={{ scale: 0.98 }}>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('bank')}
                                            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                                                paymentMethod === 'bank'
                                                    ? 'border-green-500 bg-green-50 shadow-md'
                                                    : 'border-slate-200 hover:border-green-300'
                                            }`}
                                        >
                                            <Building2 className="w-8 h-8 mb-2 text-green-600" />
                                            <p className="font-semibold text-slate-900">ACH</p>
                                            <p className="text-xs text-slate-600">Bank Account</p>
                                        </button>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Recurring Donation */}
                            <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <Label className="text-base font-semibold text-slate-900">{t.recurring}</Label>
                                        <p className="text-sm text-slate-600 mt-1">{t.recurringDesc}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsRecurring(!isRecurring)}
                                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all shadow-md ${
                                            isRecurring ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-slate-300'
                                        }`}
                                    >
                                        <motion.span
                                            animate={{ x: isRecurring ? 28 : 4 }}
                                            className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg"
                                        />
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {isRecurring && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-3"
                                        >
                                            <Label className="text-base font-semibold">{t.frequency}</Label>
                                            <Select value={recurringFrequency} onValueChange={setRecurringFrequency}>
                                                <SelectTrigger className="h-12 bg-white border-2">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="weekly">{t.weekly}</SelectItem>
                                                    <SelectItem value="monthly">{t.monthly}</SelectItem>
                                                    <SelectItem value="annually">{t.annually}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-sm text-green-700 font-medium bg-green-100 p-3 rounded-lg">
                                                ✓ You'll be charged {currencySymbol}{amount === 'custom' ? customAmount : amount} {currency} {recurringFrequency}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Donor Information */}
                            <div className="space-y-6 border-t pt-6">
                                <h3 className="text-lg font-bold text-slate-900">Your Information</h3>
                                
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="donorName" className="text-base">
                                            {t.fullName} <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="donorName"
                                            value={donorName}
                                            onChange={(e) => setDonorName(e.target.value)}
                                            placeholder="John Doe"
                                            className="h-12 border-2"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="donorEmail" className="text-base">
                                            {t.email} <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="donorEmail"
                                            type="email"
                                            value={donorEmail}
                                            onChange={(e) => setDonorEmail(e.target.value)}
                                            placeholder="john@example.com"
                                            className="h-12 border-2"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="donorPhone" className="text-base">
                                        {t.phone} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="donorPhone"
                                        type="tel"
                                        value={donorPhone}
                                        onChange={(e) => setDonorPhone(e.target.value)}
                                        placeholder="(555) 123-4567"
                                        className="h-12 border-2"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="donorAddress" className="text-base">
                                        {t.address} <span className="text-red-500">*</span>
                                    </Label>
                                    <Textarea
                                        id="donorAddress"
                                        value={donorAddress}
                                        onChange={(e) => setDonorAddress(e.target.value)}
                                        placeholder="123 Main St, City, State ZIP"
                                        rows={3}
                                        className="border-2"
                                        required
                                    />
                                    <p className="text-xs text-slate-500">{t.addressHelp}</p>
                                </div>
                            </div>

                            {/* Security Notice */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                                <h3 className="font-bold text-blue-900 mb-2">{t.securePayment}</h3>
                                <p className="text-sm text-blue-800">{t.secureDesc}</p>
                            </div>

                            {/* Submit Buttons */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <motion.div whileTap={{ scale: 0.98 }}>
                                    <Button
                                        onClick={() => handleDonate()}
                                        disabled={isProcessing || (!amount && !customAmount) || paymentMethod !== 'card'}
                                        className="w-full text-lg py-7 text-white font-bold shadow-xl hover:shadow-2xl transition-all"
                                        style={{ 
                                            background: paymentMethod === 'card' 
                                                ? `linear-gradient(135deg, ${branding.primary_color} 0%, ${branding.secondary_color} 100%)` 
                                                : '#cbd5e1',
                                            opacity: paymentMethod === 'card' ? 1 : 0.5
                                        }}
                                    >
                                        {isProcessing && paymentMethod === 'card' ? (
                                            <>
                                                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                                                {t.processingCard}
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard className="w-6 h-6 mr-2" />
                                                {t.proceedCard}
                                            </>
                                        )}
                                    </Button>
                                </motion.div>

                                <motion.div whileTap={{ scale: 0.98 }}>
                                    <Button
                                        onClick={() => handleDonate()}
                                        disabled={isProcessing || (!amount && !customAmount) || paymentMethod !== 'bank'}
                                        className="w-full text-lg py-7 text-white font-bold shadow-xl hover:shadow-2xl transition-all"
                                        style={{ 
                                            background: paymentMethod === 'bank'
                                                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                                : '#cbd5e1',
                                            opacity: paymentMethod === 'bank' ? 1 : 0.5
                                        }}
                                    >
                                        {isProcessing && paymentMethod === 'bank' ? (
                                            <>
                                                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                                                {t.processingBank}
                                            </>
                                        ) : (
                                            <>
                                                <Building2 className="w-6 h-6 mr-2" />
                                                {t.proceedBank}
                                            </>
                                        )}
                                    </Button>
                                </motion.div>
                            </div>

                            <p className="text-sm text-slate-500 text-center">{t.taxDeductible}</p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Quick Give Modal */}
                <AnimatePresence>
                    {showQuickGive && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            onClick={() => setShowQuickGive(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
                            >
                                <div className="text-center mb-6">
                                    <Zap className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{t.quickGive}</h2>
                                    <p className="text-slate-600">{t.quickGiveDesc}</p>
                                </div>
                                
                                {!donorName || !donorEmail ? (
                                    <Alert className="bg-yellow-50 border-yellow-200">
                                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                                        <AlertDescription className="text-yellow-900">
                                            Please fill in your name and email in the form first
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        {[25, 50, 100, 250].map(amt => (
                                            <Button
                                                key={amt}
                                                onClick={() => handleQuickGive(amt)}
                                                className="h-20 text-2xl font-bold shadow-lg hover:scale-105 transition-all"
                                                style={{
                                                    background: `linear-gradient(135deg, ${branding.primary_color} 0%, ${branding.secondary_color} 100%)`
                                                }}
                                            >
                                                ${amt}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}