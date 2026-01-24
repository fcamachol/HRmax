import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Ingresa tu correo electrónico"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function PortalLogin() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated } = usePortalAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    setLocation("/portal");
    return null;
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.username, data.password);
      setLocation("/portal");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description:
          error instanceof Error
            ? error.message
            : "Verifica tus credenciales e intenta de nuevo",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col">
      {/* Logo area */}
      <div className="flex-1 flex items-end justify-center pb-8 pt-safe">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl font-bold text-primary-foreground">
              HR
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Portal Empleados</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Accede a tu información laboral
          </p>
        </div>
      </div>

      {/* Login form */}
      <div className="flex-1 px-6 pb-safe">
        <div className="max-w-sm mx-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="tu@correo.com"
                        autoComplete="email"
                        autoCapitalize="off"
                        className="h-12 text-base"
                        {...field}
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
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="h-12 text-base pr-12"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-12 w-12"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Eye className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span className="sr-only">
                            {showPassword ? "Ocultar" : "Mostrar"} contraseña
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Button variant="link" className="text-sm text-muted-foreground">
              ¿Olvidaste tu contraseña?
            </Button>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Si no tienes acceso, contacta a Recursos Humanos
          </p>
        </div>
      </div>
    </div>
  );
}
