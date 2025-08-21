"use client";

import { useState, useEffect, useCallback } from "react";
import type { Resource } from "@/lib/mock-data";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/auth-context";
import { ResourceCard } from "./resource-card";
import { FilterControls } from "./filter-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, Loader2, FilterX, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ResourceDisplayPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [areFiltersVisible, setAreFiltersVisible] = useState(true);

  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const { data: yearsData } = await supabase
        .from("resources")
        .select("year")
        .order("year", { ascending: false });

      setAvailableYears(
        [...new Set(yearsData?.map((r) => r.year) || [])].sort((a, b) => b - a)
      );

      const { data: typesData } = await supabase
        .from("resources")
        .select("type");
      setAvailableTypes(
        [...new Set(typesData?.map((r) => r.type) || [])].sort()
      );

      const { data: coursesData } = await supabase
        .from("resources")
        .select("course");
      setAvailableCourses(
        [...new Set(coursesData?.map((r) => r.course) || [])].sort()
      );
    } catch (err) {
      console.error("Error fetching filter options:", err);
    }
  }, []);

  const fetchResources = useCallback(
    async (filters?: {
      term?: string;
      year?: string;
      type?: string;
      course?: string;
    }) => {
      setIsFetching(true);
      setError(null);

      try {
        let query = supabase.from("resources").select("*");

        if (filters?.term) {
          query = query.or(
            `name.ilike.%${filters.term}%,description.ilike.%${filters.term}%,keywords.cs.{${filters.term}}`
          );
        }
        if (filters?.year)
          query = query.eq("year", parseInt(filters.year, 10));
        if (filters?.type) query = query.eq("type", filters.type);
        if (filters?.course) query = query.eq("course", filters.course);

        const { data, error: dbError } = await query.order("created_at", {
          ascending: false,
        });

        if (dbError) throw dbError;
        setResources(data as Resource[]);
      } catch (err: any) {
        let detailedErrorMessage = `Failed to load resources. Supabase error: "${
          err.message || "No specific message"
        }".`;
        if (err.details) detailedErrorMessage += ` Details: ${err.details}.`;
        if (err.hint) detailedErrorMessage += ` Hint: ${err.hint}.`;

        setError(detailedErrorMessage);
        setResources([]);
      } finally {
        setIsFetching(false);
      }
    },
    []
  );

  useEffect(() => {
    let ignore = false;

    if (authLoading) return;

    if (isAuthenticated) {
      fetchResources();
      fetchFilterOptions();
    } else {
      if (!ignore) {
        setResources([]);
        setIsFetching(false);
      }
    }

    return () => {
      ignore = true; // cleanup to avoid setting state after unmount
    };
  }, [authLoading, isAuthenticated, fetchResources, fetchFilterOptions]);

  const handleApplyFilters = () => {
    fetchResources({
      term: searchTerm,
      year: selectedYear,
      type: selectedType,
      course: selectedCourse,
    });
  };

  const handleResetFiltersAndRefresh = () => {
    setSearchTerm("");
    setSelectedYear("");
    setSelectedType("");
    setSelectedCourse("");
    fetchResources();
  };

  const handleResourceDeleted = (resourceId: string) => {
    setResources((prev) => prev.filter((r) => r.id !== resourceId));
  };

  // -------- UI ----------
  if (authLoading) {
    return (
      <div className="container mx-auto py-2 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto my-8" />
        <p>Verifying access...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-2">
        <Alert variant="destructive" className="mt-8">
          <Search className="h-4 w-4" />
          <AlertTitle className="font-headline">Access Denied</AlertTitle>
          <AlertDescription>
            You need to be logged in to view university resources.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-headline text-3xl font-bold text-primary">
          University Resources
        </h1>
        <Button
          variant="outline"
          onClick={() => setAreFiltersVisible(!areFiltersVisible)}
          className="font-body"
        >
          {areFiltersVisible ? (
            <FilterX className="mr-2 h-4 w-4" />
          ) : (
            <SlidersHorizontal className="mr-2 h-4 w-4" />
          )}
          {areFiltersVisible ? "Hide Filters" : "Show Filters"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6 whitespace-pre-wrap">
          <AlertTitle className="font-headline">
            Error Loading Resources
          </AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {areFiltersVisible && (
        <FilterControls
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          selectedCourse={selectedCourse}
          setSelectedCourse={setSelectedCourse}
          onApplyFilters={handleApplyFilters}
          onResetAndRefresh={handleResetFiltersAndRefresh}
          availableYears={availableYears}
          availableTypes={availableTypes}
          availableCourses={availableCourses}
          isFetching={isFetching}
        />
      )}

      {isFetching ? (
        <div className="text-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto my-4" />
          <p>Fetching resources...</p>
        </div>
      ) : resources.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              isAdmin={user?.isAdmin || false}
              onDeleteSuccess={handleResourceDeleted}
            />
          ))}
        </div>
      ) : (
        !error && (
          <Alert className="mt-8">
            <Search className="h-4 w-4" />
            <AlertTitle className="font-headline">
              No Resources Found
            </AlertTitle>
            <AlertDescription>
              Try adjusting your search terms or filters.
            </AlertDescription>
          </Alert>
        )
      )}
    </div>
  );
}
