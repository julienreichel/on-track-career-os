#!/usr/bin/env python3
"""
Consolidate all CV-related keys into applications.cvs namespace
"""
import json
from pathlib import Path
from copy import deepcopy

# Read the current en.json
en_json_path = Path('i18n/locales/en.json')
with open(en_json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Extract the sections we need to consolidate
cvs_content = deepcopy(data.get('cvs', {}))
cvList_content = deepcopy(data.get('cvList', {}))
cvDisplay_content = deepcopy(data.get('cvDisplay', {}))
cvGenerate_content = deepcopy(data.get('cvGenerate', {}))
cvSettings_content = deepcopy(data.get('cvSettings', {}))
cvTemplates_content = deepcopy(data.get('cvTemplates', {}))
cvExperiencePicker_content = deepcopy(data.get('cvExperiencePicker', {}))
cvNew_content = deepcopy(data.get('cvNew', {}))

# Build the applications.cvs structure
applications_cvs = {
    "page": cvs_content.get("page", {}),
    "list": {
        **cvs_content.get("list", {}),  # Keep existing list content (actions, tailored, search)
        "title": cvList_content.get("title", "CVs")  # Merge in title from cvList
    },
    "delete": cvs_content.get("delete", {}),
    "toast": cvs_content.get("toast", {}),
    "display": cvDisplay_content,
    "generate": cvGenerate_content,
    "settings": cvSettings_content,
    "templates": cvTemplates_content,
    "experiencePicker": cvExperiencePicker_content,
    "new": cvNew_content
}

# Create or update the applications section
if "applications" not in data:
    data["applications"] = {}

data["applications"]["cvs"] = applications_cvs

# Remove the old root-level sections
sections_to_remove = [
    "cvs",
    "cvList",
    "cvDisplay",
    "cvGenerate",
    "cvSettings",
    "cvTemplates",
    "cvExperiencePicker",
    "cvNew"
]

for section in sections_to_remove:
    if section in data:
        del data[section]

# Write the updated data back
with open(en_json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("✅ CV sections consolidated into applications.cvs")
print("\nConsolidated sections:")
print("  - cvs.page → applications.cvs.page")
print("  - cvList.title + cvs.list → applications.cvs.list (merged)")
print("  - cvs.delete → applications.cvs.delete")
print("  - cvs.toast → applications.cvs.toast")
print("  - cvDisplay → applications.cvs.display")
print("  - cvGenerate → applications.cvs.generate")
print("  - cvSettings → applications.cvs.settings")
print("  - cvTemplates → applications.cvs.templates")
print("  - cvExperiencePicker → applications.cvs.experiencePicker")
print("  - cvNew → applications.cvs.new")

print("\nRemoved sections:")
for section in sections_to_remove:
    print(f"  - {section}")
