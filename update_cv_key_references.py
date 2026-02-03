#!/usr/bin/env python3
"""
Replace all i18n key references from old CV sections to applications.cvs.*
"""
import re
from pathlib import Path

# Define all replacement patterns
replacements = [
    (r"cvList\.", "applications.cvs.list."),
    (r"cvDisplay\.", "applications.cvs.display."),
    (r"cvGenerate\.", "applications.cvs.generate."),
    (r"cvSettings\.", "applications.cvs.settings."),
    (r"cvTemplates\.", "applications.cvs.templates."),
    (r"cvExperiencePicker\.", "applications.cvs.experiencePicker."),
    (r"cvNew\.", "applications.cvs.new."),
    # Note: cvs.* becomes applications.cvs.* but we need to handle cases where cvs is not part of a key
    (r"'cvs\.", "'applications.cvs."),
    (r'"cvs\.', '"applications.cvs.'),
]

# Find all Vue files with CV-related keys
src_dir = Path('src')
files_to_update = [
    'pages/applications/cv/[id]/print.vue',
    'pages/applications/cv/[id]/index.vue',
    'pages/applications/cv/new.vue',
    'pages/settings/cv/[id].vue',
    'pages/settings/cv/index.vue',
    'pages/profile/stories/new.vue',
    'components/cv/CvTemplateEditor.vue',
    'components/cv/CvSettingsForm.vue',
    'components/cv/GeneratingStep.vue',
    'components/cv/CvGenerateEntryCard.vue',
    'components/cv/CvGenerationModal.vue',
    'components/cv/CvTemplateCard.vue',
    'components/cv/ExperiencePicker.vue',
]

updated_count = 0
total_replacements = 0

for file_path in files_to_update:
    full_path = src_dir / file_path
    if not full_path.exists():
        print(f"⚠️  File not found: {full_path}")
        continue
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Apply all replacements
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)
    
    # Only write if content changed
    if content != original_content:
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Count replacements
        changes = sum(1 for pattern, _ in replacements if re.search(pattern, original_content))
        if changes > 0:
            print(f"✅ Updated: {file_path}")
            updated_count += 1
            total_replacements += changes

print(f"\n📊 Summary:")
print(f"   Files updated: {updated_count}")
print(f"   Total changes: {total_replacements}")
