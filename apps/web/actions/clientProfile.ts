"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentClient } from "@/lib/auth/getCurrentClient";
import { revalidatePath } from "next/cache";

const updateClientProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Inserisci almeno 2 caratteri."),
  phone: z
    .string()
    .trim()
    .max(30, "Numero troppo lungo.")
    .optional()
    .or(z.literal("")),
  sex: z.enum(["MALE", "FEMALE", "OTHER", ""]).optional(),
  heightCm: z
    .string()
    .trim()
    .optional()
    .refine((v) => {
      if (!v || v === "") return true;
      const n = Number(v);
      return Number.isFinite(n) && n >= 50 && n <= 250;
    }, "Inserisci un'altezza valida in cm."),
  birthDate: z
    .string()
    .trim()
    .optional()
    .refine((v) => {
      if (!v || v === "") return true;
      return !Number.isNaN(Date.parse(v));
    }, "Inserisci una data valida."),
});

export type UpdateClientProfileState = {
  ok: boolean;
  error?: string;
  success?: string;
};

export async function updateClientProfile(
  _prevState: UpdateClientProfileState,
  formData: FormData
): Promise<UpdateClientProfileState> {
  const { client } = await getCurrentClient();

  const parsed = updateClientProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    sex: formData.get("sex"),
    heightCm: formData.get("heightCm"),
    birthDate: formData.get("birthDate"),
  });

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)
      .flat()
      .find(Boolean);

    return {
      ok: false,
      error: firstError || "Dati non validi.",
    };
  }

  const { fullName, phone, sex, heightCm, birthDate } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.client.update({
        where: { id: client.id },
        data: {
          fullName,
          phone: phone || null,
        },
      });

      await tx.clientProfile.upsert({
        where: {
          clientId: client.id,
        },
        update: {
          heightMm:
            heightCm && heightCm !== ""
              ? Math.round(Number(heightCm) * 10)
              : null,
          sex: sex ? sex : null,
          birthDate:
            birthDate && birthDate !== "" ? new Date(birthDate) : null,
        },
        create: {
          tenantId: client.tenantId ?? null,
          clientId: client.id,
          heightMm:
            heightCm && heightCm !== ""
              ? Math.round(Number(heightCm) * 10)
              : null,
          sex: sex ? sex : null,
          birthDate:
            birthDate && birthDate !== "" ? new Date(birthDate) : null,
        },
      });
    });

    revalidatePath("/c/profile");
    revalidatePath("/c");

    return {
      ok: true,
      success: "Profilo aggiornato con successo.",
    };
  } catch (error) {
    console.error("updateClientProfile error:", error);
    return {
      ok: false,
      error: "Errore durante il salvataggio del profilo.",
    };
  }
}