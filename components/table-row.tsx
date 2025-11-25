import { Table } from "@radix-ui/themes";

export default function TableRow({ rowValues }: { rowValues: string[] }) {
  const [header = "", ...cells] = rowValues;

  return (
    <Table.Row>
      <Table.RowHeaderCell style={{ maxHeight: "1rem", overflow: "hidden" }}>
        {header}
      </Table.RowHeaderCell>
      {cells.map((value, idx) => (
        <Table.Cell key={idx}>{value}</Table.Cell>
      ))}
    </Table.Row>
  );
}
