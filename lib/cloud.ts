import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { PetState } from "./types";

export type CloudSave = { pet: PetState; updatedAt: string };

let client: SupabaseClient | null | undefined;

export function cloudConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

function getClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  client = url && key ? createClient(url, key) : null;
  return client;
}

export async function getCloudUser(): Promise<User | null> {
  const supabase = getClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function loadCloudSave(): Promise<CloudSave | null> {
  const supabase = getClient();
  const user = await getCloudUser();
  if (!supabase || !user) return null;
  const { data, error } = await supabase
    .from("buddy_saves")
    .select("pet, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data?.pet) return null;
  return { pet: data.pet as PetState, updatedAt: String(data.updated_at) };
}

export async function saveCloudPet(pet: PetState): Promise<void> {
  const supabase = getClient();
  const user = await getCloudUser();
  if (!supabase || !user) return;
  const { error } = await supabase.from("buddy_saves").upsert(
    { user_id: user.id, pet, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export async function sendCloudSignInLink(email: string): Promise<void> {
  const supabase = getClient();
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signOutCloud(): Promise<void> {
  const supabase = getClient();
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
