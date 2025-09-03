"use client";

import {
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Image from "next/image";
import { redirect } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { decryptKey } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const encryptedKey =
    typeof window !== "undefined"
      ? window.localStorage.getItem("accessKey")
      : null;

  useEffect(() => {
    const accessKey = encryptedKey && decryptKey(encryptedKey);

    if (accessKey !== process.env.NEXT_PUBLIC_ADMIN_PASSKEY!.toString()) {
      redirect("/");
    }
  }, [encryptedKey]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode: 'onChange',
  });

  const tableContainerStyle = {
    marginTop: '24px',
    borderRadius: '16px',
    border: '1px solid #1F2937',
    backgroundColor: '#111827',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  };

  const headerStyle = {
    padding: '16px 20px',
    borderBottom: '1px solid #1F2937',
    fontSize: '12px',
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    textAlign: 'left' as const,
    backgroundColor: '#0F172A'
  };

  const cellStyle = {
    padding: '16px 20px',
    fontSize: '14px',
    color: '#F9FAFB',
    borderBottom: '1px solid #1F2937'
  };

  const rowStyle = {
    transition: 'background-color 0.15s ease',
    backgroundColor: 'transparent'
  };

  const paginationStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    backgroundColor: 'rgba(31, 41, 55, 0.5)'
  };

  return (
    <div style={tableContainerStyle}>
      <Table className="w-full" style={{ tableLayout: 'fixed', width: '100%' }}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} style={{borderBottom: '1px solid #1F2937'}}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead 
                    key={header.id} 
                    style={{
                      ...headerStyle,
                      width: header.getSize(),
                      minWidth: header.getSize(),
                      maxWidth: header.getSize()
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                style={rowStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(31, 41, 55, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell 
                    key={cell.id} 
                    style={{
                      ...cellStyle,
                      width: cell.column.getSize(),
                      minWidth: cell.column.getSize(),
                      maxWidth: cell.column.getSize()
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} style={{...cellStyle, height: '96px', textAlign: 'center', color: '#9CA3AF'}}>
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div style={paginationStyle}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          style={{
            backgroundColor: '#374151',
            border: '1px solid #4B5563',
            color: '#ffffff',
            opacity: !table.getCanPreviousPage() ? 0.5 : 1
          }}
        >
          <Image
            src="/assets/icons/arrow.svg"
            width={16}
            height={16}
            alt="arrow"
          />
          PREVIOUS
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          style={{
            backgroundColor: '#374151',
            border: '1px solid #4B5563',
            color: '#ffffff',
            opacity: !table.getCanNextPage() ? 0.5 : 1
          }}
        >
          NEXT
          <Image
            src="/assets/icons/arrow.svg"
            width={16}
            height={16}
            alt="arrow"
            style={{transform: 'rotate(180deg)', marginLeft: '4px'}}
          />
        </Button>
      </div>
    </div>
  );
}