#!/usr/bin/env python3
"""
Fix remaining cvs.* references that should be applications.cvs.*
"""
import re
from pathlib import Path

src_dir = Path('src')

# Find files with remaining cvs. references that are NOT already applications.cvs.
files_to_check = [
    'layouts/default.vue',
    'pages/applications/index.vue',
    'pages/applications/cv/index.vue',
]

fixed_count = 0

for file_path in files_to_check:
    full_path = src_dir / file_path
    if not full_path.exists():
        print(f"⚠️  File not found: {full_path}")
        continue
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Replace cvs. references that are NOT already applications.cvs.
    # Use negative lookbehind to avoid replacing already converted ones
    content = re.sub(r"(?<!applications\.)cvs\.", "applications.cvs.", content)
    
    # Also handle the other cvs references
    content = re.sub(r"\$t\('cvs\.", "$t('applications.cvs.", content)
    content = re.sub(r"t\('cvs\.", "t('applications.cvs.", content)
    
    # And detail references
    content = re.sub(r"cvs\.detail\.", "applications.cvs.detail.", content)
    
    if content != original_content:
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Fixed: {file_path}")
        fixed_count += 1

print(f"\n📊 Summary: Fixed {fixed_count} files")
