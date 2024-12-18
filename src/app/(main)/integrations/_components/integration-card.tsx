import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

interface IntegrationCardProps {
  name: string
  description: string
  icon: string
  onClick?: () => void
}

export function IntegrationCard({ name, description, icon, onClick }: IntegrationCardProps) {
  return (
    <Card 
      className="border border-border/40 cursor-pointer transition-colors hover:bg-zinc-50"
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Image
                src={icon}
                alt={name}
                width={24}
                height={24}
                className="h-6 w-6"
              />
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-1">{name}</h3>
            <p className="text-sm text-muted-foreground leading-normal">
              {description}
            </p>
          </div>

          <Button
            variant="default"
            className="w-full mt-2 text-xs h-8"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            Connect
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

