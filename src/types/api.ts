export type AuthContext = {
  userId: string;
  cognitoSub: string;
  email: string;
  groupId: string | null;
  idToken: string | null;
};

export type ApiResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

