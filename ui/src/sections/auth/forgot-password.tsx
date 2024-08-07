'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { routes, useRouter } from "@/routes"
import Logo from "@/components/logo"
import { useApiService } from "@/services/api"
import { toast } from "@/components/ui/sonner"
import Link from "next/link"

const formSchema = z.object({
    email: z.string().email()
});

export default function ForgotPassword() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    })
    const { auth } = useApiService();
    const forgotPassword = auth.requestPasswordResetMutation;
    const router = useRouter();

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            await forgotPassword.mutateAsync(
                values.email,
                {
                    onSuccess: (data) => {
                        toast.success("Email sent.")
                    },
                    onError: (error) => {
                        toast.error("Could not send the email.")
                    },
                }
            );
        } catch (error) {
            console.error('Login error:', error);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto grid px-2 sm:w-[400px] space-y-6">
                <h1 className="text-3xl font-bold ">Forgot your password? </h1>
                <p className="text-sm">
                    Provide the email address associated with your account to recover your password.
                </p>
                <div className="space-y-3">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="email@domain.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Button type="submit">Reset Password</Button>
                <div>
                    <Link className="underline text-sm" href={routes.auth.signin}>Return to Sign In</Link>
                </div>
            </form>
        </Form>
    )
}
