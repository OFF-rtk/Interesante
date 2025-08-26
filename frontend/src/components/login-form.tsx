// components/LoginForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/utils/supabase/client";

// Schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpFormValues = z.infer<typeof signupSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const supabase = createClient();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SignUpFormValues | LoginFormValues>({
    resolver: zodResolver(mode === "login" ? loginSchema : signupSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
  });

  useEffect(() => {
    form.reset();
    setFormError(null);
  }, [mode, form]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  const onSubmit = async (data: SignUpFormValues | LoginFormValues) => {
    setLoadingAuth(true);
    setFormError(null);
    
    try {
      if (mode === "signup") {
        const response = await fetch(`${apiUrl}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Sign-up failed");
        alert("Sign up successful! Please check your email to confirm.");
        setMode("login");
      } else {
        // Step 1: Sign in with Supabase to get a token
        const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({
          email: (data as LoginFormValues).email,
          password: (data as LoginFormValues).password,
        });
        
        if (supabaseError) throw new Error(supabaseError.message);

        // Step 2: Exchange the token with your backend
        if (supabaseData.session) {
          const response = await fetch(`${apiUrl}/auth/signin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // Important: allows HttpOnly cookies
            body: JSON.stringify({ supabaseToken: supabaseData.session.access_token }),
          });
          
          const result = await response.json();
          if (!response.ok) throw new Error(result.message || "Backend sign-in failed");
          
          router.push("/dashboard");
          router.refresh();
        }
      }
    } catch (error) {
      setFormError((error as Error).message);
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setFormError(null);
    
    try {
      // Google OAuth initiates redirect flow
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      // If successful, Supabase will redirect immediately
    } catch (error) {
      setFormError((error as Error).message);
      setLoadingGoogle(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {mode === "login" ? "Welcome back" : "Get Started"}
          </CardTitle>
          <CardDescription>
            {mode === "login" 
              ? "Login with your Google account" 
              : "Sign up with your Google account"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-6">
                <div className="flex flex-col gap-4">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    type="button" 
                    onClick={handleGoogleLogin} 
                    disabled={loadingGoogle}
                  >
                    {loadingGoogle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {!loadingGoogle && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="currentColor"/>
                      </svg>
                    )}
                    {mode === "login" ? "Login with Google" : "Sign up with Google"}
                  </Button>
                </div>

                <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                  <span className="bg-card text-muted-foreground relative z-10 px-2">
                    Or continue with
                  </span>
                </div>

                <div className="grid gap-4">
                  {mode === "signup" && (
                    <div className="grid gap-3">
                      <FormField 
                        control={form.control} 
                        name="username" 
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField 
                    control={form.control} 
                    name="email" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="m@example.com" type="email" {...field} />
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
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your Password..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} 
                  />

                  {mode === "signup" && (
                    <FormField 
                      control={form.control} 
                      name="confirmPassword" 
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm Password..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} 
                    />
                  )}

                  {formError && (
                    <div className="p-3 rounded-md bg-destructive/15 border border-destructive/20">
                      <p className="text-sm font-medium text-destructive">{formError}</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loadingAuth}>
                    {loadingAuth && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {mode === "login" ? "Login" : "Sign Up"}
                  </Button>
                </div>

                <div className="text-center text-sm">
                  <p>
                    {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                    <button 
                      type="button"
                      className="underline underline-offset-4 hover:text-primary transition-colors" 
                      onClick={() => setMode(mode === "login" ? "signup" : "login")}
                    >
                      {mode === "login" ? "Sign up" : "Login"}
                    </button>
                  </p>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
