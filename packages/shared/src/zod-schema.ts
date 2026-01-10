import { z } from "zod"

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  // confirmPassword usually handled on client, but API might just take email/password
})

export const CreateDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional().default("Untitled"),
  content: z.any().optional(), // Tiptap JSON content, validation is complex, 'any' for now or custom validator
})

export const UpdateDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.any().optional(),
})
