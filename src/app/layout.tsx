import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { cookies } from 'next/headers';
import './globals.css';
import { getMessages, type Locale } from '@/i18n/messages';
import { LOCALE_COOKIE } from '@/i18n/I18nContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const localeRaw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = localeRaw === 'en' || localeRaw === 'zh-TW' ? localeRaw : 'zh-TW';
  const messages = getMessages(locale);
  const seo = messages.seo;

  return {
    title: {
      template: `%s | ${messages.app.title}`,
      default: seo.title,
    },
    description: seo.description,
    keywords: seo.keywords,
    authors: [{ name: 'Music Staff' }],
    metadataBase: new URL('https://musical-staff.vercel.app'),

    openGraph: {
      title: seo.ogTitle,
      description: seo.ogDescription,
      type: 'website',
      locale: locale === 'zh-TW' ? 'zh_TW' : 'en_US',
      siteName: messages.app.title,
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: seo.ogTitle,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title: seo.ogTitle,
      description: seo.ogDescription,
      images: ['/opengraph-image'],
    },

    robots: {
      index: true,
      follow: true,
    },

    alternates: {
      canonical: '/',
      languages: {
        en: '/en',
        'zh-TW': '/zh-TW',
      },
    },

    appleWebApp: {
      capable: true,
      title: messages.app.title,
      statusBarStyle: 'default',
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const localeRaw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = localeRaw === 'en' || localeRaw === 'zh-TW' ? localeRaw : 'zh-TW';

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Music Staff 五線譜',
              description:
                'Free online interactive music notation editor supporting notes, rests, accidentals, accents, tuplets, slurs, beaming, and playback.',
              applicationCategory: 'Multimedia',
              operatingSystem: 'All',
              browserRequirements: 'Requires JavaScript',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              author: {
                '@type': 'Person',
                name: 'Music Staff',
              },
            }),
          }}
        />
      </head>
      <body className="min-h-full bg-zinc-100 text-zinc-900 font-sans">
        {children}
      </body>
    </html>
  );
}
