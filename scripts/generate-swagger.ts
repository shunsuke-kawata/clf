import { writeFileSync, mkdirSync } from "fs";
import { stringify } from "yaml";
import { generateDocument } from "../src/lib/openapi/document";

const doc = generateDocument();
const yaml = stringify(doc, { aliasDuplicateObjects: false });

mkdirSync("docs", { recursive: true });
writeFileSync("docs/swagger.yaml", yaml, "utf-8");
console.log("docs/swagger.yaml を生成しました");
