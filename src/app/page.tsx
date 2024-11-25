import { HydrateClient } from "@/trpc/server";

export default async function Home() {
  return (
    <HydrateClient>
      <div className="flex min-h-screen flex-col items-center justify-center">
        Home
      </div>
    </HydrateClient>
  );
}
