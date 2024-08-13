'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import Logo from "@/components/logo"
import { PasswordInput } from "@/components/ui/passwordInput"
import { useApiService } from "@/services/api"
import { toast } from "@/components/ui/sonner"
import { routes, useRouter } from "@/routes"

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  passwordConfirm: z.string().min(8),
}).superRefine(({ passwordConfirm, password }, ctx) => {
  if (passwordConfirm !== password) {
    ctx.addIssue({
      code: "custom",
      message: "The passwords did not match",
      path: ['passwordConfirm']
    });
  }
});

export default function SignUp() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email : "",
      password : "",
      passwordConfirm : "",
    }
  })

  const { auth } = useApiService();
  const signup = auth.registerMutation;
  const router = useRouter();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { email, password, passwordConfirm, ...rest } = values;
    try {
      await signup.mutateAsync(
        { email, password, additionalData: { passwordConfirm, ...rest } },
        {
          onSuccess: (data) => {
            toast.success("SignUp Successful")
            router.push(routes.auth.signin)
          },
          onError: (error) => {
            toast.error("SignUp Failed")
          },
        }
      );
    } catch (error) {
      console.error('SignUp error:', error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto grid md:w-[400px] space-y-6">
        <div className="flex items-center justify-center">
          <Logo full={false} width={150} />
        </div>
        <h1 className="text-3xl font-bold ">Sign Up</h1>
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
          <div className="flex flex-row gap-2">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="passwordConfirm"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <PasswordInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button type="submit">Sign Up</Button>
      </form>
    </Form>
  )
}
