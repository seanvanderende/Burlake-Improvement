import React from 'react';
import { Droplets, Recycle, Leaf, Cpu } from 'lucide-react';
import { Link } from 'wouter';

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
      'Large amounts of water are used throughout our facility every day — it is inevitable in this industry. With this usage in mind, a large portion of our facility is equipped to minimize water waste by recapturing as much of the irrigation water as we can.',
      'Before the water is reused, it is filtered and pH- and nutrient-balanced, adding new water as needed to reach optimal nutrient levels, then stored in multiple water tanks on-site until it\u2019s cycled back into our irrigation system. Reusing water saves a tremendous amount of water and also recycles the fertilizers added into it, enabling a significant reduction in fertilizer usage.',
    ],
  },
  {
    icon: <Recycle size={20} />,
    title: 'Pot Sterilizing',
    paragraphs: [
      'At the end of any given season or holiday, we are left with tens of thousands of empty used pots — whether from unsold product, plants being used in our planter gardens, or upsizing plants into larger pots. All remaining natural materials get turned into compost.',
      'To minimize our plastic waste, we collect all intact empty pots and treat them in a steam chamber for an extended period of time. This steaming process sterilizes the pots, allowing them to be reused for new crops in the coming seasons — playing a massive role in reducing waste and unnecessary plastic usage from our facility.',
    ],
  },
  {
    icon: <Leaf size={20} />,
    title: 'Biodegradable & Recycled Materials',
    paragraphs: [
      'Another way we reduce plastic waste is by using biodegradable and recycled materials for product packaging wherever we can: cardboard boxes (recycled in-house), paper sleeves instead of plastic to protect plants during shipping when possible, bamboo stakes for displaying product care labels, and paperboard and recycled plastic for our product care labels whenever we can.',
      'When you buy one of our plants and it has a paperboard plant care label stuck into the soil, the material will start breaking down after a couple of weeks if left in wet soil. To preserve the information and as much of the label as possible, we suggest removing the label from the soil and cutting off the bottom point that was stuck in.',
    ],
  },
  {
    icon: <Cpu size={20} />,
    title: 'Technology & Efficiency',
    paragraphs: [
      'To heat our facility, we rely on eight natural gas-powered boilers that heat large amounts of water to temperatures set based on weather and crop needs, pumped throughout our facility to create a warm, humid growing environment.',
      'We also control day length and direct sun exposure with a series of curtains near the roof of the structure — including a double layer of shade curtains to reduce sun exposure and increase ambient brightness, and solid black curtains for crops that require complete darkness. When closed, these curtains function like energy-retention shades, reflecting heat back into the facility and reducing how often and how long our boilers need to run.',
      'We\u2019ve also long been early adopters of growing technology: in the late 1970s we were among the first greenhouses in North America to install high-intensity lights to improve product quality. In the early 1980s, we were among the first to install computerized environmental control systems to monitor and regulate temperature, humidity, CO\u2082, light levels, and day length — resulting in more efficient energy use.',
      'Also in the 1980s, we were among the first facilities in North America to install a Dutch rolling palletized benching system, maximizing work space and efficiency even during peak seasons. This system also let us implement sub-irrigation and water-recapturing technology — watering crops by flooding them from below instead of overhead, which keeps foliage dry, decreases water loss, saves fertilizer, and reduces chemical needs.',
    ],
  },
];

export default function Sustainability() {
  return (
    <div className="bg-background pt-32 pb-24 min-h-screen">
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

        {/* Practices */}
        <div className="space-y-16">
          {PRACTICES.map((practice, i) => (
            <div
              key={practice.title}
              className="animate-in fade-in slide-in-from-bottom-4 duration-700"
              style={{ animationDelay: `${i * 75}ms` }}
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="w-10 h-10 rounded-full bg-secondary/5 flex items-center justify-center text-primary shrink-0">
                  {practice.icon}
                </div>
                <h2 className="font-serif text-2xl md:text-3xl text-foreground">
                  {practice.title}
                </h2>
              </div>
              <div className="space-y-4 md:pl-14">
                {practice.paragraphs.map((p, j) => (
                  <p key={j} className="text-muted-foreground font-light leading-relaxed">
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
            Grown at Scale. <span className="italic font-light">Available to the Trade.</span>
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
