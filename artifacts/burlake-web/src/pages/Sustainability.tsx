import React from 'react';
import { Droplets, Recycle, Leaf, Cpu } from 'lucide-react';
import { Link } from 'wouter';
import { Seo, JsonLd } from '@/components/Seo';
import { absoluteUrl } from '@/lib/seo';

interface Practice {
  icon: React.ReactNode;
  title: string;
  paragraphs: string[];
}

const PRACTICES: Practice[] = [
  {
    icon: <Droplets size={20} />,
    title: 'Water Recycling',
    paragraphs: [
      'Much of our facility recaptures irrigation water instead of losing it. Before reuse, it\u2019s filtered, pH-balanced, and stored on-site until it\u2019s cycled back into our irrigation system — cutting both water and fertilizer use significantly.',
    ],
  },
  {
    icon: <Recycle size={20} />,
    title: 'Pot Sterilizing',
    paragraphs: [
      'Every season leaves us with tens of thousands of empty pots. Natural materials are composted; intact plastic pots are steam-sterilized and reused for new crops — a major reduction in plastic waste.',
    ],
  },
  {
    icon: <Leaf size={20} />,
    title: 'Biodegradable & Recycled Materials',
    paragraphs: [
      'Where we can, we swap plastic for cardboard (recycled in-house), paper shipping sleeves, bamboo stakes, and paperboard care labels. Since paperboard labels break down in wet soil, remove and trim them if you\u2019d like to keep them intact.',
    ],
  },
  {
    icon: <Cpu size={20} />,
    title: 'Technology & Efficiency',
    paragraphs: [
      'Eight natural gas boilers heat our facility as needed, and roof-level shade and blackout curtains manage light and retain heat — reducing how often the boilers have to run.',
      'We\u2019ve long led on growing technology: high-intensity lighting in the late 1970s, computerized environmental controls in the early 1980s, and one of North America\u2019s first Dutch rolling palletized benching systems — which also enabled sub-irrigation, watering crops from below to cut water, fertilizer, and chemical use.',
    ],
  },
];

export default function Sustainability() {
  return (
    <div className="bg-background pt-32 pb-24 min-h-screen">
      <Seo
        title="Growing Green — Sustainability Practices"
        description="Water recycling, pot sterilizing, biodegradable materials, and efficient greenhouse technology — how Burnaby Lake Greenhouses reduces its environmental footprint while growing at scale."
        path="/sustainability"
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
            { '@type': 'ListItem', position: 2, name: 'Growing Green', item: absoluteUrl('/sustainability') },
          ],
        }}
      />
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
          <span className="inline-flex items-center gap-3 text-primary tracking-[0.2em] text-sm uppercase mb-4 font-semibold justify-center">
            <div className="w-8 h-px bg-primary" />
            Growing Green
            <div className="w-8 h-px bg-primary" />
          </span>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground leading-[1.1] mb-6">
            Scaled Production. <span className="italic font-light">Smaller Footprint.</span>
          </h1>
          <p className="text-muted-foreground text-lg font-light leading-relaxed max-w-2xl mx-auto">
            We're always pursuing ways to increase our product output while maintaining our
            standard of quality — all while striving to minimize our environmental impact. This
            is why we pair state-of-the-art technology with policies that matter.
          </p>
        </div>

        {/* Pull quote */}
        <div className="mb-20 border-y border-border py-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="font-serif text-2xl md:text-3xl text-foreground italic leading-snug max-w-3xl mx-auto">
            "As owners, we make a point to work hands-on in every aspect of our company to ensure
            that our premium quality and service is being maintained for our customers."
          </p>
        </div>

        {/* Innovation & Sustainability intro */}
        <div className="mb-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="inline-flex items-center gap-3 text-primary tracking-[0.2em] text-sm uppercase mb-4 font-semibold justify-center">
            <div className="w-8 h-px bg-primary" />
            Innovation &amp; Sustainability
            <div className="w-8 h-px bg-primary" />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-foreground leading-[1.1] mb-6">
            Efficiency and environmental care, built into how we grow.
          </h2>
          <p className="text-muted-foreground text-lg font-light leading-relaxed max-w-2xl mx-auto">
            Innovation and sustainability go hand in hand at Burnaby Lake. From recaptured
            irrigation water to reused pots and heat-retaining greenhouse technology, every
            system is fine-tuned to reduce waste and make the most of every resource — without
            compromising the quality standard our retail partners depend on.
          </p>
        </div>

        {/* Practices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          {PRACTICES.map((practice, i) => (
            <div
              key={practice.title}
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 bg-secondary/[0.03] border border-border p-8 md:p-10"
              style={{ animationDelay: `${i * 75}ms` }}
            >
              <div className="w-12 h-12 rounded-full bg-secondary/5 flex items-center justify-center text-primary shrink-0 mb-5">
                {practice.icon}
              </div>
              <h3 className="font-serif text-2xl text-foreground mb-4">
                {practice.title}
              </h3>
              <div className="space-y-4">
                {practice.paragraphs.map((p, j) => (
                  <p key={j} className="text-muted-foreground font-light leading-relaxed text-sm">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-24 text-center bg-secondary p-12 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <h3 className="font-serif text-3xl text-secondary-foreground mb-4 relative z-10">
            Grown at Scale. <span className="italic font-light">Quality Guaranteed.</span>
          </h3>
          <p className="text-secondary-foreground/70 font-light max-w-xl mx-auto mb-8 relative z-10">
            Explore our current catalog or apply for a wholesale account to see the same standard
            of quality — and care — that's behind everything we grow.
          </p>
          <div className="flex items-center justify-center gap-6 relative z-10">
            <Link
              href="/catalog"
              className="text-sm font-semibold tracking-wider uppercase text-primary hover:text-primary/80 transition-colors border-b border-primary/30 hover:border-primary pb-1"
            >
              View Catalog
            </Link>
            <Link
              href="/contact"
              className="text-sm font-semibold tracking-wider uppercase text-secondary-foreground/80 hover:text-secondary-foreground transition-colors border-b border-secondary-foreground/20 hover:border-secondary-foreground/60 pb-1"
            >
              Apply for an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
