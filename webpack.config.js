import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: "./source/js/main.js",
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "bundle.js",
  },
};
