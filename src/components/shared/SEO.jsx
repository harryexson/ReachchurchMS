import React from 'react';
import { Helmet } from 'react-helmet';

const CUSTOM_DOMAIN = 'reachconnect.church'; // Update this to your actual domain
const GOOGLE_SITE_VERIFICATION = 'your-google-verification-code'; // Update after claiming in Google Search Console

export default function SEO({ 
    title = 'REACH Church Connect - Complete Church Management System',
    description = 'Comprehensive church management software for member tracking, giving, events, communications, and more. Streamline your ministry operations.',
    keywords = 'church management software, church giving, member management, church events, church communications, ministry software',
    image = `https://${CUSTOM_DOMAIN}/og-image.png`,
    url = '',
    type = 'website',
    canonicalUrl = ''
}) {
    const fullUrl = url ? `https://${CUSTOM_DOMAIN}${url}` : `https://${CUSTOM_DOMAIN}`;
    const canonical = canonicalUrl || fullUrl;

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <link rel="canonical" href={canonical} />

            {/* Google Search Console Verification */}
            <meta name="google-site-verification" content={GOOGLE_SITE_VERIFICATION} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:site_name" content="REACH Church Connect" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={fullUrl} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Additional SEO */}
            <meta name="robots" content="index, follow" />
            <meta name="language" content="English" />
            <meta name="revisit-after" content="7 days" />
            <meta name="author" content="REACH Church Connect" />

            {/* Structured Data for Organization */}
            <script type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    "name": "REACH Church Connect",
                    "applicationCategory": "BusinessApplication",
                    "offers": {
                        "@type": "Offer",
                        "price": "0",
                        "priceCurrency": "USD"
                    },
                    "description": description,
                    "url": fullUrl
                })}
            </script>
        </Helmet>
    );
}

export { CUSTOM_DOMAIN, GOOGLE_SITE_VERIFICATION };