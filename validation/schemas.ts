import { z } from "zod";

const postalCode = /^\d{2}-\d{3}$/;
const phonePl = /^(\+48)?\s?\d{3}[\s-]?\d{3}[\s-]?\d{3}$/;

export const bookingAddressSchema = z.object({
  street: z.string().trim().min(3, "Podaj ulicę i numer.").max(120),
  postalCode: z.string().trim().regex(postalCode, "Kod pocztowy w formacie 00-000."),
  city: z.string().trim().min(2, "Podaj miasto.").max(60),
  name: z.string().trim().min(2, "Podaj imię.").max(60),
  phone: z.string().trim().regex(phonePl, "Podaj numer telefonu, np. 600 123 456."),
  notes: z.string().trim().max(500, "Maksymalnie 500 znaków.").optional().or(z.literal("")),
});

export type BookingAddress = z.infer<typeof bookingAddressSchema>;

export const bookingSchema = z.object({
  providerId: z.string().min(1),
  serviceId: z.string().min(1),
  optionIds: z.array(z.string()).max(10),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Wybierz datę."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Wybierz godzinę."),
  address: bookingAddressSchema,
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const requestSchema = z.object({
  categorySlug: z.string().min(1, "Wybierz kategorię."),
  title: z.string().trim().min(5, "Tytuł powinien mieć co najmniej 5 znaków.").max(100, "Maksymalnie 100 znaków."),
  description: z.string().trim().min(20, "Opisz zadanie w co najmniej 20 znakach — to pomoże specjalistom w wycenie.").max(2000),
  citySlug: z.string().min(1, "Wybierz miasto."),
  preferredDate: z.enum(["asap", "this_week", "next_week", "flexible", "date"]),
  exactDate: z.string().optional().or(z.literal("")),
  budget: z.union([z.coerce.number().int().min(0).max(1_000_000), z.literal("")]).optional(),
  photos: z.array(z.string()).max(6, "Możesz dodać maksymalnie 6 zdjęć.").default([]),
  contactEmail: z.string().trim().email("Podaj poprawny adres e-mail."),
}).refine((d) => d.preferredDate !== "date" || !!d.exactDate, { message: "Wybierz datę.", path: ["exactDate"] });

export type RequestInput = z.input<typeof requestSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Podaj poprawny adres e-mail."),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const onboardingSchema = z.object({
  providerType: z.enum(["private", "freelancer", "sole_trader", "company"], { message: "Wybierz jedną z opcji." }),
  primaryCategory: z.string().min(1, "Wybierz główną kategorię."),
  secondaryCategories: z.array(z.string()).max(3),
  citySlug: z.string().min(1, "Wybierz miasto."),
  radiusKm: z.coerce.number().int().min(1).max(100),
  services: z.array(z.object({
    name: z.string().trim().min(3, "Podaj nazwę usługi."),
    priceFrom: z.coerce.number().int().min(1, "Podaj cenę."),
    unit: z.enum(["usługa", "godz.", "m²", "szt."]),
  })).min(1, "Dodaj co najmniej jedną usługę."),
  days: z.array(z.number().int().min(0).max(6)).min(1, "Wybierz co najmniej jeden dzień."),
  hoursFrom: z.string().regex(/^\d{2}:\d{2}$/),
  hoursTo: z.string().regex(/^\d{2}:\d{2}$/),
  firstName: z.string().trim().min(2, "Podaj imię."),
  lastName: z.string().trim().min(2, "Podaj nazwisko."),
  headline: z.string().trim().min(10, "Napisz krótko, czym się zajmujesz (min. 10 znaków).").max(90),
  bio: z.string().trim().min(40, "Opis powinien mieć co najmniej 40 znaków.").max(1500),
  portfolioTitles: z.array(z.string()).max(12),
});

export type OnboardingInput = z.input<typeof onboardingSchema>;
