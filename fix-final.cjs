
// fix-final.cjs — Remove duplicate lines and fix remaining syntax issues
const fs = require('fs');
const f = 'src/App.tsx';
let lines = fs.readFileSync(f, 'utf-8').split('\n');

// Remove duplicate lines that exist side by side
// Strategy: scan for specific known duplicates and remove the garbled version
const removals = new Set();
for (let i = 0; i < lines.length - 1; i++) {
  const curr = lines[i].trim();
  const next = lines[i + 1].trim();
  
  // If current line is garbled and next line is clean version, remove current
  if (curr === next) {
    removals.add(i); // remove first duplicate
    continue;
  }
  
  // Detect garbled+clean pairs (garbled line followed by its clean replacement)
  // Pattern: lines[i] is garbled, lines[i+1] is the clean fix we inserted
  if (/馃|鍏|鍒|鐘|鎺|鎻|鍗|鍙|鐗|閲|鏀|鍘|鈻|鍐|绾|缁|鍦|鏈|鍚|闈|鏃|灏|鑷|绗|涓|鎵|璇|椤|鎿|鎶|璐|娲|闃|鍓|浣|鐩|搴|宸|鑱|淇|瀹|娆|绋|澶|绂|鎷|缂|闄|浼|璁|鏌|妫|閫|鎸|鑹|鈿|姝诲洜|鎬婚儴/.test(curr)) {
    // Check if next line looks like a clean replacement
    if (!/馃|鍏|鍒|鐘|鎺|鎻|鍗|鍙|鐗|閲|鏀|鍘|鈻|鍐|绾|缁|鍦|鏈|鍚|闈|鏃|灏|鑷|绗|涓|鎵|璇|椤|鎿|鎶|璐|娲|闃|鍓|浣|鐩|搴|宸|鑱|淇|瀹|娆|绋|澶|绂|鎷|缂|闄|浼|璁|鏌|妫|閫|鎸|鑹|鈿|姝诲洜|鎬婚儴/.test(next) || next === '') {
      removals.add(i);
    }
  }
}

// Also check for specific known remaining garbled-only lines
for (let i = 0; i < lines.length; i++) {
  const t = lines[i].trim();
  if (t === '鈿栵笍') removals.add(i);
  if (t.startsWith('鎬婚儴')) removals.add(i);
  if (t === "姝诲洜: {entry.deathCause}</div>") removals.add(i);
}

let cleaned = lines.filter((_, i) => !removals.has(i));
console.log(`Removed ${removals.size} duplicate/garbled lines. ${lines.length} -> ${cleaned.length}`);

// Now fix the battle-log-header missing closing tag
// Find: <div className="battle-log-header"> ... missing </div>
for (let i = 0; i < cleaned.length; i++) {
  const t = cleaned[i].trim();
  
  // Fix: "该选项暂不可用" should be inside setHesitationNotice
  if (t === '该选项暂不可用') {
    cleaned[i] = "                          setHesitationNotice('该选项暂不可用');";
  }
  
  // Fix: "暂停实验" should be button text
  if (t === '暂停实验') {
    cleaned[i] = '                        暂停实验';
  }
  
  // Fix missing </span> or </div> closings in battle-log-header
  if (t === '<AlertIcon size={14} /> 实时行动记录' && i + 1 < cleaned.length) {
    const nextT = cleaned[i + 1].trim();
    if (nextT.startsWith('<div className="battle-log-stats">')) {
      // Need closing </div> for header
      cleaned[i] = cleaned[i] + '\n          </div>';
    }
  }
}

// Fix specific remaining issues:
// 1. The "预估损耗" line is broken: 预估损耗/span> -> needs closing bracket
for (let i = 0; i < cleaned.length; i++) {
  if (cleaned[i].includes('预估损耗/span>')) {
    cleaned[i] = '                      <span className="scp-label">预估损耗</span>';
  }
  // Fix: COMBO 脳 -> COMBO ×
  if (cleaned[i].includes('COMBO 脳')) {
    cleaned.splice(i, 1);
    i--;
  }
}

fs.writeFileSync(f, cleaned.join('\n'), 'utf-8');
console.log('Final cleanup done. Total lines:', cleaned.length);
