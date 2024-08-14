import { forwardRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input, InputProps } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Eye, EyeClosed } from "@/components/icons"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"
import { ArrowBigUpDash } from "lucide-react"

const PasswordInput = forwardRef<HTMLInputElement, InputProps>(
	({ className, ...props }, ref) => {
		const [showPassword, setShowPassword] = useState(false)
		const [capsLockActive, setCapsLockActive] = useState(false);
		const handleKeyPress: React.KeyboardEventHandler<HTMLInputElement> = (
			event
		) => {
			const capsLockOn = event.getModifierState("CapsLock");
			setCapsLockActive(capsLockOn);
		};

		return (
			<div className="relative">
				<Input
					placeholder="••••••••"
					type={showPassword ? "text" : "password"}
					onKeyDown={handleKeyPress}
					className={cn("hide-password-toggle", className)}
					ref={ref}
					{...props}
				/>
				<div className="absolute right-0 top-0 h-full flex items-center">
					{capsLockActive && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<ArrowBigUpDash size={20} />
								</TooltipTrigger>
								<TooltipContent>
									<p>Caps Lock is on!</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="hover:bg-transparent"
						onClick={() => setShowPassword((prev) => !prev)}
					>
						{showPassword ? (
							<Eye
								className="hover:text-primary"
							/>
						) : (
							<EyeClosed
								className="hover:text-primary"
							/>
						)}
						<span className="sr-only">
							{showPassword ? "Hide password" : "Show password"}
						</span>

					</Button>
				</div>
				{/* hides browsers password toggles */}
				<style>{`
					.hide-password-toggle::-ms-reveal,
					.hide-password-toggle::-ms-clear {
						visibility: hidden;
						pointer-events: none;
						display: none;
					}
				`}</style>
			</div>
		)
	},
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }