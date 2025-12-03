import fs from "fs";
import path from "path";

export const writeFile = async (
  dir: string,
  fileName: string,
  content: string
) => {
  const targetDir = path.resolve(process.cwd(), dir);
  const targetFile = path.join(targetDir, fileName);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  if (fs.existsSync(targetFile)) {
    console.error(`File already exists: ${targetFile}`);
    process.exit(1);
  }

  fs.writeFileSync(targetFile, content);
  console.log(`Created: ${path.join(dir, fileName)}`);
};
