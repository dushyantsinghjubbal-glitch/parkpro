import { EntryForm } from '@/components/entry/entry-form';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const metadata = {
  title: 'Car Entry',
};

export default function EntryPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Header title="Car Entry" />
      <main className="flex-1 p-4 md:p-6">
        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Register a New Car</CardTitle>
              <CardDescription>Scan or enter the license plate and customer's mobile to begin parking.</CardDescription>
            </CardHeader>
            <CardContent>
              <EntryForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
