import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useData } from "@/contexts/DataContext";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import React, { useRef, useState } from "react";
import { useOnClickOutside } from "usehooks-ts";

export const SearchBar = ({
  onSearch,
  placeholder = "Search...",
  className,
  value,
  onChangeValue,
  suggestedBoxComponent,
  suggestedBoxOrientation = "below",
  isLoading = false,
}: {
  onSearch: () => Promise<void>;
  value: string;
  onChangeValue: (value: string) => void;
  placeholder?: string;
  className?: string;
  suggestedBoxComponent?: React.ReactNode;
  suggestedBoxOrientation?: "above" | "below";
  isLoading?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const { activeIntegration } = useData();

  useOnClickOutside(containerRef, () => setIsFocused(false));

  const handleSearchSubmit = async () => {
    if (value) {
      await onSearch();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSearchSubmit();
    }
  };

  return (
    <div
      className={cn(
        "flex w-full items-center gap-2 rounded-lg bg-gray-100 p-2",
        className,
      )}
      ref={containerRef}
    >
      <div className="relative flex-grow">
        <div className="relative flex-grow">
          <Input
            value={value}
            onChange={(e) => onChangeValue(e.target.value)}
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            className="bg-white focus:outline-none"
          />
          {suggestedBoxComponent && isFocused && (
            <div
              className={cn(
                "z-9 absolute max-h-80 w-full overflow-y-scroll rounded border border-gray-300 bg-white",
                suggestedBoxOrientation === "below"
                  ? "top-0 mt-12"
                  : "bottom-0 mb-12",
              )}
            >
              {suggestedBoxComponent}
            </div>
          )}
        </div>
      </div>
      <Button
        onClick={handleSearchSubmit}
        disabled={isLoading || !activeIntegration}
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
