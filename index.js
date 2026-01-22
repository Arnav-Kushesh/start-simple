#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const prompts = require("prompts");
const pc = require("picocolors");

async function init() {
  console.log(pc.cyan("\n 🌻 Welcome To Start Simple 🌻 \n"));

  // 1. Get Project Name
  let targetDir = process.argv[2];
  if (!targetDir) {
    const response = await prompts({
      type: "text",
      name: "projectName",
      message: "Project name:",
      initial: "my-simple-project",
    });
    targetDir = response.projectName;
  }

  if (!targetDir) {
    console.log("Operation cancelled");
    return;
  }

  const root = path.join(process.cwd(), targetDir);

  if (fs.existsSync(root)) {
    const { overwrite } = await prompts({
      type: "confirm",
      name: "overwrite",
      message: `Target directory "${targetDir}" is not empty. Remove existing files and continue?`,
    });
    if (!overwrite) {
      console.log("Operation cancelled");
      return;
    }
    await fs.emptyDir(root);
  } else {
    await fs.ensureDir(root);
  }

  console.log(`\nScaffolding project in ${pc.bold(root)}...`);

  // 2. Copy Template
  const templateDir = path.join(__dirname, "template");
  try {
    await fs.copy(templateDir, root);
  } catch (err) {
    console.error(pc.red("Error copying template files:"), err);
    process.exit(1);
  }

  // 3. Rename .gitignore (npm renames it to .npmignore usually, ensuring we handle it if needed)
  try {
    const gitignorePath = path.join(root, "_gitignore");
    const dotGitignorePath = path.join(root, ".gitignore");
    if (fs.existsSync(gitignorePath)) {
      await fs.move(gitignorePath, dotGitignorePath);
    }
  } catch (err) {
    console.error(pc.red("Error renaming gitignore:"), err);
    process.exit(1);
  }

  // 4. Update the root package.json "name"
  const pkgPath = path.join(root, "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = await fs.readJson(pkgPath);
    pkg.name = targetDir;
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
  }

  console.log(pc.green("\nDone. Now run:\n"));
  console.log(`  cd ${targetDir}`);
  console.log(`  npm install`);
  console.log(`  npm run dev\n`);
}

init().catch((e) => {
  console.error(e);
});
