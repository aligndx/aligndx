'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import Link from "next/link"
import { routes } from "@/routes"
import Logo from "@/components/logo"
import { useApiService } from "@/services/api"
import { toast } from "@/components/ui/sonner"
import { useAuth } from "@/contexts/auth-context"

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export default function SignIn() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email : "",
      password : ""
    }
  })
  const { login } = useAuth();

  function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const { email, password} = values
      login(email, password)
    } catch (error) {
      console.error('Login error:', error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto grid w-[400px] space-y-6">
        <div className="flex items-center justify-center">
          <Logo full={false} width={150} />
        </div>
        <h1 className="text-3xl font-bold ">Sign In </h1>
        <div className="space-y-6">
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel>Password</FormLabel>
                  <Link href={routes.auth.forgotPassword} className="ml-auto inline-block text-sm underline">
                    Forgot your password?
                  </Link>
                </div>
                <FormControl>
                  <Input placeholder="••••••••" type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit">Sign In</Button>

        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href={routes.auth.signup} className="underline">
            Sign up
          </Link>
        </div>
      </form>
    </Form>
  )
}
