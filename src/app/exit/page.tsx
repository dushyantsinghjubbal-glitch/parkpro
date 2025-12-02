import { ExitFlow } from '@/components/exit/exit-flow';
import { Header } from '@/components/layout/header';

export const metadata = {
  title: 'Car Exit',
};

export default function ExitPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Header title="Car Exit" />
      <main className="flex-1 p-4 md:p-6">
        <ExitFlow />
      </main>
    </div>
  );
}
