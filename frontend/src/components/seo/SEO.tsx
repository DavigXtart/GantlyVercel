import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const SITE_URL = 'https://gantly.es';
const SITE_NAME = 'Gantly';
const DEFAULT_OG_IMAGE = `${SITE_URL}/iconoGantly.png`;
const TWITTER_HANDLE = '@gantly_es';

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export default function SEO({
  title,
  description,
  path = '',
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noindex = false,
  jsonLd,
}: SEOProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'es';
  const canonicalUrl = `${SITE_URL}${path}`;
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Encuentra tu psicólogo ideal`;

  return (
    <Helmet>
      <html lang={lang} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={lang === 'en' ? 'en_US' : 'es_ES'} />
      <meta property="og:locale:alternate" content={lang === 'en' ? 'es_ES' : 'en_US'} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={fullTitle} />

      {/* Hreflang */}
      <link rel="alternate" hrefLang="es" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(jsonLd) ? jsonLd : jsonLd)}
        </script>
      )}
    </Helmet>
  );
}

// Pre-built JSON-LD schemas
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Gantly',
  url: SITE_URL,
  logo: `${SITE_URL}/logo-gantly-double.svg`,
  description: 'Plataforma de salud mental que conecta pacientes con psicólogos mediante matching clínico personalizado.',
  foundingDate: '2026',
  sameAs: [
    'https://linkedin.com/company/gantly',
    'https://twitter.com/gantly_es',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    email: 'info@gantly.es',
    availableLanguage: ['Spanish', 'English'],
  },
};

export const medicalBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  name: 'Gantly',
  url: SITE_URL,
  description: 'Plataforma digital de salud mental con matching inteligente psicólogo-paciente.',
  medicalSpecialty: 'Psychiatric',
  availableService: [
    {
      '@type': 'MedicalTherapy',
      name: 'Terapia psicológica online',
      description: 'Sesiones de terapia por videollamada con psicólogos verificados.',
    },
    {
      '@type': 'MedicalTest',
      name: 'Tests clínicos validados',
      description: 'Tests de personalidad (16PF), competencias académicas (TCA) y ansiedad.',
    },
  ],
  areaServed: {
    '@type': 'Country',
    name: 'Spain',
  },
};

export const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Gantly',
  url: SITE_URL,
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Registro gratuito para pacientes. Planes de suscripción para profesionales.',
  },
  featureList: [
    'Matching inteligente psicólogo-paciente',
    'Tests clínicos validados (16PF, TCA, Ansiedad)',
    'Videollamadas HD cifradas',
    'Chat seguro con cifrado AES-256',
    'Agenda inteligente con reserva online',
    'Facturación automática con IVA',
    'ERP para clínicas de salud mental',
  ],
};

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Qué es Gantly?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Gantly es una plataforma de salud mental que conecta pacientes con psicólogos verificados mediante un sistema de matching inteligente basado en tests clínicos validados.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cómo funciona el matching con psicólogos?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Completando un test de personalidad validado clínicamente (16PF), nuestro algoritmo analiza 16 factores de personalidad para encontrar al psicólogo más compatible contigo.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Es seguro usar Gantly?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. Gantly cumple con el RGPD, usa cifrado AES-256 para todas las comunicaciones, encripta los datos de salud a nivel de campo y todos los psicólogos pasan un proceso de verificación.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuánto cuesta una sesión de terapia?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El registro es gratuito para pacientes. El precio de las sesiones lo establece cada psicólogo. Los pagos se procesan de forma segura con Stripe.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué tests clínicos están disponibles?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Disponemos de tests clínicos validados como el 16PF (personalidad), TCA (competencias académicas), y tests de ansiedad, todos con informes detallados y visualización de resultados.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Puedo gestionar mi clínica con Gantly?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. Gantly incluye un ERP completo para clínicas con gestión de equipo, agenda centralizada, facturación con IVA, chat clínica-paciente, lista de espera y página pública con reserva online.',
      },
    },
  ],
};

export const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Gantly',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web',
  url: SITE_URL,
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '150',
    bestRating: '5',
    worstRating: '1',
  },
};
