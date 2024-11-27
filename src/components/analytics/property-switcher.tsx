"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useGoogleAnalytics } from "@/contexts/GoogleAnalyticsContext";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function PropertySwitcher() {
  const [open, setOpen] = useState(false);
  const { accounts, activeProperty, setActiveProperty } = useGoogleAnalytics();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="flex w-full items-center justify-between px-4 py-2"
        >
          <div className="flex items-center gap-2">
            {/* <div className="flex size-6 items-center justify-center rounded-md border bg-background">
              <ChartBar className="size-4" />
            </div> */}
            <span className="truncate font-medium">
              {activeProperty?.name ?? "Select GA4 Property"}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command className="w-full">
          <CommandInput placeholder="Search properties..." />
          <CommandList>
            <CommandEmpty>No properties found.</CommandEmpty>
            {accounts.map((account) => (
              <CommandGroup key={account.accountId} heading={account.name}>
                {account.properties.map((property) => (
                  <CommandItem
                    key={`${account.accountId}-${property.propertyId}`}
                    onSelect={() => {
                      setActiveProperty(property);
                      setOpen(false);
                    }}
                  >
                    {property.name}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({property.propertyId})
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
