import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center px-4 bg-zinc-50">
      <h1 className="text-6xl font-black mb-6 tracking-tight text-zinc-900">
        Wypożycz samochód <span className="text-blue-600">przyszłości</span>
      </h1>
      <p className="text-xl text-zinc-600 mb-10 max-w-2xl">
        PremiumRent to najlepsza platforma do wypożyczania samochodów (Projekt z Zaawansowanych Architektur Baz Danych). Odkryj naszą luksusową i ekonomiczną flotę bazującą na czystym serwerze MySQL!
      </p>

      <div className="flex gap-4">
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 h-14" asChild>
          <Link href="/fleet">Zobacz Flotę</Link>
        </Button>
        <Button size="lg" variant="outline" className="text-lg px-8 h-14 bg-white hover:bg-zinc-100" asChild>
          <Link href="/login">Zaloguj się</Link>
        </Button>
      </div>
    </div>
  );
}
