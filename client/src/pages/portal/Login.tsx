import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
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
  rfc: z.string().min(1, "Ingresa tu RFC"),
  password: z.string().optional(),
});

const setupPasswordSchema = z.object({
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirma tu contraseña"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type SetupPasswordForm = z.infer<typeof setupPasswordSchema>;

export default function PortalLogin() {
  const [, setLocation] = useLocation();
  const { login, setupPassword, isAuthenticated, clienteId, clientInfo, clientError } = usePortalAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [currentRfc, setCurrentRfc] = useState("");
  const [employeeName, setEmployeeName] = useState("");

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rfc: "",
      password: "",
    },
  });

  const setupForm = useForm<SetupPasswordForm>({
    resolver: zodResolver(setupPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    setLocation(`/portal/${clienteId}`);
    return null;
  }

  // Show error if invalid client slug
  if (clientError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-destructive/5 to-background flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Portal no encontrado</h1>
          <p className="text-muted-foreground">
            {clientError}
          </p>
        </div>
      </div>
    );
  }

  const onLoginSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const result = await login(data.rfc, data.password);

      if (result.requiresPasswordSetup) {
        // First login - need to setup password
        setCurrentRfc(data.rfc);
        setEmployeeName(result.employeeName || "");
        setSetupMode(true);
        toast({
          title: "Primera vez",
          description: "Configura tu contraseña para acceder al portal",
        });
      } else if (result.success) {
        setLocation(`/portal/${clienteId}`);
      }
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

  const onSetupSubmit = async (data: SetupPasswordForm) => {
    setIsLoading(true);
    try {
      await setupPassword(currentRfc, data.password);
      toast({
        title: "Contraseña configurada",
        description: "Ahora puedes iniciar sesión con tu nueva contraseña",
      });
      // Reset to login mode with RFC pre-filled
      setSetupMode(false);
      loginForm.setValue("rfc", currentRfc);
      loginForm.setValue("password", "");
      setupForm.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo configurar la contraseña",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setSetupMode(false);
    setCurrentRfc("");
    setEmployeeName("");
    setupForm.reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#135bec]/5 to-white flex flex-col">
      {/* Logo area */}
      <div className="flex-1 flex items-end justify-center pb-8 pt-safe">
        <div className="text-center">
          <div className="w-20 h-20 bg-[#135bec] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#135bec]/30">
            <span className="text-3xl font-bold text-white">
              HR
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {clientInfo ? `Portal ${clientInfo.nombreComercial}` : "Portal Empleados"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {setupMode ? "Configura tu contraseña" : "Accede a tu información laboral"}
          </p>
        </div>
      </div>

      {/* Form area */}
      <div className="flex-1 px-6 pb-safe">
        <div className="max-w-sm mx-auto">
          {setupMode ? (
            // Password Setup Form
            <>
              <div className="mb-6 p-4 bg-[#135bec]/5 rounded-xl border border-[#135bec]/10">
                <div className="flex items-center gap-2 text-[#135bec] mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">RFC verificado</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {employeeName ? `Hola, ${employeeName}` : `RFC: ${currentRfc}`}
                </p>
              </div>

              <Form {...setupForm}>
                <form onSubmit={setupForm.handleSubmit(onSetupSubmit)} className="space-y-4">
                  <FormField
                    control={setupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nueva contraseña</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Mínimo 6 caracteres"
                              autoComplete="new-password"
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
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={setupForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar contraseña</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Repite tu contraseña"
                              autoComplete="new-password"
                              className="h-12 text-base pr-12"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-12 w-12"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <Eye className="h-5 w-5 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-[#135bec] hover:bg-[#0f4ed8] text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar contraseña"
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-4">
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={handleBackToLogin}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al inicio
                </Button>
              </div>
            </>
          ) : (
            // Login Form
            <>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="rfc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RFC</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="XAXX010101000"
                            autoComplete="username"
                            autoCapitalize="characters"
                            className="h-12 text-base uppercase"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
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
                    className="w-full h-12 text-base font-semibold bg-[#135bec] hover:bg-[#0f4ed8] text-white"
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
                <Button variant="ghost" className="text-sm text-[#135bec] hover:text-[#0f4ed8] hover:bg-[#135bec]/5">
                  ¿Olvidaste tu contraseña?
                </Button>
              </div>

              <p className="mt-8 text-center text-xs text-gray-400">
                Si no tienes acceso, contacta a Recursos Humanos
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
