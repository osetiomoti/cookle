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

  // localStorageから保存されたグループIDを初期同期読み込みし、後続クエリのウォーターフォールを防止
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('cookle_current_group');
      } catch {}
    }
    return null;
  });

  useEffect(() => {
    if (groups && groups.length > 0) {
      if (!currentGroupId) {
        setCurrentGroupId(groups[0].id);
        localStorage.setItem('cookle_current_group', groups[0].id);
      } else {
        const found = groups.find((g) => g.id === currentGroupId);
        if (!found) {
          setCurrentGroupId(groups[0].id);
          localStorage.setItem('cookle_current_group', groups[0].id);
        }
      }
    }
  }, [groups, currentGroupId]);

  const currentGroup = groups?.find((g) => g.id === currentGroupId) || (currentGroupId ? ({ id: currentGroupId, name: '', description: null, imageKey: null, inviteCode: '', myRole: 'MEMBER', memberCount: 1 } as GroupInfo) : null);

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
