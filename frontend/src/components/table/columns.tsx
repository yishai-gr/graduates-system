import type { ColumnDef } from "@tanstack/react-table";
import type { User } from "@shared/types";
import { Badge } from "@/components/ui/badge";

export interface FilterOption {
  label: string;
  value: string;
}

export interface ColumnMeta {
  filterVariant?: "presence" | "select" | "text";
  filterOptions?: FilterOption[];
}

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "firstName",
    header: "שם פרטי",
    meta: {
      filterVariant: "presence",
    } as ColumnMeta,
  },
  {
    accessorKey: "lastName",
    header: "שם משפחה",
    meta: {
      filterVariant: "presence",
    } as ColumnMeta,
  },
  {
    accessorKey: "email",
    header: "אימייל",
    meta: {
      filterVariant: "presence",
    } as ColumnMeta,
  },
  {
    accessorKey: "phone",
    header: "טלפון",
    meta: {
      filterVariant: "presence",
    } as ColumnMeta,
  },
  {
    accessorKey: "role",
    header: "תפקיד",
    meta: {
      filterVariant: "select",
      filterOptions: [
        { label: "מנהל", value: "admin" },
        { label: "משתמש רגיל", value: "user" },
      ],
    } as ColumnMeta,
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return (
        <Badge variant={role === "admin" ? "default" : "secondary"}>
          {role === "admin" ? "מנהל" : "משתמש"}
        </Badge>
      );
    },
  },
];
