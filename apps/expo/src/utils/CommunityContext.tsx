import AsyncStorage from "@react-native-async-storage/async-storage";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

interface CommunityContextType {
  communityId: string | null;
  setCommunityId: (id: string) => Promise<void>;
  isLoading: boolean;
}

const CommunityContext = createContext<CommunityContextType | undefined>(
  undefined,
);

const COMMUNITY_STORAGE_KEY = "@ogm:selected_community";

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const [communityId, setCommunityIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load community ID from storage on mount
  useEffect(() => {
    const loadCommunityId = async () => {
      try {
        const stored = await AsyncStorage.getItem(COMMUNITY_STORAGE_KEY);
        if (stored) {
          setCommunityIdState(stored);
        }
      } catch (error) {
        console.error("Failed to load community ID:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCommunityId();
  }, []);

  const setCommunityId = async (id: string) => {
    try {
      await AsyncStorage.setItem(COMMUNITY_STORAGE_KEY, id);
      setCommunityIdState(id);
    } catch (error) {
      console.error("Failed to save community ID:", error);
    }
  };

  return (
    <CommunityContext.Provider
      value={{ communityId, setCommunityId, isLoading }}
    >
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  const context = useContext(CommunityContext);
  if (context === undefined) {
    throw new Error("useCommunity must be used within a CommunityProvider");
  }
  return context;
}
