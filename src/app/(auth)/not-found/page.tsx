import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PageNotFound() {
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-xl text-muted-foreground">
        Oops! The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Button asChild variant="outline" size="lg">
        <Link href="/">
          <ArrowLeft className="mr-2 size-4" />
          Back to Home
        </Link>
      </Button>
    </div>
  );
}
