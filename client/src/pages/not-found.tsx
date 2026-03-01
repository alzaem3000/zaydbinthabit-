import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4" data-testid="page-not-found">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="h-16 w-16 text-destructive" />
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-404-title">
              الصفحة غير موجودة
            </h1>
            <p className="text-muted-foreground" data-testid="text-404-message">
              عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
            </p>
            <Link href="/">
              <Button className="gap-2" data-testid="button-go-home">
                <Home className="h-4 w-4" />
                العودة للرئيسية
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
