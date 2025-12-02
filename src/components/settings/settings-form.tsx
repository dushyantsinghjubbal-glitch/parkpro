'use client';

import { useActionState, useEffect, useRef } from 'react';
import { updatePricingConfig } from '@/lib/actions';
import type { PricingConfig } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? <Loader2 className="animate-spin" /> : 'Save Changes'}
    </Button>
  );
}

type SettingsFormProps = {
  currentConfig: PricingConfig;
};

export function SettingsForm({ currentConfig }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updatePricingConfig, null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast({
        title: 'Success',
        description: state.success,
      });
    }
  }, [state, toast]);
  
  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="hourlyRate">Hourly Rate (Rs)</Label>
          <Input
            id="hourlyRate"
            name="hourlyRate"
            type="number"
            defaultValue={currentConfig.hourlyRate}
            required
            aria-describedby="hourly-error"
          />
          {state?.error?.hourlyRate && (
            <p id="hourly-error" className="text-sm text-destructive">{state.error.hourlyRate[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dailyRate">Daily Rate (Rs)</Label>
          <Input
            id="dailyRate"
            name="dailyRate"
            type="number"
            defaultValue={currentConfig.dailyRate}
            required
            aria-describedby="daily-error"
          />
           {state?.error?.dailyRate && (
            <p id="daily-error" className="text-sm text-destructive">{state.error.dailyRate[0]}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="monthlyRate">Monthly Rate (Rs)</Label>
          <Input
            id="monthlyRate"
            name="monthlyRate"
            type="number"
            defaultValue={currentConfig.monthlyRate}
            required
            aria-describedby="monthly-error"
          />
           {state?.error?.monthlyRate && (
            <p id="monthly-error" className="text-sm text-destructive">{state.error.monthlyRate[0]}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dailyRateHoursThreshold">Daily Rate Threshold (Hours)</Label>
          <Input
            id="dailyRateHoursThreshold"
            name="dailyRateHoursThreshold"
            type="number"
            defaultValue={currentConfig.dailyRateHoursThreshold}
            required
            aria-describedby="threshold-error"
          />
          {state?.error?.dailyRateHoursThreshold && (
            <p id="threshold-error" className="text-sm text-destructive">{state.error.dailyRateHoursThreshold[0]}</p>
          )}
        </div>
      </div>

      {state?.error?._form && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {state.error._form[0]}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <SubmitButton pending={isPending} />
      </div>
    </form>
  );
}
