import { Bell } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface Notification {
  id: number;
  recipientId: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationsPopover() {
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/notifications/${id}/mark-read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b flex items-center justify-between">
          <h4 className="font-semibold text-sm">التنبيهات</h4>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4">
              {unreadCount} جديد
            </Badge>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              لا توجد تنبيهات حالياً
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b last:border-0 hover:bg-accent/50 transition-colors cursor-pointer ${
                    !notification.isRead ? "bg-accent/20" : ""
                  }`}
                  onClick={() => {
                    if (!notification.isRead) {
                      markReadMutation.mutate(notification.id);
                    }
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold uppercase ${
                        notification.type === 'success' ? 'text-green-600' :
                        notification.type === 'error' ? 'text-destructive' :
                        notification.type === 'warning' ? 'text-yellow-600' :
                        'text-primary'
                      }`}>
                        {notification.type === 'success' ? 'نجاح' :
                         notification.type === 'error' ? 'تنبيه' :
                         notification.type === 'warning' ? 'تحذير' :
                         'معلومات'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(notification.createdAt), "HH:mm d MMM", { locale: ar })}
                      </span>
                    </div>
                    <h5 className="font-semibold text-sm leading-none">
                      {notification.title}
                    </h5>
                    <p className="text-xs text-muted-foreground leading-normal">
                      {notification.message}
                    </p>
                    {notification.link && (
                      <Link href={notification.link}>
                        <a className="text-[10px] text-primary hover:underline mt-1 font-medium">
                          عرض التفاصيل
                        </a>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
