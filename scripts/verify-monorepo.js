// verify-monorepo.js - Monorepo 结构验证脚本
const fs = require('fs');
const path = require('path');

// 获取仓库根目录（scripts 目录的父目录）
const repoRoot = path.resolve(__dirname, '..');

// 验证结果数组
const results = [];

// 辅助函数：检查路径是否存在
function checkPathExists(relativePath, description) {
  const fullPath = path.join(repoRoot, relativePath);
  const exists = fs.existsSync(fullPath);
  results.push({
    description: description,
    pass: exists,
    path: relativePath,
    suggestion: exists ? null : `请创建目录: ${relativePath}`
  });
  return exists;
}

// 辅助函数：检查文件是否存在
function checkFileExists(relativePath, description) {
  const fullPath = path.join(repoRoot, relativePath);
  const exists = fs.existsSync(fullPath);
  results.push({
    description: description,
    pass: exists,
    path: relativePath,
    suggestion: exists ? null : `请创建文件: ${relativePath}`
  });
  return exists;
}

// 辅助函数：读取并解析 JSON 文件
function readJsonFile(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

// 辅助函数：解析相对路径为真实路径
function resolveRelativePath(basePath, relativePath) {
  const baseDir = path.dirname(basePath);
  const resolved = path.resolve(baseDir, relativePath);
  return path.normalize(resolved);
}

console.log('=== Monorepo 结构验证 ===\n');

// 1. 检查基础目录是否存在
console.log('1. 检查基础目录...');
checkPathExists('apps/admin', '检查 /apps/admin 目录');
checkPathExists('apps/user', '检查 /apps/user 目录');
checkPathExists('cloudfunctions', '检查 /cloudfunctions 目录');

console.log('\n2. 验证项目配置文件...');

// 2. 验证 admin 项目配置
const adminConfigPath = 'apps/admin/project.config.json';
const adminConfig = readJsonFile(adminConfigPath);

if (adminConfig) {
  // 检查 miniprogramRoot
  const adminMiniprogramRoot = adminConfig.miniprogramRoot;
  results.push({
    description: '检查 /apps/admin/project.config.json miniprogramRoot === "."',
    pass: adminMiniprogramRoot === '.',
    path: adminConfigPath,
    suggestion: adminMiniprogramRoot !== '.' 
      ? `请将 miniprogramRoot 设置为 "."，当前值: ${adminMiniprogramRoot}`
      : null
  });

  // 检查 cloudfunctionRoot
  const adminCloudfunctionRoot = adminConfig.cloudfunctionRoot;
  results.push({
    description: '检查 /apps/admin/project.config.json cloudfunctionRoot === "../../cloudfunctions"',
    pass: adminCloudfunctionRoot === '../../cloudfunctions',
    path: adminConfigPath,
    suggestion: adminCloudfunctionRoot !== '../../cloudfunctions'
      ? `请将 cloudfunctionRoot 设置为 "../../cloudfunctions"，当前值: ${adminCloudfunctionRoot}`
      : null
  });

  // 解析并检查 cloudfunctionRoot 的真实路径
  if (adminCloudfunctionRoot) {
    const resolvedPath = resolveRelativePath(
      path.join(repoRoot, adminConfigPath),
      adminCloudfunctionRoot
    );
    const cloudfunctionsExists = fs.existsSync(resolvedPath);
    results.push({
      description: `检查 /apps/admin 的 cloudfunctionRoot 真实路径是否存在: ${path.relative(repoRoot, resolvedPath)}`,
      pass: cloudfunctionsExists,
      path: resolvedPath,
      suggestion: cloudfunctionsExists 
        ? null 
        : `cloudfunctionRoot 指向的路径不存在: ${resolvedPath}`
    });
  }
} else {
  results.push({
    description: '读取 /apps/admin/project.config.json',
    pass: false,
    path: adminConfigPath,
    suggestion: `无法读取或解析文件: ${adminConfigPath}`
  });
}

// 验证 user 项目配置
const userConfigPath = 'apps/user/project.config.json';
const userConfig = readJsonFile(userConfigPath);

if (userConfig) {
  // 检查 miniprogramRoot
  const userMiniprogramRoot = userConfig.miniprogramRoot;
  results.push({
    description: '检查 /apps/user/project.config.json miniprogramRoot === "."',
    pass: userMiniprogramRoot === '.',
    path: userConfigPath,
    suggestion: userMiniprogramRoot !== '.'
      ? `请将 miniprogramRoot 设置为 "."，当前值: ${userMiniprogramRoot}`
      : null
  });

  // 检查 cloudfunctionRoot
  const userCloudfunctionRoot = userConfig.cloudfunctionRoot;
  results.push({
    description: '检查 /apps/user/project.config.json cloudfunctionRoot === "../../cloudfunctions"',
    pass: userCloudfunctionRoot === '../../cloudfunctions',
    path: userConfigPath,
    suggestion: userCloudfunctionRoot !== '../../cloudfunctions'
      ? `请将 cloudfunctionRoot 设置为 "../../cloudfunctions"，当前值: ${userCloudfunctionRoot}`
      : null
  });

  // 解析并检查 cloudfunctionRoot 的真实路径
  if (userCloudfunctionRoot) {
    const resolvedPath = resolveRelativePath(
      path.join(repoRoot, userConfigPath),
      userCloudfunctionRoot
    );
    const cloudfunctionsExists = fs.existsSync(resolvedPath);
    results.push({
      description: `检查 /apps/user 的 cloudfunctionRoot 真实路径是否存在: ${path.relative(repoRoot, resolvedPath)}`,
      pass: cloudfunctionsExists,
      path: resolvedPath,
      suggestion: cloudfunctionsExists
        ? null
        : `cloudfunctionRoot 指向的路径不存在: ${resolvedPath}`
    });
  }
} else {
  results.push({
    description: '读取 /apps/user/project.config.json',
    pass: false,
    path: userConfigPath,
    suggestion: `无法读取或解析文件: ${userConfigPath}`
  });
}

console.log('\n3. 检查云函数目录...');

// 3. 检查云函数文件
const requiredCloudFunctions = [
  '_base.js',
  'auth_login',
  'admin_create_session',
  'confirm_session',
  'report_and_deduct',
  'seed_training_catalog'
];

requiredCloudFunctions.forEach(item => {
  if (item === '_base.js') {
    checkFileExists(`cloudfunctions/${item}`, `检查云函数基础文件: ${item}`);
  } else {
    const indexJsPath = `cloudfunctions/${item}/index.js`;
    checkFileExists(indexJsPath, `检查云函数目录: ${item}/index.js`);
  }
});

// 输出验证结果
console.log('\n=== 验证结果 ===\n');

let passCount = 0;
let failCount = 0;

results.forEach((result, index) => {
  const status = result.pass ? 'PASS' : 'FAIL';
  const icon = result.pass ? '✓' : '✗';
  
  console.log(`${index + 1}. ${icon} [${status}] ${result.description}`);
  
  if (!result.pass && result.suggestion) {
    console.log(`   修复建议: ${result.suggestion}`);
  }
  
  if (result.pass) {
    passCount++;
  } else {
    failCount++;
  }
});

console.log('\n=== 总结 ===');
console.log(`总计: ${results.length} 项`);
console.log(`通过: ${passCount} 项`);
console.log(`失败: ${failCount} 项`);

if (failCount === 0) {
  console.log('\n✓ 所有检查通过！Monorepo 结构正确。');
  process.exit(0);
} else {
  console.log(`\n✗ 发现 ${failCount} 项问题，请根据上述修复建议进行处理。`);
  process.exit(1);
}
