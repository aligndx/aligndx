import { Button } from "@/components/ui/button";
import { Sun, Moon, HalfCircle } from "@/components/icons";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const { setTheme, theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleToggle = () => {
        if (theme === 'system') {
            setTheme('dark');
        } else if (resolvedTheme === 'dark') {
            setTheme('light');
        } else {
            setTheme('system');
        }
    };

    const renderIcon = () => {
        if (theme === 'system') {
            return <HalfCircle />;
        }
        if (resolvedTheme === 'dark') {
            return <Moon />;
        }
        return <Sun />;
    };

    const renderTooltipContent = () => {
        if (theme === 'system') {
            return <p>System</p>;
        }
        if (resolvedTheme === 'dark') {
            return <p>Dark</p>;
        }
        return <p>Light</p>;
    };

    if (!mounted) {
        return null;
    }

    return (
        <TooltipProvider>
            <Tooltip delayDuration={100}>
                <TooltipTrigger asChild >
                    <Button
                        className="rounded-full w-8 h-8 bg-background"
                        variant="outline"
                        size="icon"
                        onClick={handleToggle}>
                        {renderIcon()}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    {renderTooltipContent()}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
