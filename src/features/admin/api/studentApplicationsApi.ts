import { supabase } from "@/integrations/supabase/client";

const ENROLLMENT_APPLICATIONS_TABLE = "enrollment_applications_2025_11_15_16_09";

export async function getPendingApplicationsCount(): Promise<number> {
  const { count, error } = await supabase
    .from(ENROLLMENT_APPLICATIONS_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) throw error;

  return count ?? 0;
}
