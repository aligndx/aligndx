// Tremor Raw Tracker [v0.1.2]

import React from "react"
import * as HoverCardPrimitives from "@radix-ui/react-hover-card"

import { cn } from "@/lib/utils"

interface TrackerBlockProps {
  key?: string | number
  color?: string
  tooltip?: string
  hoverEffect?: boolean
  defaultBackgroundColor?: string
}

const Block = ({
  color,
  tooltip,
  defaultBackgroundColor,
  hoverEffect,
}: TrackerBlockProps) => {
  const [open, setOpen] = React.useState(false)
  return (
    <HoverCardPrimitives.Root
      open={open}
      onOpenChange={setOpen}
      openDelay={0}
      closeDelay={0}
    >
      <HoverCardPrimitives.Trigger onClick={() => setOpen(true)} asChild>
        <div className="size-full overflow-hidden px-[0.5px] transition first:rounded-l-[4px] first:pl-0 last:rounded-r-[4px] last:pr-0 sm:px-px">
          <div
            className={cn(
              "size-full rounded-[1px]",
              color || defaultBackgroundColor,
              hoverEffect ? "hover:opacity-50" : "",
            )}
          />
        </div>
      </HoverCardPrimitives.Trigger>
      <HoverCardPrimitives.Portal>
        <HoverCardPrimitives.Content
          sideOffset={10}
          side="top"
          align="center"
          avoidCollisions
          className={cn(
            // base
            "w-auto rounded-md px-2 py-1 text-sm shadow-md",
            // text color
            "text-white dark:text-gray-900",
            // background color
            "bg-gray-900 dark:bg-gray-50",
          )}
        >
          {tooltip}
        </HoverCardPrimitives.Content>
      </HoverCardPrimitives.Portal>
    </HoverCardPrimitives.Root>
  )
}

Block.displayName = "Block"

interface TrackerProps extends React.HTMLAttributes<HTMLDivElement> {
  data: TrackerBlockProps[]
  defaultBackgroundColor?: string
  hoverEffect?: boolean
}

const Tracker = React.forwardRef<HTMLDivElement, TrackerProps>(
  (
    {
      data = [],
      defaultBackgroundColor = "bg-gray-400 dark:bg-gray-400",
      className,
      hoverEffect,
      ...props
    },
    forwardedRef,
  ) => {
    return (
      <div
        ref={forwardedRef}
        className={cn("group flex h-8 w-full items-center", className)}
        {...props}
      >
        {data.map((blockProps, index) => {
          const { key, ...restProps } = blockProps; // Extract key to pass separately
          return (
            <Block
              key={key ?? index} // Pass key directly
              defaultBackgroundColor={defaultBackgroundColor}
              hoverEffect={hoverEffect}
              {...restProps} // Spread other props without key
            />
          );
        })}
      </div>
    )
  },
)


Tracker.displayName = "Tracker"

export { Tracker, type TrackerBlockProps }