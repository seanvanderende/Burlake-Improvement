import React, { useEffect } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Leaf, ShieldCheck, Truck, Gift, Palette } from 'lucide-react';
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
        description="Western Canada's leading wholesale greenhouse since 1955. Four generations of growing expertise, 1.3M+ sq ft under glass — supplying florists, grocers, and garden centers at scale."
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
            "Western Canada's leading wholesale greenhouse grower, supplying tropical foliage, flowering plants, planters, and cut flowers to retail trade partners since 1955.",
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Surrey',
            addressRegion: 'BC',
            addressCountry: 'CA',
          },
          areaServed: ['Western Canada', 'US Pacific Northwest', 'California'],
          slogan: 'Grown at Scale. Quality Guaranteed.',
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
            <span className="italic font-light opacity-90">Quality Guaranteed.</span>
          </h1>
          <p className="reveal delay-200 text-lg md:text-xl text-background/80 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            Four generations of growing expertise, backed by a quality standard your business can depend on.
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
      <section id="our-story" className="py-24 md:py-32 relative bg-background overflow-hidden">
        <div className="absolute inset-0 pointer-events-none flex justify-center opacity-[0.03]">
          <div className="w-px h-full bg-secondary" />
          <div className="w-1/3 h-full border-x border-secondary" />
          <div className="w-px h-full bg-secondary" />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="reveal mb-12 md:mb-16">
            <span className="inline-flex items-center gap-3 text-primary tracking-[0.2em] text-sm uppercase mb-6 font-semibold">
              <div className="w-8 h-px bg-primary" />
              Our Story
            </span>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-secondary leading-[1.1] max-w-4xl">
              Four generations of soil <span className="italic font-light">under our fingernails.</span>
            </h2>
          </div>

          <div className="reveal delay-100 relative mb-12 md:mb-16">
            <div className="absolute -inset-3 md:-inset-4 border border-secondary/20 translate-x-3 translate-y-3 md:translate-x-4 md:translate-y-4" />
            <div className="relative z-10 overflow-hidden bg-secondary aspect-[4/3] sm:aspect-video">
              <video
                className="w-full h-full object-cover pointer-events-none"
                autoPlay
                muted
                loop
                playsInline
                disablePictureInPicture
                disableRemotePlayback
                preload="metadata"
                poster="/images/burnaby-lake-aerial-poster.jpg"
                aria-label="Aerial view of the Burnaby Lake Greenhouses growing operation in Surrey, British Columbia"
                controlsList="nodownload noplaybackrate nofullscreen"
                onContextMenu={(e) => e.preventDefault()}
              >
                <source src="/videos/burnaby-lake-aerial.mp4" type="video/mp4" />
                Your browser does not support embedded video.
              </video>
              <div className="absolute left-0 bottom-12 sm:bottom-14 bg-secondary/90 backdrop-blur-sm px-5 py-3 md:px-7 md:py-4 pointer-events-none">
                <div className="text-primary text-[10px] md:text-xs tracking-[0.2em] uppercase font-semibold">
                  Surrey, British Columbia
                </div>
                <div className="font-serif text-white text-lg md:text-2xl mt-1">
                  1.3 million+ sq. ft. under glass
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20">
            <div className="reveal delay-200 lg:col-span-7 space-y-6 text-foreground/70 text-lg font-light leading-relaxed">
              <p>
                What started over six decades ago as a modest family farm in Surrey, BC, has grown into one of the largest and most respected greenhouse operations in North America — known as much for the consistency of every plant as for the scale at which we produce them.
              </p>
              <p>
                Yet, the core of our business remains exactly as it was on day one: the van der Ende family still walks the rows, inspects the crops, and ensures every plant meets a standard our retail partners stake their own reputations on.
              </p>
            </div>
            <div className="reveal delay-300 lg:col-span-5 lg:border-l lg:border-secondary/10 lg:pl-12">
              <div className="space-y-6 text-foreground/70 text-lg font-light leading-relaxed">
                <p>
                  We are growers first. Scale is what lets us meet your volume — but quality is what earns your loyalty.
                </p>
                <p>
                  Growing at scale keeps our pricing competitive — the highest-quality product your customers expect, at a cost that works for your business.
                </p>
              </div>
              <div className="mt-10 pt-8 border-t border-secondary/10">
                <div className="font-serif italic text-2xl text-secondary">The van der Ende Family</div>
                <div className="text-sm tracking-widest text-foreground/50 uppercase mt-2">Founders &amp; Operators</div>
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
              Backed by four generations of growing expertise, every variety in our inventory is something you'll be proud to put in front of your customers — in the volumes you need to run a serious operation.
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
                Tropical foliage. Flowering plants. Planters & upgrades.
              </h3>
              <p className="text-white/70 font-light text-base md:text-lg max-w-xl mb-8 leading-relaxed">
                Explore the full wholesale range in one place — plus Seasonal Collections and fresh Cut Flowers.
              </p>
              <Button variant="outline-light" className="pointer-events-none">
                Explore Full Catalog <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </div>
          </Link>
        </div>
      </section>

      {/* Supply & Value-Added Services Teaser */}
      <section className="py-24 md:py-32 relative bg-background overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Link
            href="/catalog?category=Planters%20%26%20Upgrades"
            className="reveal group relative block overflow-hidden border border-secondary/10"
          >
            <div className="absolute inset-0">
              <img
                src="/images/products-banner.jpg"
                alt="Burnaby Lake planters and value-added packaging"
                className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105 opacity-40 group-hover:opacity-55"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/85 to-secondary/40" />
            </div>
            <div className="relative py-20 md:py-28 px-8 md:px-16 flex flex-col items-start">
              <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center mb-6 text-primary transform transition-transform duration-500 group-hover:-translate-y-1">
                <Gift size={18} />
              </div>
              <span className="text-primary tracking-[0.2em] text-sm uppercase mb-4 font-semibold">
                Supply &amp; Value-Added Services
              </span>
              <h3 className="font-serif text-3xl md:text-5xl text-white mb-4 max-w-xl leading-tight">
                Gift-ready, from ceramics to terra cotta.
              </h3>
              <p className="text-white/70 font-light text-base md:text-lg max-w-xl mb-8 leading-relaxed">
                Container and packaging value-adds — plus custom looks from our in-house creative
                and design team — so your order arrives ready to sell.
              </p>
              <Button variant="outline-light" className="pointer-events-none">
                <Palette size={16} className="mr-2" /> Explore Planters &amp; Upgrades <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </div>
          </Link>
        </div>
      </section>

      {/* Distribution / Fleet Teaser */}
      <section className="py-24 md:py-32 relative bg-background overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <Link href="/distribution" className="reveal group relative block overflow-hidden border border-secondary/10">
            <div className="absolute inset-0">
              <img
                src="/images/products-banner.jpg"
                alt="Burnaby Lake delivery fleet"
                className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105 opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/90 to-secondary/50" />
            </div>
            <div className="relative py-20 md:py-28 px-8 md:px-16 flex flex-col items-start">
              <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center mb-6 text-primary transform transition-transform duration-500 group-hover:-translate-y-1">
                <Truck size={18} />
              </div>
              <span className="text-primary tracking-[0.2em] text-sm uppercase mb-4 font-semibold">
                Our Own Fleet
              </span>
              <h3 className="font-serif text-3xl md:text-5xl text-white mb-4 max-w-xl leading-tight">
                Our trucks, our standard.
              </h3>
              <p className="text-white/70 font-light text-base md:text-lg max-w-xl mb-8 leading-relaxed">
                Our own climate-controlled fleet delivers across Western Canada, the U.S. Pacific Northwest, and California — no handoffs, no surprises.
              </p>
              <Button variant="outline-light" className="pointer-events-none">
                See Where We Deliver <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
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
            Our entire 1.3 million square foot operation exists for one purpose: producing the highest-quality plants in Western Canada and delivering them reliably to your floor — backed by our own climate-controlled delivery fleet.
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
