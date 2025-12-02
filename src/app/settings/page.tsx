'use client';

import { useEffect, useState } from 'react';
import { getPricingConfig } from '@/lib/actions/pricing';
import type { PricingConfig } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { SettingsForm } from '@/components/settings/settings-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      try {
        setIsLoading(true);
        const config = await getPricingConfig();
        setPricingConfig(config);
      } catch (error) {
        console.error("Failed to fetch pricing config:", error);
        // Handle error, maybe show a toast
      } finally {
        setIsLoading(false);
      }
    }
    fetchConfig();
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Settings" />
      <main className="flex-1 p-4 md:p-6">
        <div className="flex justify-center">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Manage Pricing</CardTitle>
              <CardDescription>
                Update the parking rates for your facility. All prices should be entered in Rupees (Rs).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                   <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-1/3 ml-auto" />
                </div>
              ) : pricingConfig ? (
                <SettingsForm currentConfig={pricingConfig} />
              ) : (
                <p>Could not load pricing configuration.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
