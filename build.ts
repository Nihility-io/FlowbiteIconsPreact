import { decompress } from "https://deno.land/x/zip@v1.2.5/mod.ts"
import { walk } from "jsr:@std/fs"
import * as path from "jsr:@std/path"

const downloadUrl = "https://github.com/themesberg/flowbite-icons/archive/refs/heads/main.zip"
const folderName = "flowbite-icons-main"
const zipName = "icons.zip"

/**
 * Removes a prefix from a give string. It the string doesn't have the prefix return the original string
 * @param s String
 * @param prefix Prefix to remove
 * @returns String without prefix
 */
const trimPrefix = (s: string, prefix: string): string => s.startsWith(prefix) ? s.slice(prefix.length) : s

/**
 * Turns a snake_case_string into a PascalCaseString
 * @param s Snake case string
 * @returns Pascal case string
 */
const snakeToPascal = (s: string) =>
	s.split("/").map((snake) =>
		snake.split("_")
			.map((substr) => substr.charAt(0).toUpperCase() + substr.slice(1))
			.join("")
	).join("/")

// Download and extract the icons from Flowbite
await fetch(downloadUrl).then((x) => x.arrayBuffer()).then((x) => Deno.writeFile(zipName, new Uint8Array(x)))
await decompress(zipName, ".")
Deno.remove(zipName)

const icons: Record<string, string> = {}

// Turn all svg files into a JSX component
for await (const f of walk(folderName, { exts: [".svg"] })) {
	// Determine a component name
	const [type, group, file] = trimPrefix(f.path, folderName + "/src/").split(path.SEPARATOR)
	const name = path.parse(file).name
	const p = path.join(type, group, name + ".tsx")
	const componentName = snakeToPascal(`${group}_${name}_${type}`.replaceAll("-", "_").replaceAll(":", "_"))

	// Add tsx path to a temporary record
	icons[componentName] = p

	// Read the original SVG
	const svg = await Deno.readTextFile(f.path)

	// Create the target directory
	await Deno.mkdir(path.join("icons", type.replaceAll(":", "-"), group), { recursive: true })

	// Turn the SVG into a TSX component and allow overwriting props
	const componentTSX = `import { JSX } from "preact"
export default (props: JSX.HTMLAttributes<SVGSVGElement>): JSX.Element => (
${svg.replace(/<svg[^>]*>/, `<svg ${/<svg([^>]*)>/.exec(svg)![1]} {...props}>`)})`

	// Write TSX
	await Deno.writeTextFile(path.join("icons", p), componentTSX)
}

// Remove the SVG files
Deno.remove(folderName, { recursive: true })

// Create in index.ts file with exports all generated components
const indexFile = Object.entries(icons)
	.map(([name, path]) => `export { default as ${name} } from "icons/${path}"`).join("\n")

// Write index.js
await Deno.writeTextFile(path.join("icons", "index.tsx"), indexFile)
