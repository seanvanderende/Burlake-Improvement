import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSubmitUnsubscribeRequest } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';

// Link-only page (not linked from any nav) for customers who want to be
// removed from our mailing/marketing lists. Submissions are reviewed by
// staff from an admin page — no automatic email is sent.
export default function Unsubscribe() {
  const [formState, setFormState] = React.useState<'idle' | 'submitting' | 'success'>('idle');
  const { toast } = useToast();

  const submitMutation = useSubmitUnsubscribeRequest({
    mutation: {
      onSuccess: () => {
        setFormState('success');
      },
      onError: (err: unknown) => {
        setFormState('idle');
        const message =
          err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        toast({ title: 'Submission failed', description: message, variant: 'destructive' });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    setFormState('submitting');
    submitMutation.mutate({
      data: {
        businessNameOrAccountNumber: data.get('businessNameOrAccountNumber') as string,
        email: data.get('email') as string,
      },
    });
  };

  return (
    <div className="bg-background pt-32 pb-24 min-h-screen">
      <div className="max-w-xl mx-auto px-6 md:px-12">
        <span className="inline-flex items-center gap-3 text-primary tracking-[0.2em] text-sm uppercase mb-6 font-semibold">
          <div className="w-8 h-px bg-primary" />
          Mailing Preferences
        </span>
        <h1 className="font-serif text-4xl md:text-5xl text-foreground leading-[1.1] mb-6">
          Unsubscribe
        </h1>
        <p className="text-muted-foreground text-lg font-light leading-relaxed mb-12">
          Let us know your business name or account number along with your email address, and
          we'll remove you from our mailing lists.
        </p>

        <div className="bg-secondary p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          {formState === 'success' ? (
            <div className="py-16 text-center flex flex-col items-center animate-in zoom-in duration-500">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-6">
                <CheckCircle2 size={32} />
              </div>
              <h4 className="font-serif text-2xl text-secondary-foreground mb-4">
                Request Received
              </h4>
              <p className="text-secondary-foreground/70 font-light max-w-md mx-auto">
                Thank you — we've received your request and will remove you from our mailing
                lists.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div>
                <Input
                  required
                  name="businessNameOrAccountNumber"
                  type="text"
                  placeholder="Business Name or Account Number *"
                  className="border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/40"
                />
              </div>
              <div>
                <Input
                  required
                  name="email"
                  type="email"
                  placeholder="Email Address *"
                  className="border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/40"
                />
              </div>

              <div className="pt-6">
                <Button type="submit" disabled={formState === 'submitting'} className="w-full">
                  {formState === 'submitting' ? 'Submitting…' : 'Unsubscribe'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
