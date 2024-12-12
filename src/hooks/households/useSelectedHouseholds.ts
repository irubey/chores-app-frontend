import { useHouseholds } from "@/hooks/households/useHouseholds";
import { useAuthUser } from "@/contexts/UserContext";
import { useMemo } from "react";

export interface SelectedHouseholds {
  total: number;
  accessible: number;
  ids: string[];
  accessibleIds: string[];
}

export function useSelectedHouseholds() {
  const user = useAuthUser();
  const { data: householdsData, isLoading } = useHouseholds();

  const selectedHouseholds = useMemo<SelectedHouseholds>(() => {
    const households = householdsData?.data ?? [];

    // Early return if no data or user
    if (!households.length || !user?.id) {
      return {
        total: 0,
        accessible: 0,
        ids: [],
        accessibleIds: [],
      };
    }

    // Memoize the accessible households calculation
    const accessible = households.filter((h) =>
      h.members?.some(
        (m) => m.userId === user.id && m.isAccepted && !m.leftAt && m.isSelected
      )
    );

    return {
      total: households.length,
      accessible: accessible.length,
      ids: households.map((h) => h.id),
      accessibleIds: accessible.map((h) => h.id),
    };
  }, [householdsData?.data, user?.id]);

  return {
    selectedHouseholds,
    isLoading,
  };
}
