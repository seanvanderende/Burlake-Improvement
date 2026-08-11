import React from 'react';
import { Link } from 'wouter';

interface Milestone {
  years: string;
  title: string;
  points: string[];
  images?: { src: string; alt: string }[];
}

const MILESTONES: Milestone[] = [
  {
    years: '1951',
    title: 'A Family Arrives',
    points: [
      "Huibrecht (Herb) van der Ende and his family emigrated from Holland to Burnaby, British Columbia.",
      "Herb worked on — and loved — the hobby farm of the individual who sponsored his family's move to BC.",
    ],
    images: [
      { src: '/images/history/1951-burnaby.jpg', alt: 'Aerial view of the original Burnaby property, 1951' },
    ],
  },
  {
    years: '1954',
    title: 'Burnaby Lake Greenhouses Is Founded',
    points: [
      'Herb founded Burnaby Lake Greenhouses, located by Ledger Avenue and Canada Way in Burnaby.',
    ],
  },
  {
    years: '1955',
    title: 'Incorporation',
    points: [
      'The company was incorporated as Burnaby Lake Greenhouses Ltd.',
    ],
  },
  {
    years: '1961',
    title: 'Guildford Facility Built',
    points: [
      'Business expanded and a new facility was built in the Guildford area of Surrey.',
      'Herb was joined by some of his sons in operating the greenhouse — the second generation.',
      'All production was moved to the Guildford area facility, and the original Burnaby facility was closed.',
    ],
    images: [
      { src: '/images/history/1963-guildford.jpg', alt: 'Aerial view of the Guildford greenhouse facility, 1963' },
    ],
  },
  {
    years: '1969 – 1977',
    title: 'Fleetwood Facility Built & Expanded',
    points: [
      'Business expanded and a new facility was built in the Fleetwood area of Surrey.',
      'The Fleetwood facility was further expanded to keep pace with growing product demand.',
    ],
    images: [
      { src: '/images/history/1970-fleetwood.jpg', alt: 'Aerial view of the newly built Fleetwood facility, 1970' },
      { src: '/images/history/1977-fleetwood.jpg', alt: 'Aerial view of the expanded Fleetwood facility, 1977' },
    ],
  },
  {
    years: '1982 – 2004',
    title: 'The Cloverdale Era Begins',
    points: [
      'The first phase of our current facility in the Cloverdale area of Surrey was built, and the site was aggressively expanded to handle rapidly increasing demand.',
      "Some of Herb's grandsons — the third generation of van der Endes — joined in operating the greenhouse.",
      'In 1988, production was moved out of the Guildford facility, which was then closed.',
    ],
    images: [
      { src: '/images/history/1982-cloverdale.jpg', alt: 'Aerial view of the first phase of the Cloverdale facility, 1982' },
      { src: '/images/history/1982-2004-cloverdale.jpg', alt: 'Aerial view of the expanded Cloverdale facility during the 1982–2004 era' },
    ],
  },
  {
    years: '2003 – 2005',
    title: 'Consolidating in Cloverdale',
    points: [
      'Production at the Fleetwood facility was phased out and crops were moved to Cloverdale; the Fleetwood facility closed in 2004.',
      'Our most recent expansion, built in 2005, marked the growth of the Cloverdale facility from an initial 100,000 sq ft to the 1,300,000 sq ft currently under production.',
    ],
  },
  {
    years: '2010 – Present',
    title: 'A Fourth Generation',
    points: [
      "Some of Herb's great-grandchildren joined the business, introducing the fourth generation of van der Endes to the operation of the family greenhouse.",
    ],
    images: [
      { src: '/images/history/2010-present.jpg', alt: 'Aerial view of the Cloverdale facility, 2010 to present' },
    ],
  },
];

export default function History() {
  return (
    <div className="bg-background pt-32 pb-24 min-h-screen">
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
          <span className="inline-flex items-center gap-3 text-primary tracking-[0.2em] text-sm uppercase mb-4 font-semibold justify-center">
            <div className="w-8 h-px bg-primary" />
            Since 1954
            <div className="w-8 h-px bg-primary" />
          </span>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground leading-[1.1] mb-6">
            Four Generations. <span className="italic font-light">One Standard.</span>
          </h1>
          <p className="text-muted-foreground text-lg font-light leading-relaxed max-w-2xl mx-auto">
            From a single hobby farm in Burnaby to 1.3 million square feet under glass in
            Cloverdale — the van der Ende family has spent over 70 years growing quality Western
            Canada's trade can depend on.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[7px] md:left-1/2 top-2 bottom-2 w-px bg-border md:-translate-x-1/2" />

          <div className="space-y-14">
            {MILESTONES.map((m, i) => {
              const isLeft = i % 2 === 0;
              return (
                <div
                  key={m.years}
                  className="relative animate-in fade-in slide-in-from-bottom-4 duration-700"
                  style={{ animationDelay: `${i * 75}ms` }}
                >
                  {/* Dot */}
                  <div className="absolute left-0 md:left-1/2 top-1.5 w-[15px] h-[15px] rounded-full bg-primary border-4 border-background md:-translate-x-1/2 z-10" />

                  <div
                    className={`pl-10 md:pl-0 md:grid md:grid-cols-2 md:gap-16 ${
                      isLeft ? '' : ''
                    }`}
                  >
                    <div className={isLeft ? 'md:text-right md:pr-0' : 'md:col-start-2'}>
                      <span className="inline-block text-xs uppercase tracking-[0.15em] text-primary font-semibold mb-2">
                        {m.years}
                      </span>
                      <h3 className="font-serif text-2xl text-foreground mb-3">{m.title}</h3>
                      <ul className={`space-y-2 ${isLeft ? 'md:text-right' : ''}`}>
                        {m.points.map((p, j) => (
                          <li
                            key={j}
                            className="text-muted-foreground font-light leading-relaxed text-sm"
                          >
                            {p}
                          </li>
                        ))}
                      </ul>
                      {m.images && m.images.length > 0 && (
                        <div
                          className={`mt-5 flex flex-wrap gap-3 ${
                            isLeft ? 'md:justify-end' : 'md:justify-start'
                          }`}
                        >
                          {m.images.map((img, k) => (
                            <a
                              key={k}
                              href={img.src}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full sm:w-[calc(50%-0.375rem)] overflow-hidden rounded-sm border border-border group"
                            >
                              <img
                                src={img.src}
                                alt={img.alt}
                                loading="lazy"
                                className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center bg-secondary p-12 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <h3 className="font-serif text-3xl text-secondary-foreground mb-4 relative z-10">
            Grown at Scale. <span className="italic font-light">Quality Guaranteed.</span>
          </h3>
          <p className="text-secondary-foreground/70 font-light max-w-xl mx-auto mb-8 relative z-10">
            Explore our current catalog or apply for a wholesale account to see the same standard
            of quality that's carried us for over 70 years.
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
