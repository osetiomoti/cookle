'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import useSWR from 'swr';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarKey: string | null;
}

interface GroupInfo {
  id: string;
  name: string;
  description: string | null;
  imageKey: string | null;
  inviteCode: string;
  myRole: 'ADMIN' | 'MEMBER';
  memberCount: number;
}

interface AppContextValue {
  user: UserProfile | null;
  groups: GroupInfo[];
  currentGroup: GroupInfo | null;
  setCurrentGroup: (group: GroupInfo | null) => void;
  isLoading: boolean;
  mutateUser: () => void;
  mutateGroups: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { data: user, mutate: mutateUser, isLoading: userLoading } = useSWR<UserProfile>('/api/users/me');
  const { data: groups, mutate: mutateGroups, isLoading: groupsLoading } = useSWR<GroupInfo[]>('/api/groups');

  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (groups && groups.length > 0 && !currentGroupId) {
      // localStorage に保存されたグループがあれば復元、なければ最初のグループ
      const savedGroupId = localStorage.getItem('cookle_current_group');
      const found = groups.find((g) => g.id === savedGroupId);
      if (found) {
        setCurrentGroupId(found.id);
      } else {
        setCurrentGroupId(groups[0].id);
        localStorage.setItem('cookle_current_group', groups[0].id);
      }
    }
  }, [groups, currentGroupId]);

  const currentGroup = groups?.find((g) => g.id === currentGroupId) || null;

  const handleSetCurrentGroup = (group: GroupInfo | null) => {
    if (group) {
      setCurrentGroupId(group.id);
      localStorage.setItem('cookle_current_group', group.id);
    } else {
      setCurrentGroupId(null);
      localStorage.removeItem('cookle_current_group');
    }
  };

  return (
    <AppContext.Provider
      value={{
        user: user ?? null,
        groups: groups ?? [],
        currentGroup,
        setCurrentGroup: handleSetCurrentGroup,
        isLoading: userLoading || groupsLoading,
        mutateUser,
        mutateGroups,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

