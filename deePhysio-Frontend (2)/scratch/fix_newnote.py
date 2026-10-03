
import os

filepath = r'c:\Users\Admin\Desktop\Dephysio\Frontend\src\pages\NewNote.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Line 1013 is index 1012
if '</div>' in lines[1012] and '</>' in lines[1013]:
    del lines[1012]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Fixed.")
else:
    print(f"Check failed. Line 1013: {repr(lines[1012])}, Line 1014: {repr(lines[1013])}")
