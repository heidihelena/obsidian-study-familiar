// Keeps manifest.json and versions.json in step with package.json on `npm version`.
import { readFileSync, writeFileSync } from "node:fs";

const target = process.env.npm_package_version;
if (!target) {
  console.error("Run through npm version, which sets npm_package_version.");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
manifest.version = target;
writeFileSync("manifest.json", JSON.stringify(manifest, null, 2) + "\n");

const versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[target] = manifest.minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, 2) + "\n");

console.log(`manifest + versions set to ${target} (minAppVersion ${manifest.minAppVersion})`);
