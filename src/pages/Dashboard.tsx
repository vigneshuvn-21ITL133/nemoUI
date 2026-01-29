import { LayoutDashboard, FileText, CheckSquare, Link2, ArrowUpRight, Clock, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useTasks } from "@/hooks/useTasks";
import { useFiles } from "@/hooks/useFiles";
import { useLinks } from "@/hooks/useLinks";
import { format } from "date-fns";

export default function Dashboard() {
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { files, isLoading: filesLoading } = useFiles();
  const { links, isLoading: linksLoading } = useLinks();

  const isLoading = tasksLoading || filesLoading || linksLoading;

  const activeTasks = tasks.filter((t) => t.status !== "done");

  const stats = [
    { label: "Total Files", value: files.length.toString(), icon: FileText, color: "bg-module-file", href: "/files" },
    { label: "Active Tasks", value: activeTasks.length.toString(), icon: CheckSquare, color: "bg-module-task", href: "/tasks" },
    { label: "Saved Links", value: links.length.toString(), icon: Link2, color: "bg-module-link", href: "/links" },
  ];

  // Build recent activity from actual data
  const recentActivity = [
    ...files.slice(0, 2).map((f) => ({
      type: "file" as const,
      action: "Uploaded",
      name: f.name,
      time: format(new Date(f.created_at), "MMM d, h:mm a"),
      date: new Date(f.created_at),
    })),
    ...tasks.slice(0, 2).map((t) => ({
      type: "task" as const,
      action: t.status === "done" ? "Completed" : "Created",
      name: t.title,
      time: format(new Date(t.updated_at), "MMM d, h:mm a"),
      date: new Date(t.updated_at),
    })),
    ...links.slice(0, 2).map((l) => ({
      type: "link" as const,
      action: "Added",
      name: l.title,
      time: format(new Date(l.created_at), "MMM d, h:mm a"),
      date: new Date(l.created_at),
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  const getActivityColor = (type: string) => {
    switch (type) {
      case "file":
        return "text-module-file";
      case "task":
        return "text-module-task";
      case "link":
        return "text-module-link";
      default:
        return "text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <PageHeader
        title="Dashboard"
        description="Here's an overview of your workspace."
        icon={<LayoutDashboard className="w-6 h-6 text-primary" />}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.href}>
            <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`flex items-center justify-center w-14 h-14 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Link to="/files">
              <Card className="group hover:bg-accent/50 transition-colors cursor-pointer border-dashed">
                <CardContent className="flex items-center gap-3 p-4">
                  <FileText className="w-5 h-5 text-module-file" />
                  <span className="font-medium">Upload File</span>
                </CardContent>
              </Card>
            </Link>
            <Link to="/tasks">
              <Card className="group hover:bg-accent/50 transition-colors cursor-pointer border-dashed">
                <CardContent className="flex items-center gap-3 p-4">
                  <CheckSquare className="w-5 h-5 text-module-task" />
                  <span className="font-medium">Create Task</span>
                </CardContent>
              </Card>
            </Link>
            <Link to="/links">
              <Card className="group hover:bg-accent/50 transition-colors cursor-pointer border-dashed">
                <CardContent className="flex items-center gap-3 p-4">
                  <Link2 className="w-5 h-5 text-module-link" />
                  <span className="font-medium">Save Link</span>
                </CardContent>
              </Card>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${getActivityColor(activity.type).replace("text-", "bg-")}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className={getActivityColor(activity.type)}>{activity.action}</span>{" "}
                        <span className="font-medium text-foreground truncate">{activity.name}</span>
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
