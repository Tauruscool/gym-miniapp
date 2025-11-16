// scripts/dump-snapshot.js
// 生成一个包含 apps/ + cloudfunctions/ 下所有源码的快照文件：snapshot_all_code.md

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const OUTPUT = path.join(ROOT, 'snapshot_all_code.md')

// 想让哪些目录进快照
const includeRoots = ['apps', 'cloudfunctions']

// 跳过的目录
const ignoreDirs = new Set([
  'node_modules',
  'miniprogram_npm',
  'dist',
  '.git',
  '.vscode',
  '.idea'
])

// 只收这些后缀的文件
const includeExts = new Set([
  '.js',
  '.json',
  '.wxml',
  '.wxss',
  '.ts',
  '.md'
])

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (ignoreDirs.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, files)
    } else {
      const ext = path.extname(entry.name)
      if (includeExts.has(ext)) {
        files.push(full)
      }
    }
  }
  return files
}

function main() {
  const lines = []

  for (const rootName of includeRoots) {
    const rootDir = path.join(ROOT, rootName)
    if (!fs.existsSync(rootDir)) continue

    const files = walk(rootDir)
    files.sort()

    for (const file of files) {
      const rel = path.relative(ROOT, file).replace(/\\/g, '/')
      const content = fs.readFileSync(file, 'utf8')

      lines.push(`// file: ${rel}\n`)
      lines.push(content)
      lines.push('\n\n')
    }
  }

  fs.writeFileSync(OUTPUT, lines.join(''), 'utf8')
  console.log('✅ snapshot written to', OUTPUT)
}

main()
