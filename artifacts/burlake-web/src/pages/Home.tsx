import React, { useEffect } from 'react';
import { Link } from 'wouter';
import { ArrowRight, MapPin, Phone, CheckCircle2, Leaf, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Seo, JsonLd } from '@/components/Seo';
import { absoluteUrl } from '@/lib/seo';

function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    const elements = document.querySelectorAll('.reveal');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}

export default function Homepage() {
  useReveal();

  return (
    <div className="overflow-x-hidden">
      <Seo
        title="Burnaby Lake Greenhouses"
        description="Western Canada's leading wholesale grower of indoor potted flowering plants and tropical foliage since 1955. Four generations of growing expertise, 1.3M+ sq ft under glass — supplying florists, grocers, and garden centers at scale."
        path="/"
        image="/images/hero-greenhouse.jpg"
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Burnaby Lake Greenhouses',
          alternateName: 'Burnaby Lake Greenhouses Ltd.',
          url: absoluteUrl('/'),
          logo: absoluteUrl('/images/logo-horizontal.jpg'),
          foundingDate: '1955',
          description:
            "Western Canada's leading wholesale grower of indoor potted flowering plants and tropical foliage, supplying retail trade partners at scale since 1955.",
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Surrey',
            addressRegion: 'BC',
            addressCountry: 'CA',
          },
          areaServed: 'Western Canada',
          slogan: 'Grown at Scale. Rooted in Tradition.',
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Burnaby Lake Greenhouses',
          url: absoluteUrl('/'),
          potentialAction: {
            '@type': 'SearchAction',
            target: `${absoluteUrl('/catalog')}?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      {/* Hero Section */}
      <section className="relative h-[100dvh] min-h-[700px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-secondary">
          <img 
            src="/images/hero-greenhouse.jpg" 
            alt="Inside Burnaby Lake Greenhouses" 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 golden-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-secondary via-transparent to-transparent opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full text-center mt-20">
          <span className="reveal inline-block font-sans text-primary tracking-[0.2em] text-sm uppercase mb-6 font-semibold">
            Since 1955
          </span>
          <h1 className="reveal delay-100 font-serif text-5xl md:text-7xl lg:text-8xl text-background leading-[1.1] mb-8 max-w-5xl mx-auto">
            Grown at Scale. <br/>
            <span className="italic font-light opacity-90">Rooted in Tradition.</span>
          </h1>
          <p className="reveal delay-200 text-lg md:text-xl text-background/80 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            Indoor potted flowering plants and tropical foliage are our core strength — grown to a consistent standard, at the scale your business demands.
          </p>
          <div className="reveal delay-300 flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/contact" className="w-full sm:w-auto">
              <Button size="lg" className="w-full">
                Apply for Account <ArrowRight className="ml-2" />
              </Button>
            </Link>
            <Link href="/catalog" className="w-full sm:w-auto">
              <Button variant="outline-light" size="lg" className="w-full">
                Explore Catalog
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Scale/Stats Bar */}
      <section className="bg-secondary border-t border-white/5 relative z-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 border-x border-white/5">
            <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/5 text-center reveal">
              <div className="text-4xl md:text-5xl font-serif text-primary mb-2">1.3M<span className="text-2xl">+</span></div>
              <div className="text-xs tracking-widest uppercase text-white/50">Sq Ft Greenhouse Space</div>
            </div>
            <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/5 text-center reveal delay-100">
              <div className="text-4xl md:text-5xl font-serif text-primary mb-2">100<span className="text-2xl">+</span></div>
              <div className="text-xs tracking-widest uppercase text-white/50">Acres of Growing Area</div>
            </div>
            <div className="p-8 md:p-12 border-r border-white/5 text-center reveal delay-200">
              <div className="text-4xl md:text-5xl font-serif text-primary mb-2">200<span className="text-2xl">+</span></div>
              <div className="text-xs tracking-widest uppercase text-white/50">Full-Time Staff</div>
            </div>
            <div className="p-8 md:p-12 text-center reveal delay-300">
              <div className="text-4xl md:text-5xl font-serif text-primary mb-2">65<span className="text-2xl">+</span></div>
              <div className="text-xs tracking-widest uppercase text-white/50">Years of Growing Expertise</div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 md:py-32 relative bg-background">
        <div className="absolute inset-0 pointer-events-none flex justify-center opacity-[0.03]">
          <div className="w-px h-full bg-secondary" />
          <div className="w-1/3 h-full border-x border-secondary" />
          <div className="w-px h-full bg-secondary" />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">
            <div className="lg:col-span-5 reveal">
              <div className="relative">
                <div className="absolute -inset-4 border border-secondary/20 translate-x-4 translate-y-4" />
                <img 
                  src="/images/about-generations.jpg" 
                  alt="Generations of Burnaby Lake Growers" 
                  className="relative z-10 w-full h-[600px] object-cover grayscale-[0.2] contrast-125"
                />
              </div>
            </div>
            <div className="lg:col-span-7 lg:pl-10">
              <span className="reveal inline-flex items-center gap-3 text-primary tracking-[0.2em] text-sm uppercase mb-6 font-semibold">
                <div className="w-8 h-px bg-primary" />
                Our Story
              </span>
              <h2 className="reveal delay-100 font-serif text-4xl md:text-5xl lg:text-6xl text-secondary leading-[1.1] mb-8">
                Four generations of soil under our fingernails.
              </h2>
              <div className="reveal delay-200 space-y-6 text-foreground/70 text-lg font-light leading-relaxed">
                <p>
                  What started over six decades ago as a modest family farm in Surrey, BC, has grown into one of the largest and most respected greenhouse operations in North America — built on two core product lines: indoor potted flowering plants and tropical foliage, produced with a consistency and scale few growers can match.
                </p>
                <p>
                  Yet, the core of our business remains exactly as it was on day one: the van der Ende family still walks the rows, inspects the crops, and ensures every flowering plant and foliage variety meets a standard our retail partners stake their own reputations on.
                </p>
                <p>
                  We are growers first. Scale is what lets us meet your volume — but quality is what earns your loyalty. Over 65 years of specialized flowering and foliage growing expertise, held to the Western Canada quality standard, available exclusively to the trade.
                </p>
              </div>
              <div className="reveal delay-300 mt-12 pt-8 border-t border-secondary/10">
                <div className="font-serif italic text-2xl text-secondary">The van der Ende Family</div>
                <div className="text-sm tracking-widest text-foreground/50 uppercase mt-2">Founders & Operators</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-24 md:py-32 bg-secondary text-background relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <span className="reveal inline-flex items-center gap-3 text-primary tracking-[0.2em] text-sm uppercase mb-6 font-semibold">
                <div className="w-8 h-px bg-primary" />
                The Burnaby Lake Standard
              </span>
              <h2 className="reveal delay-100 font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.1]">
                Cultivated for <br/><span className="italic font-light">the trade.</span>
              </h2>
            </div>
            <div className="reveal delay-200 max-w-md text-white/60 font-light leading-relaxed">
              Indoor potted flowering plants and tropical foliage are where we've built our reputation — backed by four generations of specialized growing expertise, every variety is something you'll be proud to put in front of your customers, in the volumes you need to run a serious operation.
            </div>
          </div>

          <Link href="/catalog" className="reveal delay-100 group relative block overflow-hidden border border-white/10">
            <div className="absolute inset-0">
              <img
                src="/images/products-banner.jpg"
                alt="Product Catalog"
                className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105 opacity-40 group-hover:opacity-55"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/85 to-secondary/40" />
            </div>
            <div className="relative py-20 md:py-28 px-8 md:px-16 flex flex-col items-start">
              <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center mb-6 text-primary transform transition-transform duration-500 group-hover:-translate-y-1">
                <Leaf size={18} />
              </div>
              <h3 className="font-serif text-3xl md:text-5xl text-white mb-4 max-w-xl leading-tight">
                Flowering plants & tropical foliage — our core strength.
              </h3>
              <p className="text-white/70 font-light text-base md:text-lg max-w-xl mb-8 leading-relaxed">
                Plus planters & upgrades, Seasonal Collections, and fresh Cut Flowers — all in one wholesale range.
              </p>
              <Button variant="outline-light" className="pointer-events-none">
                Explore Full Catalog <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </div>
          </Link>
        </div>
      </section>

      {/* Wholesale / Operations Banner */}
      <section className="relative py-32 md:py-48 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <img 
            src="/images/products-banner.jpg" 
            alt="Burnaby Lake Operations" 
            className="w-full h-full object-cover opacity-[0.15] scale-105"
          />
          <div className="absolute inset-0 bg-secondary/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-secondary via-transparent to-background" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <ShieldCheck size={48} className="mx-auto text-primary mb-8 opacity-80" strokeWidth={1} />
          <h2 className="reveal font-serif text-4xl md:text-6xl text-white leading-[1.1] mb-8">
            Exclusively Wholesale. <br/>
            <span className="italic font-light text-primary">The Western Canada Quality Standard.</span>
          </h2>
          <p className="reveal delay-100 text-lg md:text-xl text-white/80 font-light leading-relaxed mb-10">
            Our entire 1.3 million square foot operation is purpose-built around two core product lines — indoor potted flowering plants and tropical foliage — producing the highest-quality plants in Western Canada and delivering them reliably to your floor. From meticulous crop programming to our climate-controlled delivery fleet, we are the quality benchmark your retail reputation is built on.
          </p>
          <div className="reveal delay-200">
            <Link href="/contact">
              <Button size="lg">Become a Retail Partner</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
