import React, { useEffect, useState } from 'react';
import { ArrowRight, MapPin, Phone, Menu, X, CheckCircle2, Sprout, Leaf, Sun, ShieldCheck } from 'lucide-react';

export default function Homepage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success'>('idle');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('submitting');
    setTimeout(() => setFormState('success'), 1500);
  };

  return (
    <div className="burlake-wrapper min-h-screen bg-burlake-bg text-burlake-text selection:bg-burlake-gold selection:text-white font-body overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..800;1,9..40,400..800&family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&display=swap');

        .burlake-wrapper {
          --color-bg: #f8f6f0;
          --color-text: #13261a;
          --color-green-dark: #0f1d14;
          --color-green-mid: #1d3624;
          --color-green-light: #2c4d36;
          --color-gold: #c29957;
          --color-gold-light: #dfc28f;
        }

        .bg-burlake-bg { background-color: var(--color-bg); }
        .bg-burlake-dark { background-color: var(--color-green-dark); }
        .bg-burlake-mid { background-color: var(--color-green-mid); }
        .text-burlake-text { color: var(--color-text); }
        .text-burlake-dark { color: var(--color-green-dark); }
        .text-burlake-gold { color: var(--color-gold); }
        .text-burlake-bg { color: var(--color-bg); }
        .border-burlake-gold { border-color: var(--color-gold); }
        .border-burlake-mid { border-color: var(--color-green-mid); }
        
        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'DM Sans', sans-serif; }

        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 1s cubic-bezier(0.25, 1, 0.5, 1), transform 1s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .reveal.active {
          opacity: 1;
          transform: translateY(0);
        }
        .delay-100 { transition-delay: 100ms; }
        .delay-200 { transition-delay: 200ms; }
        .delay-300 { transition-delay: 300ms; }
        .delay-400 { transition-delay: 400ms; }

        .golden-overlay {
          background: linear-gradient(135deg, rgba(194, 153, 87, 0.25) 0%, rgba(15, 29, 20, 0.6) 100%);
          mix-blend-mode: multiply;
        }

        .burlake-input {
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0;
          padding: 0.75rem 0;
          color: var(--color-bg);
          width: 100%;
          transition: all 0.3s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .burlake-input:focus {
          outline: none;
          border-bottom-color: var(--color-gold);
        }
        .burlake-input::placeholder {
          color: rgba(248, 246, 240, 0.4);
        }
        select.burlake-input option {
          background-color: var(--color-green-dark);
          color: var(--color-bg);
        }

        .btn-primary {
          background-color: var(--color-gold);
          color: var(--color-green-dark);
          padding: 1rem 2rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          border: 1px solid var(--color-gold);
        }
        .btn-primary:hover {
          background-color: transparent;
          color: var(--color-gold);
        }

        .btn-outline {
          background-color: transparent;
          color: var(--color-bg);
          padding: 1rem 2rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          border: 1px solid rgba(248, 246, 240, 0.3);
        }
        .btn-outline:hover {
          border-color: var(--color-bg);
          background-color: rgba(248, 246, 240, 0.05);
        }

        .btn-outline-dark {
          background-color: transparent;
          color: var(--color-green-dark);
          padding: 1rem 2rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          border: 1px solid rgba(15, 29, 20, 0.2);
        }
        .btn-outline-dark:hover {
          border-color: var(--color-green-dark);
          background-color: rgba(15, 29, 20, 0.05);
        }

        .glass-pane {
          position: relative;
        }
        .glass-pane::before {
          content: '';
          position: absolute;
          inset: 0;
          border: 1px solid rgba(255,255,255,0.1);
          pointer-events: none;
        }
      `}</style>

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-burlake-dark py-4 shadow-xl' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer z-50">
            <div className={`flex flex-col transition-colors duration-500 text-burlake-bg`}>
              <span className="font-display font-semibold text-2xl leading-none tracking-wide">Burnaby Lake</span>
              <span className="font-body text-[0.65rem] tracking-[0.3em] uppercase opacity-80 mt-1">Greenhouses</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            <a href="#story" className="text-sm font-medium tracking-wide text-white/90 hover:text-burlake-gold transition-colors">Our Story</a>
            <a href="#products" className="text-sm font-medium tracking-wide text-white/90 hover:text-burlake-gold transition-colors">Products</a>
            <a href="#operations" className="text-sm font-medium tracking-wide text-white/90 hover:text-burlake-gold transition-colors">Operations</a>
            <a href="#contact" className="text-sm font-semibold tracking-wider uppercase text-burlake-gold hover:text-white transition-colors border-b border-burlake-gold/30 hover:border-white pb-1">Partner With Us</a>
          </div>

          {/* Mobile Nav Toggle */}
          <button 
            className="md:hidden text-white z-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`fixed inset-0 bg-burlake-dark flex flex-col items-center justify-center gap-8 transition-all duration-500 md:hidden ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
          <a href="#story" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-display text-burlake-bg hover:text-burlake-gold transition-colors">Our Story</a>
          <a href="#products" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-display text-burlake-bg hover:text-burlake-gold transition-colors">Products</a>
          <a href="#operations" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-display text-burlake-bg hover:text-burlake-gold transition-colors">Operations</a>
          <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-display text-burlake-gold mt-4">Partner With Us</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[100dvh] min-h-[700px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-burlake-dark">
          <img 
            src="/__mockup/images/hero-greenhouse.jpg" 
            alt="Inside Burnaby Lake Greenhouses" 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 golden-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-burlake-dark via-transparent to-transparent opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-b from-burlake-dark/50 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full text-center mt-20">
          <span className="reveal inline-block font-body text-burlake-gold tracking-[0.2em] text-sm uppercase mb-6 font-semibold">
            Since 1955
          </span>
          <h1 className="reveal delay-100 font-display text-5xl md:text-7xl lg:text-8xl text-burlake-bg leading-[1.1] mb-8 max-w-5xl mx-auto">
            Grown at Scale. <br/>
            <span className="italic font-light opacity-90">Rooted in Tradition.</span>
          </h1>
          <p className="reveal delay-200 text-lg md:text-xl text-burlake-bg/80 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            Supplying Western Canada's premier floral and garden retailers with exceptional wholesale plants for four generations.
          </p>
          <div className="reveal delay-300 flex flex-col sm:flex-row items-center justify-center gap-6">
            <a href="#contact" className="btn-primary w-full sm:w-auto justify-center">
              Apply for Account <ArrowRight size={18} />
            </a>
            <a href="#products" className="btn-outline w-full sm:w-auto justify-center">
              Explore Products
            </a>
          </div>
        </div>
      </section>

      {/* Scale/Stats Bar */}
      <section className="bg-burlake-dark border-t border-white/5 relative z-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 border-x border-white/5">
            <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/5 text-center reveal">
              <div className="text-4xl md:text-5xl font-display text-burlake-gold mb-2">1.3M<span className="text-2xl">+</span></div>
              <div className="text-xs tracking-widest uppercase text-white/50">Sq Ft Greenhouse Space</div>
            </div>
            <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/5 text-center reveal delay-100">
              <div className="text-4xl md:text-5xl font-display text-burlake-gold mb-2">100<span className="text-2xl">+</span></div>
              <div className="text-xs tracking-widest uppercase text-white/50">Acres of Growing Area</div>
            </div>
            <div className="p-8 md:p-12 border-r border-white/5 text-center reveal delay-200">
              <div className="text-4xl md:text-5xl font-display text-burlake-gold mb-2">200<span className="text-2xl">+</span></div>
              <div className="text-xs tracking-widest uppercase text-white/50">Full-Time Staff</div>
            </div>
            <div className="p-8 md:p-12 text-center reveal delay-300">
              <div className="text-4xl md:text-5xl font-display text-burlake-gold mb-2">65<span className="text-2xl">+</span></div>
              <div className="text-xs tracking-widest uppercase text-white/50">Years of Excellence</div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section id="story" className="py-24 md:py-32 relative">
        {/* Subtle background structural lines */}
        <div className="absolute inset-0 pointer-events-none flex justify-center opacity-[0.03]">
          <div className="w-px h-full bg-burlake-dark" />
          <div className="w-1/3 h-full border-x border-burlake-dark" />
          <div className="w-px h-full bg-burlake-dark" />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">
            <div className="lg:col-span-5 reveal">
              <div className="relative">
                <div className="absolute -inset-4 border border-burlake-mid/20 translate-x-4 translate-y-4" />
                <img 
                  src="/__mockup/images/about-generations.jpg" 
                  alt="Generations of Burnaby Lake Growers" 
                  className="relative z-10 w-full h-[600px] object-cover grayscale-[0.2] contrast-125"
                />
              </div>
            </div>
            <div className="lg:col-span-7 lg:pl-10">
              <span className="reveal inline-flex items-center gap-3 text-burlake-gold tracking-[0.2em] text-sm uppercase mb-6 font-semibold">
                <div className="w-8 h-px bg-burlake-gold" />
                Our Story
              </span>
              <h2 className="reveal delay-100 font-display text-4xl md:text-5xl lg:text-6xl text-burlake-dark leading-[1.1] mb-8">
                Four generations of soil under our fingernails.
              </h2>
              <div className="reveal delay-200 space-y-6 text-burlake-text/70 text-lg font-light leading-relaxed">
                <p>
                  What started over six decades ago as a modest family farm in Surrey, BC, has grown into one of the largest and most sophisticated greenhouse operations in North America. 
                </p>
                <p>
                  Yet, the core of our business remains exactly as it was on day one: the van der Ende family still walks the rows, inspects the crops, and ensures every plant meets a standard our retail partners stake their own reputations on.
                </p>
                <p>
                  We are farmers first. We don't just grow millions of plants; we cultivate the reliability, consistency, and scale that your floral business needs to thrive.
                </p>
              </div>
              <div className="reveal delay-300 mt-12 pt-8 border-t border-burlake-mid/10">
                <div className="font-display italic text-2xl text-burlake-dark">The van der Ende Family</div>
                <div className="text-sm tracking-widest text-burlake-text/50 uppercase mt-2">Founders & Operators</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-24 md:py-32 bg-burlake-dark text-burlake-bg relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <span className="reveal inline-flex items-center gap-3 text-burlake-gold tracking-[0.2em] text-sm uppercase mb-6 font-semibold">
                <div className="w-8 h-px bg-burlake-gold" />
                The Burlake Standard
              </span>
              <h2 className="reveal delay-100 font-display text-4xl md:text-5xl lg:text-6xl leading-[1.1]">
                Cultivated for <br/><span className="italic font-light">the trade.</span>
              </h2>
            </div>
            <div className="reveal delay-200 max-w-md text-white/60 font-light leading-relaxed">
              From everyday staples to premium seasonal collections, our massive inventory ensures you always have the right mix for your retail floor.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="reveal delay-100 group relative aspect-[4/5] overflow-hidden bg-burlake-mid border border-white/5">
              <img 
                src="/__mockup/images/tropical-foliage.jpg" 
                alt="Tropical Foliage" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-burlake-dark via-burlake-dark/20 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-70" />
              
              <div className="absolute bottom-0 left-0 p-8 w-full flex flex-col justify-end">
                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center mb-6 text-burlake-gold transform transition-transform duration-500 group-hover:-translate-y-2">
                  <Leaf size={18} />
                </div>
                <h3 className="font-display text-3xl text-white mb-3 transform transition-transform duration-500 group-hover:-translate-y-2">Tropical Foliage</h3>
                <p className="text-white/60 font-light text-sm h-0 opacity-0 overflow-hidden transition-all duration-500 group-hover:h-auto group-hover:opacity-100 group-hover:mt-2">
                  A massive, year-round selection of lush, vibrant indoor tropicals cultivated for longevity and retail appeal.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="reveal delay-200 group relative aspect-[4/5] overflow-hidden bg-burlake-mid border border-white/5">
              <img 
                src="/__mockup/images/flowering.jpg" 
                alt="Flowering Plants" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-burlake-dark via-burlake-dark/20 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-70" />
              
              <div className="absolute bottom-0 left-0 p-8 w-full flex flex-col justify-end">
                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center mb-6 text-burlake-gold transform transition-transform duration-500 group-hover:-translate-y-2">
                  <Sun size={18} />
                </div>
                <h3 className="font-display text-3xl text-white mb-3 transform transition-transform duration-500 group-hover:-translate-y-2">Flowering Plants</h3>
                <p className="text-white/60 font-light text-sm h-0 opacity-0 overflow-hidden transition-all duration-500 group-hover:h-auto group-hover:opacity-100 group-hover:mt-2">
                  Vibrant blooming varieties programmed meticulously to arrive in perfect color for major retail holidays and everyday sales.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="reveal delay-300 group relative aspect-[4/5] overflow-hidden bg-burlake-mid border border-white/5">
              <img 
                src="/__mockup/images/planters.jpg" 
                alt="Planters & Upgrades" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-burlake-dark via-burlake-dark/20 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-70" />
              
              <div className="absolute bottom-0 left-0 p-8 w-full flex flex-col justify-end">
                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center mb-6 text-burlake-gold transform transition-transform duration-500 group-hover:-translate-y-2">
                  <Sprout size={18} />
                </div>
                <h3 className="font-display text-3xl text-white mb-3 transform transition-transform duration-500 group-hover:-translate-y-2">Planters & Upgrades</h3>
                <p className="text-white/60 font-light text-sm h-0 opacity-0 overflow-hidden transition-all duration-500 group-hover:h-auto group-hover:opacity-100 group-hover:mt-2">
                  Value-added ceramic and decorative planters, mixed arrangements, and retail-ready upgrades that drive higher margins.
                </p>
              </div>
            </div>
          </div>
          
          <div className="reveal delay-400 mt-16 text-center border-t border-white/10 pt-16">
             <p className="text-lg text-white/70 font-light mb-6">
                We also offer <strong className="text-white font-medium">Seasonal Collections</strong> (Easter, Mother's Day, Poinsettias) and fresh <strong className="text-white font-medium">Cut Flowers</strong>.
             </p>
             <a href="#contact" className="btn-outline inline-flex">Request Full Catalog</a>
          </div>
        </div>
      </section>

      {/* Wholesale / Operations Banner */}
      <section id="operations" className="relative py-32 md:py-48 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <img 
            src="/__mockup/images/products-banner.jpg" 
            alt="Burnaby Lake Operations" 
            className="w-full h-full object-cover opacity-[0.15] scale-105"
          />
          <div className="absolute inset-0 bg-burlake-dark/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-burlake-dark via-transparent to-burlake-bg" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <ShieldCheck size={48} className="mx-auto text-burlake-gold mb-8 opacity-80" strokeWidth={1} />
          <h2 className="reveal font-display text-4xl md:text-6xl text-white leading-[1.1] mb-8">
            Exclusively Wholesale. <br/>
            <span className="italic font-light text-burlake-gold">Built for Volume.</span>
          </h2>
          <p className="reveal delay-100 text-lg md:text-xl text-white/80 font-light leading-relaxed mb-10">
            We do not sell to the public. Our entire 1.3 million square foot operation is engineered specifically to support brick-and-mortar floral and garden retailers. From stringent crop planning to our dedicated climate-controlled delivery fleet, we are the silent partner behind your thriving storefront.
          </p>
          <div className="reveal delay-200">
            <a href="#contact" className="btn-primary">
              Become a Retail Partner
            </a>
          </div>
        </div>
      </section>

      {/* Contact / Apply Section */}
      <section id="contact" className="py-24 md:py-32 bg-burlake-bg relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            {/* Left Info */}
            <div className="reveal">
              <span className="inline-flex items-center gap-3 text-burlake-gold tracking-[0.2em] text-sm uppercase mb-6 font-semibold">
                <div className="w-8 h-px bg-burlake-gold" />
                Work With Us
              </span>
              <h2 className="font-display text-4xl md:text-5xl text-burlake-dark leading-[1.1] mb-6">
                Open a Wholesale Account
              </h2>
              <p className="text-burlake-text/70 text-lg font-light leading-relaxed mb-12">
                Burnaby Lake Greenhouses restricts new accounts to established brick-and-mortar businesses in the floral, grocery, and garden industry. Complete the application to access our wholesale pricing and weekly availability lists.
              </p>

              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-burlake-mid/5 flex items-center justify-center text-burlake-gold shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h4 className="font-display text-xl text-burlake-dark mb-1">Our Location</h4>
                    <p className="text-burlake-text/60 font-light">Surrey, British Columbia<br/>(Wholesale pickups by appointment only)</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-burlake-mid/5 flex items-center justify-center text-burlake-gold shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h4 className="font-display text-xl text-burlake-dark mb-1">Sales Team</h4>
                    <p className="text-burlake-text/60 font-light">Existing partners, contact your rep directly for immediate assistance.</p>
                  </div>
                </div>
              </div>

              {/* Decorative image snippet */}
              <div className="mt-16 relative h-64 overflow-hidden border border-burlake-mid/10 hidden md:block">
                <img 
                  src="/__mockup/images/contact-banner.jpg" 
                  alt="Greenhouse Operations" 
                  className="w-full h-full object-cover grayscale-[0.3] contrast-125"
                />
              </div>
            </div>

            {/* Right Form */}
            <div className="reveal delay-200">
              <div className="bg-burlake-dark p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-burlake-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <h3 className="font-display text-3xl text-white mb-8">Application Form</h3>

                {formState === 'success' ? (
                  <div className="py-16 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-burlake-gold/20 flex items-center justify-center text-burlake-gold mb-6">
                      <CheckCircle2 size={32} />
                    </div>
                    <h4 className="font-display text-2xl text-white mb-4">Application Received</h4>
                    <p className="text-white/70 font-light">
                      Thank you for your interest in Burnaby Lake Greenhouses. Our sales team will review your business credentials and contact you within 2-3 business days.
                    </p>
                    <button 
                      onClick={() => setFormState('idle')}
                      className="mt-8 text-burlake-gold text-sm tracking-widest uppercase hover:text-white transition-colors"
                    >
                      Submit Another
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApply} className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <input required type="text" placeholder="Business Name *" className="burlake-input" />
                      </div>
                      <div>
                        <input required type="text" placeholder="Contact Person *" className="burlake-input" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <input required type="email" placeholder="Email Address *" className="burlake-input" />
                      </div>
                      <div>
                        <input required type="tel" placeholder="Phone Number *" className="burlake-input" />
                      </div>
                    </div>

                    <div>
                      <select required className="burlake-input appearance-none bg-transparent" defaultValue="">
                        <option value="" disabled hidden>Business Type *</option>
                        <option value="garden-center">Independent Garden Center</option>
                        <option value="florist">Retail Florist</option>
                        <option value="grocery">Grocery / Supermarket</option>
                        <option value="hardware">Hardware / Box Store</option>
                        <option value="other">Other (Specify in notes)</option>
                      </select>
                    </div>

                    <div>
                      <input required type="text" placeholder="Reseller Tax ID / Business License # *" className="burlake-input" />
                    </div>

                    <div>
                      <textarea placeholder="Tell us about your business and purchasing volume..." rows={3} className="burlake-input resize-none"></textarea>
                    </div>

                    <div className="pt-6">
                      <button 
                        type="submit" 
                        disabled={formState === 'submitting'}
                        className="btn-primary w-full justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {formState === 'submitting' ? 'Submitting...' : 'Submit Application'}
                      </button>
                      <p className="text-white/40 text-xs mt-4 font-light text-center">
                        By applying, you confirm you are representing a registered brick-and-mortar retail business.
                      </p>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a120d] text-white/60 py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
               <div className="flex flex-col mb-6">
                  <span className="font-display font-semibold text-2xl leading-none tracking-wide text-white">Burnaby Lake</span>
                  <span className="font-body text-[0.65rem] tracking-[0.3em] uppercase text-burlake-gold mt-1">Greenhouses</span>
                </div>
              <p className="max-w-sm font-light text-sm leading-relaxed mb-6">
                Four generations of dedicated growing. Supplying the floral and garden industry with exceptional plants at scale.
              </p>
              <div className="text-xs tracking-wider uppercase text-white/30">
                © {new Date().getFullYear()} Burnaby Lake Greenhouses. All Rights Reserved.
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-display text-lg mb-6">Company</h4>
              <ul className="space-y-3 text-sm font-light">
                <li><a href="#story" className="hover:text-burlake-gold transition-colors">Our Story</a></li>
                <li><a href="#products" className="hover:text-burlake-gold transition-colors">Products</a></li>
                <li><a href="#operations" className="hover:text-burlake-gold transition-colors">Operations</a></li>
                <li><a href="#contact" className="hover:text-burlake-gold transition-colors">Contact Sales</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-display text-lg mb-6">Wholesale</h4>
              <ul className="space-y-3 text-sm font-light">
                <li><a href="#contact" className="hover:text-burlake-gold transition-colors">Become a Partner</a></li>
                <li><a href="#" className="hover:text-burlake-gold transition-colors">Current Availability</a></li>
                <li><a href="#" className="hover:text-burlake-gold transition-colors">Delivery Fleet</a></li>
                <li><a href="#" className="hover:text-burlake-gold transition-colors">Terms & Conditions</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
