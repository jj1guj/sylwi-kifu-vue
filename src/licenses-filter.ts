import { createInterface } from "node:readline";

const lines: string[] = [];
const reader = createInterface({
  input: process.stdin,
  output: process.stdout,
});

reader.on("line", (line: string) => {
  lines.push(line);
});

reader.on("close", () => {
  const data = JSON.parse(lines.join("")) as Record<
    string,
    Record<string, string | undefined>
  >;

  for (const value of Object.values(data)) {
    value.path = undefined;
  }

  console.log(JSON.stringify(data, undefined, 2));
});
