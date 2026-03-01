export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export function baseSlugFromEmail(email: string) {
  const local = email.split("@")[0] ?? "user";
  return slugify(local) || "tenant";
}