import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof loginSchema>) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response;
    },
    onSuccess: () => {
      // Force a full page refresh to ensure proper auth state loading
      window.location.href = "/";
    },
    onError: (error: Error) => {
      const errorMessage = error.message.includes("401") 
        ? "Invalid username or password." 
        : error.message.includes("403")
        ? "Account is inactive. Please contact administrator."
        : "Login failed. Please try again.";
      
      setError(errorMessage);
    },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    setError(null);
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary text-primary-foreground rounded-full p-3">
              <MessageSquare className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Showline Solutions</h1>
          <p className="mt-2 text-gray-600">Professional WhatsApp Business Platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter your username"
                          autoComplete="username"
                          autoFocus
                        />
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
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter your password"
                          autoComplete="current-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 text-center">
                <strong>Default Admin Credentials:</strong>
              </p>
              <p className="text-sm text-gray-600 text-center mt-1">
                Username: <code className="bg-gray-200 px-1 rounded">demouser</code>
              </p>
              <p className="text-sm text-gray-600 text-center">
                Password: <code className="bg-gray-200 px-1 rounded">Demo@12345</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}