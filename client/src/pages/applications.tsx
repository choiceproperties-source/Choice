import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Breadcrumb } from "@/components/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { updateMetaTags } from "@/lib/seo";

interface Application {
  id: number;
  propertyTitle: string;
  propertyId: string;
  timestamp: string;
  status: "submitted" | "under-review" | "approved" | "rejected";
  firstName: string;
  lastName: string;
}

export default function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    updateMetaTags({
      title: "My Applications - Choice Properties",
      description: "View and track your rental applications."
    });

    // Load applications from localStorage
    const saved = JSON.parse(localStorage.getItem("choiceProperties_applications") || "[]");
    setApplications(saved);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "under-review":
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      approved: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
      rejected: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
      "under-review": "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
      submitted: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
    };
    return variants[status] || variants.submitted;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <Breadcrumb items={[{ label: "My Applications" }]} />

      <div className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-primary mb-2">My Applications</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Track all your rental applications in one place.</p>

          {applications.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Applications Yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Start browsing properties and submit your first application.</p>
                <Link href="/properties">
                  <Button className="bg-primary hover:bg-primary/90">Browse Properties</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <Card key={app.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{app.propertyTitle}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Applied by {app.firstName} {app.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(app.timestamp).toLocaleDateString()} at{" "}
                          {new Date(app.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        {getStatusIcon(app.status)}
                        <Badge className={getStatusBadge(app.status)}>
                          {app.status === "under-review" ? "Under Review" : app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <Link href={`/property/${app.propertyId}`}>
                      <Button variant="outline" size="sm" className="mt-4">
                        View Property
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
