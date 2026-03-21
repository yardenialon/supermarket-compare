// apps/web/src/app/hashvatat-mekhirim-mazon/page.tsx

import type { Metadata } from "next";
import Link from "next/link";

// ג”€ג”€ג”€ SEO Metadata ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
export const metadata: Metadata = {
  title: "׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳ 2026 | ׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™ ׳¡׳•׳₪׳¨׳׳¨׳§׳˜ ג€“ Savy",
  description:
    "׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳ ׳‘׳™׳ ׳›׳ ׳¨׳©׳×׳•׳× ׳”׳¡׳•׳₪׳¨׳׳¨׳§׳˜ ׳‘׳™׳©׳¨׳׳: ׳©׳•׳₪׳¨׳¡׳, ׳¨׳׳™ ׳׳•׳™, ׳•׳™׳§׳˜׳•׳¨׳™, ׳׳’׳” ׳•׳¢׳•׳“. ׳—׳¡׳›׳• ׳׳׳•׳× ׳©׳§׳׳™׳ ׳‘׳—׳•׳“׳© ׳¢׳ Savy ג€” ׳›׳׳™ ׳”׳©׳•׳•׳׳× ׳”׳׳—׳™׳¨׳™׳ ׳”׳—׳™׳ ׳׳™.",
  keywords: [
    "׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳",
    "׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™ ׳¡׳•׳₪׳¨׳׳¨׳§׳˜",
    "׳׳—׳™׳¨׳™ ׳׳–׳•׳ ׳™׳©׳¨׳׳",
    "׳¡׳•׳₪׳¨׳׳¨׳§׳˜ ׳–׳•׳",
    "׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳©׳•׳₪׳¨׳¡׳",
    "׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳¨׳׳™ ׳׳•׳™",
    "׳—׳™׳¡׳›׳•׳ ׳‘׳§׳ ׳™׳•׳×",
    "savy ׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳",
  ],
  alternates: {
    canonical: "https://savy.co.il/hashvatat-mekhirim-mazon",
  },
  openGraph: {
    title: "׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳ 2026 ג€“ Savy",
    description:
      "׳’׳׳• ׳”׳™׳›׳ ׳”׳›׳™ ׳–׳•׳ ׳׳§׳ ׳•׳× ׳׳–׳•׳ ׳‘׳™׳©׳¨׳׳. ׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳—׳™׳” ׳‘׳™׳ 29 ׳¨׳©׳×׳•׳× ׳¡׳•׳₪׳¨׳׳¨׳§׳˜.",
    url: "https://savy.co.il/hashvatat-mekhirim-mazon",
    siteName: "Savy",
    locale: "he_IL",
    type: "article",
    images: [
      {
        url: "https://savy.co.il/og/hashvatat-mekhirim-mazon.jpg",
        width: 1200,
        height: 630,
        alt: "Savy ג€“ ׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳ ׳‘׳™׳ ׳¡׳•׳₪׳¨׳׳¨׳§׳˜׳™׳ ׳‘׳™׳©׳¨׳׳",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳ 2026 ג€“ Savy",
    description:
      "׳’׳׳• ׳”׳™׳›׳ ׳”׳›׳™ ׳–׳•׳ ׳׳§׳ ׳•׳× ׳׳–׳•׳ ׳‘׳™׳©׳¨׳׳. ׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳—׳™׳” ׳‘׳™׳ 29 ׳¨׳©׳×׳•׳×.",
  },
};

// ג”€ג”€ג”€ JSON-LD Structured Data ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://savy.co.il/hashvatat-mekhirim-mazon#webpage",
      url: "https://savy.co.il/hashvatat-mekhirim-mazon",
      name: "׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳ 2026 | Savy",
      description: "׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳ ׳‘׳™׳ ׳›׳ ׳¨׳©׳×׳•׳× ׳”׳¡׳•׳₪׳¨׳׳¨׳§׳˜ ׳‘׳™׳©׳¨׳׳. ׳›׳׳™ ׳—׳™׳ ׳׳™ ׳׳—׳™׳¡׳›׳•׳ ׳‘׳§׳ ׳™׳•׳×.",
      inLanguage: "he",
      isPartOf: { "@id": "https://savy.co.il/#website" },
      breadcrumb: { "@id": "https://savy.co.il/hashvatat-mekhirim-mazon#breadcrumb" },
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://savy.co.il/hashvatat-mekhirim-mazon#breadcrumb",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "׳‘׳™׳×", item: "https://savy.co.il" },
        {
          "@type": "ListItem",
          position: 2,
          name: "׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳",
          item: "https://savy.co.il/hashvatat-mekhirim-mazon",
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "׳׳™׳ ׳¢׳•׳©׳™׳ ׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳ ׳‘׳™׳©׳¨׳׳?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "׳”׳“׳¨׳ ׳”׳₪׳©׳•׳˜׳” ׳‘׳™׳•׳×׳¨ ׳׳¢׳©׳•׳× ׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳ ׳”׳™׳ ׳׳”׳©׳×׳׳© ׳‘-Savy.co.il. ׳₪׳©׳•׳˜ ׳”׳›׳ ׳™׳¡׳• ׳׳× ׳¨׳©׳™׳׳× ׳”׳§׳ ׳™׳•׳× ׳©׳׳›׳, ׳•-Savy ׳×׳©׳•׳•׳” ׳׳× ׳”׳׳—׳™׳¨׳™׳ ׳‘׳–׳׳ ׳׳׳× ׳‘׳™׳ 29 ׳¨׳©׳×׳•׳× ׳¡׳•׳₪׳¨׳׳¨׳§׳˜ ׳‘׳™׳©׳¨׳׳ ׳•׳×׳׳¦׳ ׳׳›׳ ׳׳× ׳”׳¡׳ ׳™׳£ ׳”׳›׳™ ׳–׳•׳.",
          },
        },
        {
          "@type": "Question",
          name: "׳›׳׳” ׳׳₪׳©׳¨ ׳׳—׳¡׳•׳ ׳¢׳ ׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "׳׳©׳₪׳—׳” ׳׳׳•׳¦׳¢׳× ׳‘׳™׳©׳¨׳׳ ׳™׳›׳•׳׳” ׳׳—׳¡׳•׳ ׳‘׳™׳ 200 ׳-600 ׳©׳§׳׳™׳ ׳‘׳—׳•׳“׳© ׳¢׳ ׳™׳“׳™ ׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳. ׳”׳”׳₪׳¨׳© ׳‘׳™׳ ׳”׳¨׳©׳× ׳”׳™׳§׳¨׳” ׳׳–׳•׳׳” ׳¢׳ ׳¡׳ ׳§׳ ׳™׳•׳× ׳©׳‘׳•׳¢׳™ ׳™׳›׳•׳ ׳׳”׳’׳™׳¢ ׳-30%.",
          },
        },
        {
          "@type": "Question",
          name: "׳׳™׳׳• ׳¨׳©׳×׳•׳× ׳ ׳›׳׳׳•׳× ׳‘׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Savy ׳׳›׳¡׳” 29 ׳¨׳©׳×׳•׳× ׳¡׳•׳₪׳¨׳׳¨׳§׳˜ ׳‘׳™׳©׳¨׳׳: ׳©׳•׳₪׳¨׳¡׳, ׳¨׳׳™ ׳׳•׳™, ׳•׳™׳§׳˜׳•׳¨׳™, ׳׳’׳”, ׳™׳™׳ ׳•׳× ׳‘׳™׳×׳, AM:PM, ׳₪׳¨׳© ׳׳¨׳§׳˜, ׳˜׳™׳‘ ׳˜׳¢׳ ׳•׳¢׳•׳“.",
          },
        },
        {
          "@type": "Question",
          name: "׳”׳׳ ׳›׳׳™ ׳”׳©׳•׳•׳׳× ׳”׳׳—׳™׳¨׳™׳ ׳׳–׳•׳ ׳‘׳—׳™׳ ׳?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "׳›׳, Savy ׳”׳•׳ ׳›׳׳™ ׳—׳™׳ ׳׳™ ׳׳—׳׳•׳˜׳™׳. ׳׳™׳ ׳¦׳•׳¨׳ ׳‘׳”׳¨׳©׳׳”, ׳”׳•׳¨׳“׳× ׳׳₪׳׳™׳§׳¦׳™׳”, ׳׳• ׳×׳©׳׳•׳ ׳›׳׳©׳”׳•.",
          },
        },
        {
          "@type": "Question",
          name: "׳¢׳“ ׳›׳׳” ׳”׳׳—׳™׳¨׳™׳ ׳׳¢׳•׳“׳›׳ ׳™׳?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Savy ׳׳¢׳“׳›׳ ׳׳—׳™׳¨׳™׳ ׳™׳©׳™׳¨׳•׳× ׳׳׳׳’׳¨׳™ ׳”׳¨׳©׳×׳•׳× ׳‘׳×׳“׳™׳¨׳•׳× ׳’׳‘׳•׳”׳”. ׳”׳׳—׳™׳¨׳™׳ ׳׳©׳§׳₪׳™׳ ׳׳× ׳”׳׳—׳™׳¨׳™׳ ׳”׳ ׳•׳›׳—׳™׳™׳ ׳‘׳¡׳ ׳™׳₪׳™׳, ׳›׳•׳׳ ׳׳‘׳¦׳¢׳™׳.",
          },
        },
      ],
    },
    {
      "@type": "SoftwareApplication",
      name: "Savy ג€“ ׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™ ׳¡׳•׳₪׳¨׳׳¨׳§׳˜",
      applicationCategory: "ShoppingApplication",
      operatingSystem: "Web, iOS, Android",
      offers: { "@type": "Offer", price: "0", priceCurrency: "ILS" },
      url: "https://savy.co.il",
      description: "׳›׳׳™ ׳—׳™׳ ׳׳™ ׳׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳ ׳‘׳™׳ 29 ׳¨׳©׳×׳•׳× ׳¡׳•׳₪׳¨׳׳¨׳§׳˜ ׳‘׳™׳©׳¨׳׳.",
    },
  ],
};

