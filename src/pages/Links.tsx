import { useState } from "react";
import { Link2, Plus, Trash2, Edit2, Search, ExternalLink, Globe, Copy, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLinks, Link as LinkType } from "@/hooks/useLinks";

const categories = ["Work", "Personal", "Research", "Development", "Design", "Other"];

const categoryColors: Record<string, string> = {
  Work: "bg-module-auth/20 text-module-auth",
  Personal: "bg-primary/20 text-primary",
  Research: "bg-chart-4/20 text-chart-4",
  Development: "bg-module-task/20 text-module-task",
  Design: "bg-module-link/20 text-module-link",
  Other: "bg-muted text-muted-foreground",
};

export default function Links() {
  const { links, isLoading, createLink, updateLink, deleteLink } = useLinks();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkType | null>(null);
  const [newLink, setNewLink] = useState({ title: "", url: "", category: "Other" });

  const filteredLinks = links.filter((link) => {
    const matchesSearch =
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || link.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreate = () => {
    if (!newLink.title.trim() || !newLink.url.trim()) {
      toast.error("Please enter both title and URL");
      return;
    }
    createLink.mutate({
      title: newLink.title,
      url: newLink.url.startsWith("http") ? newLink.url : `https://${newLink.url}`,
      category: newLink.category,
    });
    setNewLink({ title: "", url: "", category: "Other" });
    setIsCreateOpen(false);
  };

  const handleUpdate = () => {
    if (!editingLink) return;
    updateLink.mutate({
      id: editingLink.id,
      title: editingLink.title,
      url: editingLink.url,
      category: editingLink.category,
    });
    setEditingLink(null);
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
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
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Links"
        description="Save and organize your bookmarks"
        icon={<Link2 className="w-6 h-6 text-module-link" />}
        actions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Save Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save New Link</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter link title"
                    value={newLink.title}
                    onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    placeholder="https://example.com"
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newLink.category} onValueChange={(v) => setNewLink({ ...newLink, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={createLink.isPending}>
                  {createLink.isPending ? "Saving..." : "Save Link"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Links Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredLinks.map((link) => (
          <Card key={link.id} className="group hover:shadow-md transition-all">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-lg bg-module-link/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-module-link" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{link.title}</h4>
                  <p className="text-sm text-muted-foreground truncate">{getDomain(link.url)}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(link.url)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge className={categoryColors[link.category || "Other"] || categoryColors.Other}>
                  {link.category || "Other"}
                </Badge>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => setEditingLink(link)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteLink.mutate(link.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingLink} onOpenChange={(open) => !open && setEditingLink(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
          </DialogHeader>
          {editingLink && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editingLink.title}
                  onChange={(e) => setEditingLink({ ...editingLink, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={editingLink.url}
                  onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={editingLink.category || "Other"}
                  onValueChange={(v) => setEditingLink({ ...editingLink, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleUpdate} disabled={updateLink.isPending}>
              {updateLink.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {filteredLinks.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Link2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No links found</h3>
          <p className="text-muted-foreground">Save a link to get started</p>
        </div>
      )}
    </div>
  );
}
