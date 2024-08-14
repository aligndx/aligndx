"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { motion, MotionProps } from "framer-motion"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

type TabsListRef = React.ElementRef<typeof TabsPrimitive.List>
type TabsListProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>

const TabsList = React.forwardRef<TabsListRef, TabsListProps>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
)
TabsList.displayName = TabsPrimitive.List.displayName

type TabsTriggerRef = React.ElementRef<typeof TabsPrimitive.Trigger>
type TabsTriggerProps = Omit<React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>, keyof MotionProps> & MotionProps & {
  'data-state'?: 'active' | 'inactive';
}

const TabsTrigger = React.forwardRef<TabsTriggerRef, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => (
    
    <TabsPrimitive.Trigger
      ref={ref}
      asChild
      value={value}
    >
      <motion.button
        ref={ref as React.Ref<HTMLButtonElement>}
        whileHover={{ scale: props['data-state'] !== 'active' ? 1.05 : 1 }}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
          className
        )}
        {...props}
      />
    </TabsPrimitive.Trigger>
  )
)
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

type TabsContentRef = React.ElementRef<typeof TabsPrimitive.Content>
type TabsContentProps = Omit<React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>, keyof MotionProps> & MotionProps

const TabsContent = React.forwardRef<TabsContentRef, TabsContentProps>(
  ({ className, value, ...props }, ref) => (
    <TabsPrimitive.Content
      ref={ref}
      asChild
      value={value}
    >
      <motion.div
        ref={ref as React.Ref<HTMLDivElement>}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        {...props}
      />
    </TabsPrimitive.Content>
  )
)
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
