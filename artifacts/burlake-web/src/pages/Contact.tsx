import React from 'react';
import { MapPin, Phone, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Contact() {
  const [formState, setFormState] = React.useState<'idle' | 'submitting' | 'success'>('idle');

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('submitting');
    setTimeout(() => setFormState('success'), 1500);
  };

  return (
    <div className="bg-background pt-32 pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left Info */}
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <span className="inline-flex items-center gap-3 text-primary tracking-[0.2em] text-sm uppercase mb-6 font-semibold">
              <div className="w-8 h-px bg-primary" />
              Work With Us
            </span>
            <h1 className="font-serif text-4xl md:text-5xl text-foreground leading-[1.1] mb-6">
              Open a Wholesale Account
            </h1>
            <p className="text-muted-foreground text-lg font-light leading-relaxed mb-12">
              Burnaby Lake Greenhouses restricts new accounts to established brick-and-mortar businesses in the floral, grocery, and garden industry. Complete the application to access our wholesale pricing and weekly availability lists.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary/5 flex items-center justify-center text-primary shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <h4 className="font-serif text-xl text-foreground mb-1">Our Location</h4>
                  <p className="text-muted-foreground font-light">Surrey, British Columbia<br/>(Wholesale pickups by appointment only)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary/5 flex items-center justify-center text-primary shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <h4 className="font-serif text-xl text-foreground mb-1">Sales Team</h4>
                  <p className="text-muted-foreground font-light">Existing partners, contact your rep directly for immediate assistance.</p>
                </div>
              </div>
            </div>

            <div className="mt-16 relative h-64 overflow-hidden border border-secondary/10 hidden md:block">
              <img 
                src="/images/contact-banner.jpg" 
                alt="Greenhouse Operations" 
                className="w-full h-full object-cover grayscale-[0.3] contrast-125"
              />
            </div>
          </div>

          {/* Right Form */}
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <div className="bg-secondary p-8 md:p-12 relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <h3 className="font-serif text-3xl text-secondary-foreground mb-8">Application Form</h3>

              {formState === 'success' ? (
                <div className="py-16 text-center flex flex-col items-center animate-in zoom-in duration-500">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-6">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="font-serif text-2xl text-secondary-foreground mb-4">Application Received</h4>
                  <p className="text-secondary-foreground/70 font-light max-w-md mx-auto">
                    Thank you for your interest in Burnaby Lake Greenhouses. Our sales team will review your business credentials and contact you within 2-3 business days.
                  </p>
                  <Button 
                    variant="link"
                    onClick={() => setFormState('idle')}
                    className="mt-8 text-primary hover:text-secondary-foreground"
                  >
                    Submit Another Application
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-6 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Input required type="text" placeholder="Business Name *" className="border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/40" />
                    </div>
                    <div>
                      <Input required type="text" placeholder="Contact Person *" className="border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/40" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Input required type="email" placeholder="Email Address *" className="border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/40" />
                    </div>
                    <div>
                      <Input required type="tel" placeholder="Phone Number *" className="border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/40" />
                    </div>
                  </div>

                  <div>
                    <select required className="flex h-12 w-full border-b border-secondary-foreground/20 bg-transparent px-0 py-2 text-base text-secondary-foreground placeholder:text-secondary-foreground/40 focus-visible:outline-none focus-visible:border-primary transition-colors appearance-none" defaultValue="">
                      <option value="" disabled hidden className="text-muted-foreground">Business Type *</option>
                      <option value="garden-center" className="bg-secondary text-secondary-foreground">Independent Garden Center</option>
                      <option value="florist" className="bg-secondary text-secondary-foreground">Retail Florist</option>
                      <option value="grocery" className="bg-secondary text-secondary-foreground">Grocery / Supermarket</option>
                      <option value="hardware" className="bg-secondary text-secondary-foreground">Hardware / Box Store</option>
                      <option value="other" className="bg-secondary text-secondary-foreground">Other (Specify in notes)</option>
                    </select>
                  </div>

                  <div>
                    <Input required type="text" placeholder="Reseller Tax ID / Business License # *" className="border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/40" />
                  </div>

                  <div>
                    <textarea placeholder="Tell us about your business and purchasing volume..." rows={3} className="flex w-full border-b border-secondary-foreground/20 bg-transparent px-0 py-2 text-base text-secondary-foreground placeholder:text-secondary-foreground/40 focus-visible:outline-none focus-visible:border-primary transition-colors resize-none"></textarea>
                  </div>

                  <div className="pt-6">
                    <Button 
                      type="submit" 
                      disabled={formState === 'submitting'}
                      className="w-full"
                    >
                      {formState === 'submitting' ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
