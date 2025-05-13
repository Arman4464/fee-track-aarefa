
import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableFooter,
  TableCaption,
} from "@/components/ui/table"

interface ResponsiveTableProps extends React.HTMLAttributes<HTMLDivElement> {
  headers: string[]
  data: Record<string, React.ReactNode>[]
  caption?: string
  footerContent?: React.ReactNode
  keyField: string
  renderCustomCell?: (
    row: Record<string, React.ReactNode>,
    header: string,
    index: number
  ) => React.ReactNode
}

export function ResponsiveTable({
  headers,
  data,
  caption,
  footerContent,
  keyField,
  renderCustomCell,
  className,
  ...props
}: ResponsiveTableProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <div className={cn("space-y-6", className)} {...props}>
        {caption && <div className="text-sm text-muted-foreground mb-2">{caption}</div>}
        {data.map((row, rowIdx) => (
          <div 
            key={`${row[keyField]}-${rowIdx}`} 
            className="bg-card rounded-md shadow-sm border p-4 table-row-stagger"
          >
            {headers.map((header, i) => {
              const key = Object.keys(row).find(
                k => k.toLowerCase() === header.toLowerCase()
              ) || header.toLowerCase()
              
              return (
                <div key={`${key}-${i}`} className="flex flex-col py-2 border-b last:border-0">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    {header}
                  </div>
                  <div className="text-sm">
                    {renderCustomCell 
                      ? renderCustomCell(row, key, i)
                      : row[key] || "—"}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        {footerContent && (
          <div className="bg-muted/50 p-4 text-sm font-medium rounded-md mt-2">
            {footerContent}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)} {...props}>
      <Table>
        {caption && <TableCaption>{caption}</TableCaption>}
        <TableHeader>
          <TableRow>
            {headers.map((header, i) => (
              <TableHead key={`header-${i}`}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIdx) => (
            <TableRow 
              key={`${row[keyField]}-${rowIdx}`}
              className="table-row-stagger"
            >
              {headers.map((header, i) => {
                const key = Object.keys(row).find(
                  k => k.toLowerCase() === header.toLowerCase()
                ) || header.toLowerCase()
                
                return (
                  <TableCell key={`${key}-${i}`}>
                    {renderCustomCell 
                      ? renderCustomCell(row, key, i)
                      : row[key] || "—"}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
        {footerContent && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={headers.length}>{footerContent}</TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  )
}
