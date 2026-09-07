import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { registerUser, loginUser, loginWithGoogleServer, getCurrentUser, type UserRecord } from "@/integrations/neon/auth.server";

const signUpSchema = z.object({
  email: z.string().email("Adresse email invalide."),
  password: z.string().min(6, "Le mot de passe doit comporter au moins 6 caractères."),
  fullName: z.string().min(2, "Veuillez entrer votre nom complet.").optional(),
  phone: z.string().optional(),
  countryCode: z.string().optional(),
});

export const signUpFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => signUpSchema.parse(data))
  .handler(async ({ data }) => {
    return await registerUser(data);
  });

const signInSchema = z.object({
  email: z.string().email("Adresse email invalide."),
  password: z.string().min(1, "Veuillez entrer votre mot de passe."),
});

export const signInFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => signInSchema.parse(data))
  .handler(async ({ data }) => {
    return await loginUser(data.email, data.password);
  });

const googleAuthSchema = z.object({
  idToken: z.string().optional(),
  code: z.string().optional(),
  redirectUri: z.string().optional(),
  email: z.string().email().optional(),
  fullName: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export const signInWithGoogleFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => googleAuthSchema.parse(data))
  .handler(async ({ data }) => {
    return await loginWithGoogleServer(data);
  });

export const getMeFn = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getCurrentUser();
  return { user };
});
