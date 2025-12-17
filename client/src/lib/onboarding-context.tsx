import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { OnboardingAudit, SectionStatus } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "./queryClient";

interface OnboardingContextType {
  audit: OnboardingAudit | null;
  isLoading: boolean;
  currentSection: number;
  setCurrentSection: (section: number) => void;
  updateSection: <K extends keyof OnboardingAudit>(key: K, data: OnboardingAudit[K]) => void;
  saveAudit: () => void;
  isSaving: boolean;
  getSectionStatus: (sectionNumber: number) => SectionStatus;
  getOverallProgress: () => number;
  markSectionComplete: (sectionNumber: number) => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}

interface OnboardingProviderProps {
  children: ReactNode;
  clienteId: number;
}

export function OnboardingProvider({ children, clienteId }: OnboardingProviderProps) {
  const [localAudit, setLocalAudit] = useState<OnboardingAudit | null>(null);
  const [currentSection, setCurrentSection] = useState(1);

  const auditQuery = useQuery<OnboardingAudit>({
    queryKey: ["/api/onboarding/audit", clienteId],
    refetchOnWindowFocus: false,
    enabled: !!clienteId,
  });

  const isLoading = auditQuery.isLoading;
  const audit = localAudit || auditQuery.data || null;

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<OnboardingAudit>) => {
      const response = await apiRequest("PUT", `/api/onboarding/audit/${clienteId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/audit", clienteId] });
    },
  });

  const updateSection = useCallback(<K extends keyof OnboardingAudit>(key: K, data: OnboardingAudit[K]) => {
    setLocalAudit((prev) => {
      if (!prev && audit) {
        return { ...audit, [key]: data, updatedAt: new Date().toISOString() };
      }
      if (prev) {
        return { ...prev, [key]: data, updatedAt: new Date().toISOString() };
      }
      return prev;
    });
  }, [audit]);

  const saveAudit = useCallback(() => {
    if (localAudit) {
      saveMutation.mutate(localAudit);
    }
  }, [localAudit, saveMutation]);

  const getSectionStatus = useCallback((sectionNumber: number): SectionStatus => {
    if (!audit) return "pending";
    return audit.sectionStatus?.[`section${sectionNumber}`] || "pending";
  }, [audit]);

  const getOverallProgress = useCallback(() => {
    if (!audit) return 0;
    const statuses = Object.values(audit.sectionStatus || {});
    if (statuses.length === 0) return 0;
    const completed = statuses.filter(s => s === "completed").length;
    return Math.round((completed / 12) * 100);
  }, [audit]);

  const markSectionComplete = useCallback((sectionNumber: number) => {
    setLocalAudit((prev) => {
      const base = prev || audit;
      if (!base) return prev;
      return {
        ...base,
        sectionStatus: {
          ...base.sectionStatus,
          [`section${sectionNumber}`]: "completed" as SectionStatus,
        },
        updatedAt: new Date().toISOString(),
      };
    });
  }, [audit]);

  return (
    <OnboardingContext.Provider
      value={{
        audit,
        isLoading,
        currentSection,
        setCurrentSection,
        updateSection,
        saveAudit,
        isSaving: saveMutation.isPending,
        getSectionStatus,
        getOverallProgress,
        markSectionComplete,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}