// ג”€ג”€ג”€ Data ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
const chainComparisons = [
  { chain: "׳©׳•׳₪׳¨׳¡׳ ׳“׳™׳", avgIndex: 100, color: "bg-red-100 text-red-700" },
  { chain: "׳•׳™׳§׳˜׳•׳¨׳™", avgIndex: 97, color: "bg-emerald-100 text-emerald-700" },
  { chain: "׳¨׳׳™ ׳׳•׳™", avgIndex: 93, color: "bg-blue-100 text-blue-700" },
  { chain: "׳™׳™׳ ׳•׳× ׳‘׳™׳×׳", avgIndex: 102, color: "bg-purple-100 text-purple-700" },
  { chain: "׳׳’׳”", avgIndex: 105, color: "bg-orange-100 text-orange-700" },
  { chain: "׳˜׳™׳‘ ׳˜׳¢׳", avgIndex: 91, color: "bg-teal-100 text-teal-700" },
];

const savingsExamples = [
  { product: '׳—׳׳‘ ׳×׳ ׳•׳‘׳” 3% 1 ׳׳™׳˜׳¨', min: 5.9, max: 8.9, saving: 3.0 },
  { product: '׳׳—׳ ׳׳—׳™׳“ ׳₪׳¨׳•׳¡', min: 5.2, max: 7.8, saving: 2.6 },
  { product: '׳©׳׳ ׳–׳™׳× 750 ׳"׳', min: 28.9, max: 44.9, saving: 16.0 },
  { product: '׳¢׳•׳£ ׳©׳׳ (׳§׳’)', min: 18.9, max: 28.9, saving: 10.0 },
  { product: '׳‘׳™׳¦׳™׳ L ֳ— 12', min: 14.9, max: 21.9, saving: 7.0 },
  { product: '׳’׳‘׳™׳ ׳” ׳¦׳”׳•׳‘׳” 200 ׳’׳¨׳', min: 9.9, max: 15.9, saving: 6.0 },
];

