import React from 'react';
import { Link } from 'wouter';
import { Truck, Snowflake, MapPin, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Seo, JsonLd } from '@/components/Seo';
import { absoluteUrl } from '@/lib/seo';

export default function Distribution() {
  return (
    <div className="bg-background min-h-screen">
      <Seo
        title="Distribution & Fleet — Our Own Climate-Controlled Trucks"
        description="Burnaby Lake Greenhouses operates its own dedicated fleet of climate-controlled semi trucks, delivering across Western Canada, major U.S. Pacific Northwest markets like Seattle and Portland, and California."
        path="/distribution"
        image="/images/products-banner.jpg"
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
            { '@type': 'ListItem', position: 2, name: 'Distribution & Fleet', item: absoluteUrl('/distribution') },
          ],
        }}
      />

      {/* Hero */}
      <section className="relative pt-40 pb-24 md:pt-48 md:pb-32 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src="/images/products-banner.jpg"
            alt="Burnaby Lake delivery fleet"
            className="w-full h-full object-cover opacity-[0.18] scale-105"
          />
          <div className="absolute inset-0 bg-secondary/85 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-secondary via-secondary/90 to-background" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-3 text-primary tracking-[0.2em] text-sm uppercase mb-6 font-semibold justify-center">
            <div className="w-8 h-px bg-primary" />
            Distribution &amp; Fleet
            <div className="w-8 h-px bg-primary" />
          </span>
          <h1 className="font-serif text-4xl md:text-6xl text-white leading-[1.1] mb-8">
            Our own fleet. <br/>
            <span className="italic font-light text-primary">Just our trucks, our standard.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 font-light leading-relaxed max-w-2xl mx-auto">
            Quality doesn't stop at the greenhouse door. We operate our own dedicated fleet of
            climate-controlled semi trucks, so we can guarantee every order arrives in the same
            condition it left us in — no matter the distance it travels.
          </p>
        </div>
      </section>

      {/* Why Our Own Fleet */}
      <section className="py-24 md:py-32 relative bg-background">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">
            <div className="lg:col-span-6">
              <span className="inline-flex items-center gap-3 text-primary tracking-[0.2em] text-sm uppercase mb-6 font-semibold">
                <div className="w-8 h-px bg-primary" />
                Why It Matters
              </span>
              <h2 className="font-serif text-4xl md:text-5xl text-secondary leading-[1.1] mb-8">
                We control the one variable most growers can't.
              </h2>
              <div className="space-y-6 text-foreground/70 text-lg font-light leading-relaxed">
                <p>
                  For the vast majority of our deliveries, our own drivers, our own trucks, and our
                  own climate-controlled trailers carry your order from our headhouse all the way to
                  your receiving dock.
                </p>
                <p>
                  That means consistent temperature, careful handling, and reliable scheduling —
                  the same standard of quality we apply to growing, applied to getting your order
                  to you. No handoffs, no surprises, no guessing what happened in transit.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-10 pt-10 border-t border-secondary/10">
                <div className="flex items-start gap-3">
                  <Truck size={22} className="text-primary shrink-0 mt-1" strokeWidth={1.5} />
                  <div>
                    <div className="font-serif text-lg text-secondary">Dedicated Fleet</div>
                    <div className="text-sm text-foreground/60 font-light">Our own trucks &amp; drivers, start to finish</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Snowflake size={22} className="text-primary shrink-0 mt-1" strokeWidth={1.5} />
                  <div>
                    <div className="font-serif text-lg text-secondary">Climate-Controlled</div>
                    <div className="text-sm text-foreground/60 font-light">Consistent conditions for every mile</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck size={22} className="text-primary shrink-0 mt-1" strokeWidth={1.5} />
                  <div>
                    <div className="font-serif text-lg text-secondary">Fleet-First Delivery</div>
                    <div className="text-sm text-foreground/60 font-light">Our own trucks handle the vast majority of every route</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={22} className="text-primary shrink-0 mt-1" strokeWidth={1.5} />
                  <div>
                    <div className="font-serif text-lg text-secondary">Long-Haul Reach</div>
                    <div className="text-sm text-foreground/60 font-light">Reliable service well beyond Western Canada</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative bg-secondary text-background p-10 md:p-14 border border-secondary/10">
                <MapPin size={32} className="text-primary mb-8 opacity-80" strokeWidth={1.5} />
                <div className="font-serif italic text-2xl md:text-3xl mb-10 text-background/90">
                  Where we deliver
                </div>
                <ul className="space-y-6">
                  <li className="flex items-start gap-4 pb-6 border-b border-white/10">
                    <CheckCircle2 size={20} className="text-primary shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold tracking-wide">Western Canada</div>
                      <div className="text-white/60 font-light text-sm mt-1">
                        Full coverage across BC, Alberta, and beyond — our core, highest-frequency routes.
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-4 pb-6 border-b border-white/10">
                    <CheckCircle2 size={20} className="text-primary shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold tracking-wide">U.S. Pacific Northwest</div>
                      <div className="text-white/60 font-light text-sm mt-1">
                        Regular service into major markets, including Seattle and Portland.
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <CheckCircle2 size={20} className="text-primary shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold tracking-wide">California &amp; Beyond</div>
                      <div className="text-white/60 font-light text-sm mt-1">
                        Strong, established capability to run product reliably all the way down the coast, plus reach into markets like Utah.
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 relative overflow-hidden flex items-center justify-center bg-secondary">
        <div className="absolute inset-0">
          <img
            src="/images/products-banner.jpg"
            alt="Burnaby Lake Operations"
            className="w-full h-full object-cover opacity-[0.12] scale-105"
          />
          <div className="absolute inset-0 bg-secondary/85 mix-blend-multiply" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl md:text-5xl text-white leading-[1.1] mb-8">
            Wherever your business is, <br/>
            <span className="italic font-light text-primary">we can get product there.</span>
          </h2>
          <p className="text-lg text-white/80 font-light leading-relaxed mb-10">
            Talk to us about your delivery needs — whether you're a block away in Surrey or shipping
            into California, our own fleet keeps quality and reliability the same across the board.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
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
    </div>
  );
}
