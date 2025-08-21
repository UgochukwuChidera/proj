"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ResourceCard } from "./resource-card";
import { FilterControls } from "./filter-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, Loader2, FilterX, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useCachedResources } from "@/hooks/useCachedResources";

export function ResourceDisplayPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const pathname = usePathname();

  // ✅ Use cached resources
  const { resources, isFetching, error, setResources } = useCachedResources();

  // UI state (same as before)
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [areFiltersVisible, setAreFiltersVisible] = useState(true);

  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);

  // Fake filter handling (still applied client-side on cached data)
  const filteredResources = resources.filter((r) => {
    return (
      (!searchTerm || r.name?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!selectedYear || r.year?.toString() === selectedYear) &&
      (!selectedType || r.type === selectedType) &&
      (!selectedCourse || r.course === selectedCourse)
    );
  });

  const handleResourceDeleted = (id: string) => {
    setResources((prev) => prev.filter((r) => r.id !== id));
  };

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
          <AlertTitle className="font-headline">Error Loading Resources</AlertTitle>
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
          onApplyFilters={() => {}}
          onResetAndRefresh={() => {}}
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
      ) : filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredResources.map((resource) => (
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
            <AlertTitle className="font-headline">No Resources Found</AlertTitle>
            <AlertDescription>
              Try adjusting your search terms or filters.
            </AlertDescription>
          </Alert>
        )
      )}
    </div>
  );
}
