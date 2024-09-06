import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";

export function UserNav() {
  const { currentUser, logout } = useAuth();
  const username: string = currentUser?.email || "";
  const fallback = username.charAt(0).toUpperCase();
  
  // Media query to check if screen width is <= 768px (mobile)
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {isMobile ? (
        // Render Drawer for mobile view
        <div>
          <Button variant="ghost" className="h-[40px] w-[40px] rounded-full" onClick={() => setDrawerOpen(true)}>
            <Avatar>
              <AvatarImage src="/avatars/01.png" alt="profile-pic" />
              <AvatarFallback>{fallback}</AvatarFallback>
            </Avatar>
          </Button>
          <Drawer open={isDrawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Profile </DrawerTitle>
                <DrawerDescription className="text-sm leading-none">
                  {username}
                </DrawerDescription>
              </DrawerHeader>
              <div className="flex flex-col p-4 gap-4">
                <Button variant="secondary" >Settings</Button>
                <Button variant="ringHover" onClick={logout}>Log out</Button>
              </div>
              <DrawerFooter>
                <Button variant="ghost" onClick={() => setDrawerOpen(false)}>Close</Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      ) : (
        // Render DropdownMenu for larger screens
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-[40px] w-[40px] rounded-full">
              <Avatar>
                <AvatarImage src="/avatars/01.png" alt="profile-pic" />
                <AvatarFallback>{fallback}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs leading-none text-muted-foreground">
                  {username}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}
