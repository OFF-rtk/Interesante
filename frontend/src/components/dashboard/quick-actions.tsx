import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Settings, HelpCircle } from "lucide-react";
import Link from "next/link";

export function QuickActions() {
  const actions = [
    {
      icon: <Upload className="h-5 w-5" />,
      title: "Upload Video",
      description: "Start protecting your content",
      href: "/analyze",
      primary: true
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "View Certificates",
      description: "Manage your certificates",
      href: "/certificates",
      primary: false
    },
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Account Settings",
      description: "Update your profile",
      href: "/settings",
      primary: false
    },
    {
      icon: <HelpCircle className="h-5 w-5" />,
      title: "Get Help",
      description: "Learn how to use the platform",
      href: "/features",
      primary: false
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Everything you need to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.primary ? "default" : "outline"}
              className="h-auto p-4 justify-start"
              asChild
            >
              <Link href={action.href}>
                <div className="flex items-center gap-3 w-full">
                  {action.icon}
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs opacity-80">{action.description}</div>
                  </div>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
