
const fs = require('fs');
const f = 'src/App.tsx';
let lines = fs.readFileSync(f, 'utf-8').split('\n');

// Fix 1: Line 250 - missing closing } for inner for loop
// Current: "    }" should be "    }\n    }"
// Line 249: toRemoveKeys.add(...)
// Line 250: }  <- this closes inner for, but missing } for outer for
lines.splice(250, 0, '    }');

// Fix 2: Line 304 (now 305 after insert) - missing closing } for the for/if block
// Line 303: });  <- closes newBubbles.push
// Line 304: }   <- closes if(word), but missing } for for loop
lines.splice(304, 0, '      }');

// Fix 3: Check for missing } in survivor injection loop (~line 420)
// Find "if (filledBoard[0][c].isNew) {" and ensure proper closing
for (let i = 400; i < 450; i++) {
  if (lines[i] && lines[i].includes('filledBoard[0][c] = { ...survivors[injected]')) {
    // Check if next few lines have proper closing braces
    // Should be: injected++; } } }
    let j = i + 1;
    let braceCount = 0;
    while (j < i + 5) {
      if (lines[j] && lines[j].trim() === '}') braceCount++;
      j++;
    }
    if (braceCount < 3) {
      // Need to add missing closing braces
      const nextLine = i + 2; // after "injected++"
      if (lines[nextLine] && !lines[nextLine].trim().startsWith('}')) {
        lines.splice(nextLine, 0, '          }');
        lines.splice(nextLine + 1, 0, '        }');
      }
    }
    break;
  }
}

// Fix 4: Check for missing } in dropping cells loop
for (let i = 420; i < 450; i++) {
  if (lines[i] && lines[i].includes('filledBoard[r][c].isNew = false')) {
    let j = i + 1;
    let braces = 0;
    while (j < i + 4 && lines[j]) {
      if (lines[j].trim() === '}') braces++;
      j++;
    }
    if (braces < 3) {
      lines.splice(i + 1, 0, '          }');
      lines.splice(i + 2, 0, '        }');
    }
    break;
  }
}

// Fix 5: Check for missing } in useSkillPurge
for (let i = 600; i < 650; i++) {
  if (lines[i] && lines[i].includes('removed.push(board[r][c])')) {
    let j = i + 1;
    let braces = 0;
    while (j < i + 4 && lines[j]) {
      if (lines[j].trim() === '}') braces++;
      j++;
    }
    if (braces < 3) {
      lines.splice(i + 1, 0, '        }');
      lines.splice(i + 2, 0, '      }');
    }
    break;
  }
}

// Fix 6: Check for missing } in game over useEffect
for (let i = 530; i < 570; i++) {
  if (lines[i] && lines[i].includes('setShowFailed(true)')) {
    if (lines[i + 1] && lines[i + 1].trim() !== '}') {
      lines.splice(i + 1, 0, '      }');
    }
    break;
  }
}

fs.writeFileSync(f, lines.join('\n'), 'utf-8');
console.log('Brace fixes applied. Total lines:', lines.length);
