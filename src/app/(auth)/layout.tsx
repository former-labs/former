import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center gap-6 overflow-hidden">
      {children}
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.1}
        duration={3}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(950px_circle_at_center,white,transparent)]",
          "absolute inset-0 skew-y-12",
        )}
      />
    </div>
  );
}