const tips = [
  {
    icon: "נ›’",
    title: "׳‘׳ ׳• ׳¨׳©׳™׳׳× ׳§׳ ׳™׳•׳× ׳׳¨׳׳©",
    body: "׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳ ׳™׳¢׳™׳׳” ׳׳×׳—׳™׳׳” ׳‘׳¨׳©׳™׳׳” ׳׳׳•׳§׳“׳×. ׳¨׳©׳™׳׳” ׳©׳ 20ג€“30 ׳₪׳¨׳™׳˜׳™׳ ׳§׳‘׳•׳¢׳™׳ ׳׳׳₪׳©׳¨׳× ׳׳›׳׳™׳ ׳›׳׳• Savy ׳׳׳¦׳•׳ ׳׳× ׳”׳¡׳ ׳”׳–׳•׳ ׳‘׳™׳•׳×׳¨ ׳×׳•׳ ׳©׳ ׳™׳•׳×.",
  },
  {
    icon: "נ“",
    title: "׳”׳©׳•׳• ׳׳₪׳™ ׳׳™׳§׳•׳",
    body: "׳׳ ׳›׳ ׳”׳”׳©׳•׳•׳׳•׳× ׳©׳•׳•׳× ג€” ׳—׳©׳•׳‘ ׳׳”׳©׳•׳•׳× ׳׳—׳™׳¨׳™׳ ׳‘׳™׳ ׳¡׳ ׳™׳₪׳™׳ ׳§׳¨׳•׳‘׳™׳ ׳׳׳™׳›׳. Savy ׳׳׳×׳¨ ׳׳× ׳”׳¡׳ ׳™׳₪׳™׳ ׳”׳§׳¨׳•׳‘׳™׳ ׳•׳׳¦׳™׳’ ׳׳—׳™׳¨׳™׳ ׳׳“׳•׳™׳§׳™׳ ׳׳›׳ ׳¡׳ ׳™׳£.",
  },
  {
    icon: "נ·ן¸",
    title: "׳©׳™׳׳• ׳׳‘ ׳׳׳‘׳¦׳¢׳™׳",
    body: "׳׳‘׳¦׳¢׳™׳ ׳™׳›׳•׳׳™׳ ׳׳”׳₪׳•׳ ׳¨׳©׳× ׳™׳§׳¨׳” ׳׳–׳•׳׳” ׳‘׳™׳•׳×׳¨ ׳¢׳‘׳•׳¨ ׳₪׳¨׳™׳˜׳™׳ ׳¡׳₪׳¦׳™׳₪׳™׳™׳. Savy ׳›׳•׳׳ ׳׳—׳™׳¨׳™ ׳׳‘׳¦׳¢ ׳‘׳—׳™׳©׳•׳‘ ׳”׳¡׳ ׳•׳׳¦׳™׳™׳ ׳׳×׳™ ׳׳‘׳¦׳¢ ׳¢׳•׳׳“ ׳׳₪׳•׳’.",
  },
  {
    icon: "נ“",
    title: "׳¢׳§׳‘׳• ׳׳—׳¨ ׳׳“׳“ ׳”׳׳—׳™׳¨׳™׳",
    body: "׳׳—׳™׳¨׳™ ׳׳–׳•׳ ׳׳©׳×׳ ׳™׳ ׳×׳›׳•׳₪׳•׳× ׳‘׳™׳©׳¨׳׳. ׳׳“׳“ ׳”׳׳—׳™׳¨׳™׳ ׳©׳ Savy ׳׳׳₪׳©׳¨ ׳׳›׳ ׳׳¨׳׳•׳× ׳׳’׳׳•׳× ׳׳׳•׳¨׳ ׳–׳׳ ׳•׳׳–׳”׳•׳× ׳׳×׳™ ׳¢׳“׳™׳£ ׳׳¨׳›׳•׳© ׳₪׳¨׳™׳˜׳™׳ ׳׳¡׳•׳™׳׳™׳.",
  },
  {
    icon: "נ”„",
    title: "׳©׳§׳׳• ׳₪׳™׳¦׳•׳ ׳§׳ ׳™׳•׳×",
    body: "׳׳¢׳™׳×׳™׳ ׳ ׳™׳×׳ ׳׳—׳¡׳•׳ ׳™׳•׳×׳¨ ׳¢׳ ׳™׳“׳™ ׳§׳ ׳™׳™׳” ׳‘-2 ׳¡׳ ׳™׳₪׳™׳ ׳©׳•׳ ׳™׳. Savy ׳׳—׳©׳‘ ׳”׳׳ ׳”׳₪׳™׳¦׳•׳ ׳›׳“׳׳™ ׳׳₪׳™ ׳׳¨׳—׳§ ׳•׳׳–׳•׳¨ ׳”׳׳—׳™׳¨.",
  },
  {
    icon: "נ₪–",
    title: "׳”׳©׳×׳׳©׳• ׳‘׳‘׳•׳˜ ׳”׳˜׳׳’׳¨׳",
    body: "Savy ׳–׳׳™׳ ׳’׳ ׳“׳¨׳ Telegram Bot. ׳©׳׳—׳• ׳¨׳©׳™׳׳× ׳§׳ ׳™׳•׳× ׳™׳©׳™׳¨׳•׳× ׳‘׳¦'׳׳˜ ׳•׳§׳‘׳׳• ׳×׳•׳¦׳׳•׳× ׳”׳©׳•׳•׳׳” ׳׳™׳™׳“׳™׳× ג€” ׳‘׳׳™ ׳׳₪׳×׳•׳— ׳“׳₪׳“׳₪׳.",
  },
];

