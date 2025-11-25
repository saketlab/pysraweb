import { Table } from "@radix-ui/themes";

export default function TableHeaders({
  tableHeaders,
}: {
  tableHeaders: string[];
}) {
  return (
    <Table.Header>
      <Table.Row>
        {tableHeaders.map((tableHeader) => (
          <Table.ColumnHeaderCell key={tableHeader}>
            {tableHeader}
          </Table.ColumnHeaderCell>
        ))}
      </Table.Row>
    </Table.Header>
  );
}
