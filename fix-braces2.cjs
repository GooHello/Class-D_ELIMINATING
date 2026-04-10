
const fs = require('fs');
const f = 'src/App.tsx';
let lines = fs.readFileSync(f, 'utf-8').split('\n');

// Fix L107: Two closures merged into one line
// Current: "    }, ...prev].slice(0, 30)); // 最多保留30条  }, []);"
// Should be split into two proper lines
const l107 = lines[106];
if (l107.includes('最多保留30条')) {
  lines[106] = "    }, ...prev].slice(0, 30)); // 最多保留30条";
  lines.splice(107, 0, "  }, []);");
}

// Re-read to get updated line numbers
// Now find the survivor injection loop and add missing closing braces
// Pattern: "filledBoard[0][c] = { ...survivors[injected]" then "injected++" then missing }}}
for (let i = 400; i < 450; i++) {
  if (lines[i] && lines[i].includes('injected++')) {
    // Check what's after this
    if (lines[i+1] && !lines[i+1].trim().startsWith('}')) {
      // Missing 3 closing braces for: if, for, if(survivors)
      lines.splice(i+1, 0, '          }');
      lines.splice(i+2, 0, '        }');
      lines.splice(i+3, 0, '      }');
      break;
    } else if (lines[i+1] && lines[i+1].trim() === '}' && (!lines[i+2] || lines[i+2].trim() !== '}')) {
      // Only 1 brace, need 2 more
      lines.splice(i+2, 0, '        }');
      lines.splice(i+3, 0, '      }');
      break;
    }
    break;
  }
}

// Check final brace count
let stack = 0;
for (const line of lines) {
  for (const ch of line) {
    if (ch === '{') stack++;
    if (ch === '}') stack--;
  }
}
console.log('Brace balance after fix:', stack, '(should be 0)');

if (stack > 0) {
  // Find where we're still unbalanced
  let s2 = 0;
  for (let i = 0; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') s2++;
      if (ch === '}') s2--;
    }
    if (i === lines.length - 1 || [107,108,250,305,420,425,430,448,540].includes(i+1)) {
      console.log('  L' + (i+1) + ': depth=' + s2);
    }
  }
}

fs.writeFileSync(f, lines.join('\n'), 'utf-8');
console.log('Total lines:', lines.length);
