import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Building2, Pencil, Trash2, Loader2 } from "lucide-react";
import { AddDepartmentDialog } from "@/components/departments/AddDepartmentDialog";
import { EditDepartmentDialog } from "@/components/departments/EditDepartmentDialog";
import { DeleteDepartmentDialog } from "@/components/departments/DeleteDepartmentDialog";
import { format } from "date-fns";

interface Department {
  id: string;
  name: string;
  created_at: string | null;
  member_count?: number;
}

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const { toast } = useToast();

  const loadDepartments = async () => {
    setIsLoading(true);
    
    // Fetch departments
    const { data: deptData, error: deptError } = await supabase
      .from("departments")
      .select("*")
      .order("name");

    if (deptError) {
      toast({
        title: "Error",
        description: "Failed to load departments",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Fetch member counts for each department
    const { data: memberCounts, error: countError } = await supabase
      .from("members")
      .select("department_id")
      .not("department_id", "is", null);

    if (countError) {
      console.error("Error loading member counts:", countError);
    }

    // Calculate member counts
    const countMap = new Map<string, number>();
    memberCounts?.forEach((m) => {
      if (m.department_id) {
        countMap.set(m.department_id, (countMap.get(m.department_id) || 0) + 1);
      }
    });

    // Merge counts with departments
    const deptWithCounts = deptData.map((dept) => ({
      ...dept,
      member_count: countMap.get(dept.id) || 0,
    }));

    setDepartments(deptWithCounts);
    setFilteredDepartments(deptWithCounts);
    setIsLoading(false);
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDepartments(departments);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredDepartments(
        departments.filter((dept) =>
          dept.name.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, departments]);

  const handleAddSuccess = () => {
    setShowAddDialog(false);
    loadDepartments();
    toast({
      title: "Success",
      description: "Department added successfully",
    });
  };

  const handleEditSuccess = () => {
    setEditingDepartment(null);
    loadDepartments();
    toast({
      title: "Success",
      description: "Department updated successfully",
    });
  };

  const handleDeleteSuccess = () => {
    setDeletingDepartment(null);
    loadDepartments();
    toast({
      title: "Success",
      description: "Department deleted successfully",
    });
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Departments</h2>
          <p className="text-muted-foreground">
            Manage departments and view member distribution
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            All Departments
          </CardTitle>
          <CardDescription>
            View and manage all departments in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search departments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery
                  ? "No departments found matching your search"
                  : "No departments yet. Add one to get started."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department Name</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDepartments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {dept.member_count} {dept.member_count === 1 ? "member" : "members"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {dept.created_at
                          ? format(new Date(dept.created_at), "MMM d, yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingDepartment(dept)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingDepartment(dept)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!isLoading && filteredDepartments.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredDepartments.length} of {departments.length} departments
            </div>
          )}
        </CardContent>
      </Card>

      <AddDepartmentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleAddSuccess}
      />

      {editingDepartment && (
        <EditDepartmentDialog
          department={editingDepartment}
          open={!!editingDepartment}
          onOpenChange={(open) => !open && setEditingDepartment(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {deletingDepartment && (
        <DeleteDepartmentDialog
          department={deletingDepartment}
          open={!!deletingDepartment}
          onOpenChange={(open) => !open && setDeletingDepartment(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}
