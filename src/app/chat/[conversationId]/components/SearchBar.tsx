import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { useOnClickOutside } from "usehooks-ts";

type SearchTypeOption<T extends string> = {
  label: string;
  value: T;
};

export const SearchBar = <T extends string>({
  onSearch,
  placeholder = "Search...",
  className,
  value,
  onChangeValue,
  searchType,
  searchTypeOptions,
  onSearchTypeChange,
  suggestedBoxComponent,
  suggestedBoxOrientation = "below",
  isLoading = false,
}: {
  onSearch: () => Promise<void>;
  value: string;
  onChangeValue: (value: string) => void;
  searchType?: T;
  searchTypeOptions?: SearchTypeOption<T>[];
  onSearchTypeChange?: (value: T) => void;
  placeholder?: string;
  className?: string;
  suggestedBoxComponent?: React.ReactNode;
  suggestedBoxOrientation?: "above" | "below";
  isLoading?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);

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
        "flex w-full flex-grow items-center gap-x-2 self-center py-2",
        className,
      )}
      ref={containerRef}
    >
      <div className="relative flex flex-grow">
        <div className="flex flex-grow">
          {searchTypeOptions && searchTypeOptions.length > 0 && (
            <Select value={searchType} onValueChange={onSearchTypeChange}>
              <SelectTrigger className="bg-primary-600 hover:bg-primary-500 h-full w-[180px] rounded-none rounded-l-lg border-0 text-white shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {searchTypeOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="hover:bg-primary-500"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <input
            type="text"
            value={value}
            onChange={(e) => onChangeValue(e.target.value)}
            className={cn(
              "focus:shadow-primary-200 shadow-xs font-md focus:border-primary-300 h-auto w-full resize-none gap-2 rounded border border-gray-300 bg-white px-2.5 py-2 text-gray-900 placeholder:text-gray-500 focus:shadow-[0px_0px_0px_4px] focus:outline-none",
              {
                "rounded-none rounded-r-lg":
                  searchTypeOptions && searchTypeOptions.length > 0,
              },
            )}
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
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
      <div className="flex h-full min-w-14 items-center justify-center">
        {isLoading ? (
          <div>LOADSPIN</div>
        ) : (
          <Button className="h-full w-full" onClick={handleSearchSubmit}>
            Search
          </Button>
        )}
      </div>
    </div>
  );
};
