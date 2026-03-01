import { useQuery, useMutation } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn<User | null>({ on401: "returnNull" }),
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { nationalId: string, mobileNumber: string }) => {
      const res = await apiRequest("POST", "/api/auth/teacher/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: { nationalId: string, mobileNumber: string, fullNameArabic: string }) => {
      const res = await apiRequest("POST", "/api/auth/teacher/register", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
    },
  });

  const adminLoginMutation = useMutation({
    mutationFn: async (credentials: { password: string }) => {
      const res = await apiRequest("POST", "/api/auth/admin/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
    },
  });

  const creatorLoginMutation = useMutation({
    mutationFn: async (credentials: { password: string }) => {
      const res = await apiRequest("POST", "/api/auth/creator/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logoutMutation,
    loginMutation,
    registerMutation,
    adminLoginMutation,
    creatorLoginMutation,
  };
}