// ג”€ג”€ג”€ Component ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
export default function FoodPriceComparisonPage() {
  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main dir="rtl" className="min-h-screen bg-white pb-24">
        {/* ג”€ג”€ Hero ג”€ג”€ */}
        <section className="bg-gradient-to-b from-emerald-50 to-white py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <nav aria-label="breadcrumb" className="mb-6 text-sm text-gray-500">
              <ol className="flex justify-center gap-1">
                <li><Link href="/" className="hover:text-emerald-600">׳‘׳™׳×</Link></li>
                <li aria-hidden>/</li>
                <li className="text-gray-800 font-medium">׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳</li>
              </ol>
            </nav>

            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
              ׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳ ׳‘׳™׳{" "}
              <span className="text-emerald-600">׳›׳ ׳”׳¡׳•׳₪׳¨׳׳¨׳§׳˜׳™׳</span> ׳‘׳™׳©׳¨׳׳
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              ׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳ ׳—׳›׳׳” ׳•׳׳“׳•׳™׳§׳× ג€” ׳‘׳™׳ 29 ׳¨׳©׳×׳•׳× ׳‘׳–׳׳ ׳׳׳×.
              <br />
              ׳’׳׳• ׳‘׳“׳™׳•׳§ ׳׳™׳₪׳” ׳”׳›׳™ ׳–׳•׳ ׳׳§׳ ׳•׳× ׳׳× ׳¡׳ ׳”׳§׳ ׳™׳•׳× ׳©׳׳›׳, ׳•׳—׳¡׳›׳• ׳׳׳•׳× ׳©׳§׳׳™׳ ׳‘׳—׳•׳“׳©.
            </p>

            <Link
              href="/"
              className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white text-lg font-bold px-8 py-4 rounded-2xl shadow-lg transition-colors"
            >
              ׳”׳×׳—׳™׳׳• ׳׳”׳©׳•׳•׳× ׳׳—׳™׳¨׳™׳ ׳¢׳›׳©׳™׳• ג†
            </Link>

            <p className="mt-4 text-sm text-gray-400">
              ׳—׳™׳ ׳ ׳׳—׳׳•׳˜׳™׳ ֲ· ׳׳׳ ׳”׳•׳¨׳“׳” ֲ· ׳׳׳ ׳”׳¨׳©׳׳”
            </p>
          </div>
        </section>

        {/* ג”€ג”€ Stats Bar ג”€ג”€ */}
        <section className="bg-emerald-600 py-8 px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            {[
              { value: "29", label: "׳¨׳©׳×׳•׳× ׳¡׳•׳₪׳¨׳׳¨׳§׳˜" },
              { value: "626K+", label: "׳׳•׳¦׳¨׳™ ׳׳–׳•׳" },
              { value: "9M+", label: "׳׳—׳™׳¨׳™׳ ׳‘׳׳׳’׳¨" },
              { value: "׳¢׳“ 30%", label: "׳—׳™׳¡׳›׳•׳ ׳׳₪׳©׳¨׳™" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-black">{s.value}</div>
                <div className="text-emerald-100 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 py-12 space-y-16">

          {/* ג”€ג”€ Intro ג”€ג”€ */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ׳׳׳” ׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳ ׳—׳©׳•׳‘׳” ׳›׳ ׳›׳?
            </h2>
            <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed space-y-4">
              <p>
                ׳™׳©׳¨׳׳ ׳”׳™׳ ׳׳—׳× ׳”׳׳“׳™׳ ׳•׳× ׳¢׳ ׳™׳•׳§׳¨ ׳”׳׳—׳™׳™׳” ׳”׳’׳‘׳•׳” ׳‘׳¢׳•׳׳. ׳׳—׳™׳¨׳™ ׳”׳׳–׳•׳ ׳‘׳™׳©׳¨׳׳
                ׳’׳‘׳•׳”׳™׳ ׳׳©׳׳¢׳•׳×׳™׳× ׳׳׳“׳™׳ ׳•׳× ׳׳¢׳¨׳‘׳™׳•׳× ׳¨׳‘׳•׳× ג€” ׳•׳׳›׳{" "}
                <strong>׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳</strong> ׳”׳₪׳›׳” ׳׳›׳׳™ ׳”׳›׳¨׳—׳™ ׳¢׳‘׳•׳¨ ׳›׳ ׳׳©׳§ ׳‘׳™׳×.
              </p>
              <p>
                ׳”׳”׳₪׳¨׳© ׳‘׳™׳ ׳”׳¡׳•׳₪׳¨׳׳¨׳§׳˜ ׳”׳–׳•׳ ׳׳™׳§׳¨ ׳¢׳ ׳׳•׳×׳• ׳¡׳ ׳§׳ ׳™׳•׳× ׳™׳›׳•׳ ׳׳”׳’׳™׳¢{" "}
                <strong>׳-20%ג€“30%</strong>. ׳¢׳‘׳•׳¨ ׳׳©׳₪׳—׳” ׳©׳׳•׳¦׳™׳׳” 2,000 ג‚× ׳‘׳—׳•׳“׳© ׳¢׳ ׳׳–׳•׳,
                ׳׳“׳•׳‘׳¨ ׳‘-<strong>400ג€“600 ג‚× ׳—׳™׳¡׳›׳•׳ ׳—׳•׳“׳©׳™</strong> ג€” ׳׳•{" "}
                <strong>׳›-7,000 ג‚× ׳‘׳©׳ ׳”</strong>.
              </p>
              <p>
                ׳”׳‘׳¢׳™׳”? ׳¢׳“ ׳׳׳—׳¨׳•׳ ׳”, ׳׳ ׳”׳™׳™׳×׳” ׳“׳¨׳ ׳ ׳•׳—׳” ׳׳¢׳©׳•׳× ׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳ ׳׳§׳™׳₪׳”
                ׳‘׳™׳ ׳›׳ ׳”׳¨׳©׳×׳•׳×. <strong>Savy</strong> ׳₪׳•׳×׳¨׳× ׳‘׳“׳™׳•׳§ ׳׳× ׳”׳‘׳¢׳™׳” ׳”׳–׳• ג€” ׳•׳׳׳₪׳©׳¨׳×
                ׳׳”׳©׳•׳•׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳ ׳‘׳™׳ 29 ׳¨׳©׳×׳•׳× ׳×׳•׳ ׳©׳ ׳™׳•׳×, ׳‘׳—׳™׳ ׳.
              </p>
            </div>
          </section>

          {/* ג”€ג”€ Price Table ג”€ג”€ */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳: ׳“׳•׳’׳׳׳•׳× ׳׳•׳¦׳¨׳™׳ ׳ ׳₪׳•׳¦׳™׳
            </h2>
            <p className="text-gray-500 mb-6 text-sm">
              ׳”׳”׳₪׳¨׳©׳™׳ ׳׳”׳׳ ׳׳‘׳•׳¡׳¡׳™׳ ׳¢׳ ׳ ׳×׳•׳ ׳™ ׳׳—׳™׳¨׳™׳ ׳׳׳™׳×׳™׳™׳ ׳׳׳׳’׳¨ Savy (2026)
            </p>
            <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-right">
                    <th className="px-4 py-3 font-semibold">׳׳•׳¦׳¨</th>
                    <th className="px-4 py-3 font-semibold text-center">׳׳—׳™׳¨ ׳׳™׳ ׳³</th>
                    <th className="px-4 py-3 font-semibold text-center">׳׳—׳™׳¨ ׳׳§׳¡׳³</th>
                    <th className="px-4 py-3 font-semibold text-center text-emerald-700">׳—׳™׳¡׳›׳•׳ ׳׳₪׳©׳¨׳™</th>
                  </tr>
                </thead>
                <tbody>
                  {savingsExamples.map((row, i) => (
                    <tr key={row.product} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-3 font-medium text-gray-800">{row.product}</td>
                      <td className="px-4 py-3 text-center text-emerald-700 font-bold">ג‚×{row.min.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center text-gray-500">ג‚×{row.max.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          ג‚×{row.saving.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              * ׳׳—׳™׳¨׳™׳ ׳׳“׳•׳’׳׳”. ׳™׳™׳×׳›׳ ׳• ׳©׳™׳ ׳•׳™׳™׳ ׳‘׳”׳×׳׳ ׳׳¡׳ ׳™׳£ ׳•׳×׳׳¨׳™׳. ׳׳‘׳“׳™׳§׳” ׳׳“׳•׳™׳§׳× ג€” ׳”׳©׳×׳׳©׳• ׳‘-Savy.
            </p>
          </section>

          {/* ג”€ג”€ How Savy Works ג”€ג”€ */}
          <section className="bg-emerald-50 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ׳׳™׳ Savy ׳¢׳•׳©׳” ׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳?
            </h2>
            <p className="text-gray-600 mb-6">
              Savy ׳”׳•׳ ׳›׳׳™ ׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳ ׳”׳—׳™׳ ׳׳™ ׳•׳”׳׳§׳™׳£ ׳‘׳™׳•׳×׳¨ ׳‘׳™׳©׳¨׳׳. ׳”׳ ׳” ׳׳™׳ ׳”׳•׳ ׳¢׳•׳‘׳“:
            </p>
            <ol className="space-y-5">
              {[
                {
                  n: "1",
                  title: "׳”׳›׳ ׳™׳¡׳• ׳¨׳©׳™׳׳× ׳§׳ ׳™׳•׳×",
                  desc: "׳”׳§׳׳™׳“׳• ׳׳× ׳”׳׳•׳¦׳¨׳™׳ ׳©׳׳×׳ ׳¦׳¨׳™׳›׳™׳ ג€” ׳—׳׳‘, ׳׳—׳, ׳™׳¨׳§׳•׳×, ׳‘׳©׳¨, ׳›׳ ׳׳” ׳©׳¨׳•׳¦׳™׳. Savy ׳׳–׳”׳” ׳׳•׳¦׳¨׳™׳ ׳‘׳©׳׳•׳× ׳—׳•׳₪׳©׳™׳™׳ ׳•׳‘׳׳™ ׳¦׳•׳¨׳ ׳‘׳‘׳¨׳§׳•׳“.",
                },
                {
                  n: "2",
                  title: "Savy ׳¡׳•׳¨׳§׳× 29 ׳¨׳©׳×׳•׳×",
                  desc: "׳”׳׳׳’׳•׳¨׳™׳×׳ ׳׳—׳₪׳© ׳׳× ׳›׳ ׳”׳׳•׳¦׳¨׳™׳ ׳‘׳›׳ ׳¨׳©׳× ׳•׳¡׳ ׳™׳£ ׳”׳§׳¨׳•׳‘ ׳׳׳™׳›׳, ׳•׳׳—׳©׳‘ ׳׳× ׳׳—׳™׳¨ ׳”׳¡׳ ׳”׳›׳•׳׳ ׳׳›׳ ׳׳₪׳©׳¨׳•׳×.",
                },
                {
                  n: "3",
                  title: "׳§׳‘׳׳• ׳×׳•׳¦׳׳•׳× ׳׳™׳™׳“׳™׳•׳×",
                  desc: "׳×׳¨׳׳• ׳‘׳“׳™׳•׳§ ׳›׳׳” ׳×׳©׳׳׳• ׳‘׳›׳ ׳¨׳©׳×, ׳•׳׳™׳₪׳” ׳”׳›׳™ ׳–׳•׳ ׳׳§׳ ׳•׳× ׳׳× ׳›׳ ׳”׳¨׳©׳™׳׳”. ׳›׳•׳׳ ׳₪׳™׳¨׳•׳˜ ׳׳—׳™׳¨ ׳׳₪׳¨׳™׳˜.",
                },
                {
                  n: "4",
                  title: "׳—׳¡׳›׳• ׳›׳¡׳£ ׳‘׳›׳ ׳§׳ ׳™׳™׳”",
                  desc: "׳‘׳—׳¨׳• ׳׳× ׳”׳¡׳•׳₪׳¨׳׳¨׳§׳˜ ׳”׳–׳•׳ ׳‘׳™׳•׳×׳¨ ׳¢׳‘׳•׳¨׳›׳, ׳•׳׳›׳• ׳׳§׳ ׳•׳× ג€” ׳™׳“׳¢ ׳©׳—׳¡׳ ׳׳›׳ ׳›׳¡׳£ ׳׳׳™׳×׳™.",
                },
              ].map((step) => (
                <li key={step.n} className="flex gap-4">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center text-sm">
                    {step.n}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{step.title}</div>
                    <div className="text-gray-600 text-sm mt-0.5">{step.desc}</div>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-8 text-center">
              <Link
                href="/"
                className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
              >
                ׳ ׳¡׳• ׳׳× Savy ׳¢׳›׳©׳™׳• ג€” ׳—׳™׳ ׳
              </Link>
            </div>
          </section>

          {/* ג”€ג”€ Chain Index ג”€ג”€ */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ׳׳“׳“ ׳׳—׳™׳¨׳™ ׳׳–׳•׳ ׳׳₪׳™ ׳¨׳©׳× ׳¡׳•׳₪׳¨׳׳¨׳§׳˜
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              ׳׳“׳“ ׳™׳—׳¡׳™ ג€” 100 = ׳©׳•׳₪׳¨׳¡׳ ׳“׳™׳. ׳׳×׳‘׳¡׳¡ ׳¢׳ ׳¡׳ ׳§׳ ׳™׳•׳× ׳™׳™׳¦׳•׳’׳™ ׳©׳ 50 ׳׳•׳¦׳¨׳™׳ ׳ ׳₪׳•׳¦׳™׳.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {chainComparisons.map((c) => (
                <div key={c.chain} className="rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                  <div className="font-bold text-gray-800 mb-2">{c.chain}</div>
                  <div className={`text-2xl font-black ${c.color} rounded-xl py-1`}>
                    {c.avgIndex}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">׳׳“׳“ ׳׳—׳™׳¨ ׳™׳—׳¡׳™</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">
              ׳׳ ׳×׳•׳ ׳™׳ ׳׳“׳•׳™׳§׳™׳ ׳•׳׳¢׳•׳“׳›׳ ׳™׳ ג†{" "}
              <Link href="/price-index" className="text-emerald-600 underline">
                ׳׳“׳“ ׳”׳׳—׳™׳¨׳™׳ ׳©׳ Savy
              </Link>
            </p>
          </section>

          {/* ג”€ג”€ Tips ג”€ג”€ */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              6 ׳˜׳™׳₪׳™׳ ׳׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳ ׳—׳›׳׳”
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              {tips.map((tip) => (
                <div key={tip.title} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <div className="text-2xl mb-2">{tip.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-1">{tip.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{tip.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ג”€ג”€ Why Savy ג”€ג”€ */}
          <section className="bg-gray-900 rounded-3xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">
              ׳׳׳” Savy ׳”׳™׳ ׳”׳₪׳×׳¨׳•׳ ׳”׳˜׳•׳‘ ׳‘׳™׳•׳×׳¨ ׳׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳?
            </h2>
            <ul className="space-y-4">
              {[
                {
                  icon: "ג…",
                  title: "׳›׳™׳¡׳•׳™ ׳׳׳ ג€” 29 ׳¨׳©׳×׳•׳×",
                  desc: "Savy ׳׳›׳¡׳” ׳™׳•׳×׳¨ ׳¨׳©׳×׳•׳× ׳׳›׳ ׳©׳™׳¨׳•׳× ׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳—׳¨ ׳‘׳™׳©׳¨׳׳. ׳©׳•׳₪׳¨׳¡׳, ׳¨׳׳™ ׳׳•׳™, ׳•׳™׳§׳˜׳•׳¨׳™, ׳׳’׳”, ׳™׳™׳ ׳•׳× ׳‘׳™׳×׳, AM:PM, ׳˜׳™׳‘ ׳˜׳¢׳ ׳•׳¢׳•׳“.",
                },
                {
                  icon: "ג¡",
                  title: "׳×׳•׳¦׳׳•׳× ׳‘׳–׳׳ ׳׳׳×",
                  desc: "׳”׳׳—׳™׳¨׳™׳ ׳׳×׳¢׳“׳›׳ ׳™׳ ׳™׳©׳™׳¨׳•׳× ׳׳׳׳’׳¨׳™ ׳”׳¨׳©׳×׳•׳×. ׳׳×׳ ׳¨׳•׳׳™׳ ׳׳× ׳”׳׳—׳™׳¨ ׳©׳׳×׳ ׳™׳©׳׳׳• ׳‘-checkout ג€” ׳׳ ׳׳—׳™׳¨ ׳׳™׳•׳©׳ ׳׳׳™׳–׳” ׳§׳•׳‘׳¥.",
                },
                {
                  icon: "נ“",
                  title: "׳׳₪׳™ ׳׳™׳§׳•׳",
                  desc: "׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳ ׳׳₪׳™ ׳”׳¡׳ ׳™׳£ ׳”׳§׳¨׳•׳‘ ׳׳׳™׳›׳, ׳׳ ׳׳׳•׳¦׳¢ ׳׳¨׳¦׳™ ׳©׳׳ ׳¨׳׳•׳•׳ ׳˜׳™ ׳׳—׳™׳™׳›׳.",
                },
                {
                  icon: "נ†“",
                  title: "׳—׳™׳ ׳׳™ ׳׳’׳׳¨׳™",
                  desc: "׳׳™׳ ׳׳ ׳•׳™׳™׳, ׳׳™׳ ׳₪׳¨׳¡׳•׳׳•׳×, ׳׳™׳ ׳׳›׳™׳¨׳× ׳ ׳×׳•׳ ׳™׳. Savy ׳—׳™׳ ׳׳™ ׳›׳™ ׳׳ ׳—׳ ׳• ׳׳׳׳™׳ ׳™׳ ׳©׳”׳׳™׳“׳¢ ׳”׳–׳” ׳¦׳¨׳™׳ ׳׳”׳™׳•׳× ׳ ׳’׳™׳© ׳׳›׳•׳׳.",
                },
                {
                  icon: "נ₪–",
                  title: "AI-Friendly",
                  desc: "׳¢׳•׳‘׳“ ׳’׳ ׳“׳¨׳ Telegram Bot ג€” ׳©׳׳—׳• ׳¨׳©׳™׳׳× ׳§׳ ׳™׳•׳× ׳‘׳©׳₪׳” ׳—׳•׳₪׳©׳™׳×, ׳§׳‘׳׳• ׳×׳•׳¦׳׳•׳× ׳׳™׳™׳“׳™׳×.",
                },
              ].map((f) => (
                <li key={f.title} className="flex gap-4">
                  <span className="text-2xl flex-shrink-0">{f.icon}</span>
                  <div>
                    <div className="font-bold text-emerald-400">{f.title}</div>
                    <div className="text-gray-300 text-sm mt-0.5">{f.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* ג”€ג”€ FAQ ג”€ג”€ */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              ׳©׳׳׳•׳× ׳ ׳₪׳•׳¦׳•׳× ׳¢׳ ׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳
            </h2>
            <div className="space-y-5">
              {(jsonLd["@graph"][2] as any).mainEntity.map(
                (q: { name: string; acceptedAnswer: { text: string } }) => (
                  <details
                    key={q.name}
                    className="group bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden"
                  >
                    <summary className="cursor-pointer font-bold text-gray-900 p-5 list-none flex justify-between items-center">
                      {q.name}
                      <span className="text-emerald-500 font-normal text-xl group-open:rotate-45 transition-transform">
                        +
                      </span>
                    </summary>
                    <p className="px-5 pb-5 text-gray-600 text-sm leading-relaxed">
                      {q.acceptedAnswer.text}
                    </p>
                  </details>
                )
              )}
            </div>
          </section>

          {/* ג”€ג”€ Internal Links ג”€ג”€ */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              ׳›׳׳™׳ ׳ ׳•׳¡׳₪׳™׳ ׳׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™ ׳׳–׳•׳
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { href: "/price-index", label: "׳׳“׳“ ׳׳—׳™׳¨׳™׳", desc: "׳”׳©׳•׳•׳׳” ׳›׳׳›׳׳™׳× ׳‘׳™׳ ׳¨׳©׳×׳•׳× ׳׳׳•׳¨׳ ׳–׳׳" },
                { href: "/deals", label: "׳׳‘׳¦׳¢׳™׳", desc: "׳׳‘׳¦׳¢׳™ ׳׳–׳•׳ ׳¢׳“׳›׳ ׳™׳™׳ ׳‘׳›׳ ׳”׳¨׳©׳×׳•׳×" },
                { href: "/produce", label: "׳™׳¨׳§׳•׳× ׳•׳₪׳™׳¨׳•׳×", desc: "׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™ ׳×׳•׳¦׳¨׳× ׳˜׳¨׳™׳™׳”" },
                { href: "/supermarkets", label: "׳›׳ ׳”׳¨׳©׳×׳•׳×", desc: "׳₪׳¨׳˜׳™׳ ׳•׳׳—׳™׳¨׳™׳ ׳׳₪׳™ ׳¨׳©׳×" },
                { href: "/guide", label: "׳׳“׳¨׳™׳ ׳—׳™׳¡׳›׳•׳", desc: "׳”׳׳“׳¨׳™׳ ׳”׳׳׳ ׳׳—׳™׳¡׳›׳•׳ ׳‘׳§׳ ׳™׳•׳×" },
                { href: "/receipt", label: "׳¡׳¨׳™׳§׳× ׳§׳‘׳׳”", desc: "׳”׳¢׳׳• ׳§׳‘׳׳” ׳•׳§׳‘׳׳• ׳”׳©׳•׳•׳׳” ׳׳™׳™׳“׳™׳×" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-start gap-3 bg-white border border-gray-200 rounded-2xl p-4 hover:border-emerald-300 hover:shadow-sm transition-all"
                >
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{link.label}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{link.desc}</div>
                  </div>
                  <span className="mr-auto text-emerald-500 text-lg">ג†</span>
                </Link>
              ))}
            </div>
          </section>

          {/* ג”€ג”€ Final CTA ג”€ג”€ */}
          <section className="bg-emerald-500 rounded-3xl p-10 text-center text-white">
            <h2 className="text-3xl font-black mb-3">
              ׳׳•׳›׳ ׳™׳ ׳׳¢׳©׳•׳× ׳”׳©׳•׳•׳׳× ׳׳—׳™׳¨׳™׳ ׳׳–׳•׳ ׳׳׳™׳×׳™׳×?
            </h2>
            <p className="text-emerald-50 mb-8 text-lg">
              ׳”׳›׳ ׳™׳¡׳• ׳¨׳©׳™׳׳× ׳§׳ ׳™׳•׳×, ׳•-Savy ׳×׳׳¦׳ ׳׳× ׳”׳¡׳•׳₪׳¨׳׳¨׳§׳˜ ׳”׳–׳•׳ ׳‘׳™׳•׳×׳¨ ׳¢׳‘׳•׳¨׳›׳ ג€” ׳×׳•׳ ׳©׳ ׳™׳•׳×.
            </p>
            <Link
              href="/"
              className="inline-block bg-white text-emerald-700 font-extrabold text-lg px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              ׳”׳×׳—׳™׳׳• ׳¢׳›׳©׳™׳• ג€” ׳–׳” ׳—׳™׳ ׳ ג†
            </Link>
          </section>

        </div>
      </main>
    </>
  );
}
