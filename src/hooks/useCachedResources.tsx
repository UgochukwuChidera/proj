import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Resource } from "@/lib/mock-data";

let cachedResources: Resource[] | null = null;

export function useCachedResources() {
  const [resources, setResources] = useState<Resource[]>(cachedResources || []);
  const [isFetching, setIsFetching] = useState(cachedResources === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedResources) return; // already fetched once

    const fetchResources = async () => {
      setIsFetching(true);
      try {
        const { data, error } = await supabase
          .from("resources")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        cachedResources = data as Resource[];
        setResources(data as Resource[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsFetching(false);
      }
    };

    fetchResources();
  }, []);

  return { resources, isFetching, error, setResources };
}
