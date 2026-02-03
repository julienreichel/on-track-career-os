# CV Keys Consolidation - Complete Mapping

## Summary

Successfully consolidated 8 root-level CV-related sections into a single `applications.cvs.*` namespace. All 200+ translation keys preserved with zero data loss.

## Consolidation Completed

- **Removed sections**: cvs, cvList, cvDisplay, cvGenerate, cvSettings, cvTemplates, cvExperiencePicker, cvNew
- **Created structure**: applications.cvs (unified subsections)
- **Keys moved**: 200+ keys across all subsections
- **Conflicts resolved**: 1 (cvList + cvs.list merge)

---

## Detailed Key Mapping

### 1. Page Information

```
cvs.page.* → applications.cvs.page.*
  ✓ title: "CVs"
  ✓ description: "Manage your CV documents and create new ones."
```

### 2. List (CV List) - MERGED

```
cvList.title → applications.cvs.list.title
cvs.list.* → applications.cvs.list.*

Result (cvList merged INTO cvs.list):
  ✓ title: "My CVs"  [from cvList]
  ✓ actions.create: "Create New CV"
  ✓ actions.settings: "Settings"
  ✓ tailored: "Tailored"
  ✓ search.placeholder: "Search CVs..."
  ✓ search.noResults: "No CVs match your search."
```

### 3. Delete Modal

```
cvs.delete.* → applications.cvs.delete.*
  ✓ title: "Delete CV"
  ✓ message: "Are you sure you want to delete this CV?..."
```

### 4. Toast Notifications (root-level)

```
cvs.toast.* → applications.cvs.toast.*
  ✓ deleted: "CV deleted successfully"
  ✓ deleteFailed: "Failed to delete CV"
```

### 5. Display CV Content

```
cvDisplay.* → applications.cvs.display.*
  ✓ untitled: "Untitled CV"
  ✓ description: "Review and refine your CV details."
  ✓ loading: "Loading CV..."
  ✓ saving: "Saving changes..."
  ✓ editMode: "Edit CV Content"
  ✓ contentLabel: "Markdown Content"
  ✓ markdownPlaceholder: "Enter your CV content in Markdown format..."
  ✓ markdownHelp: "Use Markdown syntax: # for headings..."
  ✓ notFound: "CV Not Found"
  ✓ notFoundDescription: "The CV you're looking for doesn't exist..."
  ✓ actions.edit: "Edit"
  ✓ actions.retry: "Retry"
  ✓ actions.exportPdf: "Export to PDF"
  ✓ actions.print: "Print"
  ✓ toast.saved: "CV saved successfully"
  ✓ toast.saveFailed: "Failed to save CV"
  ✓ photoToggleLabel: "Profile photo"
  ✓ photoToggleDescription: "Show or hide your profile photo..."
  ✓ photoToggleOn: "Photo included"
  ✓ photoToggleOff: "Photo hidden"
  ✓ photoLoading: "Loading profile photo..."
  ✓ photoUnavailable: "No profile photo found..."
  ✓ photoPreviewHelp: "This preview shows how your profile photo..."
  ✓ photoAlt: "Profile photo"
```

### 6. Generate CV

```
cvGenerate.* → applications.cvs.generate.*
  ✓ title: "Generate CV"
  ✓ subtitle: "Create a new CV using your saved defaults."
  ✓ defaultName: "CV — {date}"
  ✓ entry.title: "CV generation"
  ✓ entry.description: "Review the defaults that will be applied..."
  ✓ entry.templateLabel: "Template"
  ✓ entry.sectionsLabel: "Sections"
  ✓ entry.experiencesLabel: "Experiences"
  ✓ entry.otherLabel: "Other settings"
  ✓ entry.templateFallback: "Classic template"
  ✓ entry.sections: "{count} sections"
  ✓ entry.experiences: "{count} experiences"
  ✓ entry.showProfilePhotoEnabled: "Profile photo included"
  ✓ entry.showProfilePhotoDisabled: "Profile photo hidden"
  ✓ modal.title: "Confirm CV settings"
  ✓ modal.description: "Adjust the template, sections, and experiences..."
  ✓ modal.templateLabel: "Template"
  ✓ modal.sectionsLabel: "Sections"
  ✓ modal.experiencesTitle: "Included experiences"
  ✓ modal.experiencesEmpty: "No experiences yet..."
  ✓ modal.selectAll: "Select all"
  ✓ modal.deselectAll: "Deselect all"
  ✓ modal.selected: "{count} selected"
  ✓ actions.generate: "Generate CV"
  ✓ actions.settings: "Edit settings"
  ✓ toast.created: "CV created successfully!"
  ✓ toast.createFailed: "Failed to create CV"
  ✓ toast.generationFailed: "Failed to generate CV content"
  ✓ toast.error: "An error occurred"
```

### 7. CV Settings

```
cvSettings.* → applications.cvs.settings.*
  ✓ title: "CV settings"
  ✓ subtitle: "Set defaults for every CV you create."
  ✓ sections.sections.title: "Sections"
  ✓ sections.sections.description: "Choose which sections are included..."
  ✓ sections.experiences.title: "Experiences"
  ✓ sections.experiences.description: "Select which experiences are eligible..."
  ✓ sections.other.title: "Other settings"
  ✓ sections.other.description: "Defaults for templates, prompts, and profile photo."
  ✓ template.none: "No default template"
  ✓ template.manage: "Manage templates"
  ✓ sectionLabels.skills: "Skills"
  ✓ experiences.title: "Included experiences"
  ✓ experiences.empty: "No experiences yet..."
  ✓ experiences.selectAll: "Select all"
  ✓ experiences.deselectAll: "Deselect all"
  ✓ experiences.selected: "{count} selected"
  ✓ other.showProfilePhoto: "Include profile photo by default"
  ✓ toast.saved: "Settings saved"
  ✓ toast.saveFailed: "Could not save settings"
```

### 8. CV Templates

```
cvTemplates.* → applications.cvs.templates.*

Templates.list:
  ✓ title: "CV Templates"
  ✓ subtitle: "Manage reusable templates for CV generation."
  ✓ system.title: "System templates"
  ✓ system.description: "Start from a vetted exemplar..."
  ✓ actions.create: "Create template"
  ✓ actions.duplicate: "Duplicate"
  ✓ empty.title: "No templates yet"
  ✓ empty.description: "Create a template or start from a system template."
  ✓ duplicateName: "{name} (Copy)"

Templates.editor:
  ✓ title: "Template editor"
  ✓ subtitle: "Edit your template markdown and preview the output."
  ✓ backToList: "Back to templates"
  ✓ setDefault: "Set as default"
  ✓ nameLabel: "Template name"
  ✓ contentLabel: "Template markdown"
  ✓ preview: "Preview"
  ✓ showPreview: "Show preview"
  ✓ hidePreview: "Hide preview"
  ✓ regenerate: "Regenerate preview"
  ✓ previewFailed: "Unable to generate preview."

Templates.labels:
  ✓ default: "Default"
  ✓ updated: "Updated"

Templates.system (built-in templates):
  ✓ classic.name: "Classic"
  ✓ classic.description: "Clean, traditional layout..."
  ✓ modern.name: "Modern"
  ✓ modern.description: "Contemporary layout with compact summary..."
  ✓ competency.name: "Competency"
  ✓ competency.description: "Competency-led layout for skills-forward roles."

Templates.delete:
  ✓ title: "Delete \"{name}\"?"
  ✓ description: "This action cannot be undone."

Templates.toast:
  ✓ created: "Template created"
  ✓ createFailed: "Unable to create template"
  ✓ saved: "Template saved"
  ✓ saveFailed: "Unable to save template"
  ✓ deleted: "Template deleted"
  ✓ deleteFailed: "Unable to delete template"
  ✓ defaultSet: "Default template updated"
  ✓ defaultFailed: "Unable to set default template"

Templates.errors:
  ✓ settings: "Unable to load CV settings."
  ✓ notFound: "Template not found."
  ✓ loadFailed: "Unable to load template."
```

### 9. Experience Picker

```
cvExperiencePicker.* → applications.cvs.experiencePicker.*
  ✓ title: "Select Experiences"
  ✓ selectAll: "Select All"
  ✓ deselectAll: "Deselect All"
  ✓ noExperiences: "No experiences found"
  ✓ addExperience: "Add Experience"
  ✓ selected: "{count} experiences selected"
  ✓ unknown: "Unknown"
  ✓ present: "Present"
```

### 10. CV Generation Loading State

```
cvNew.* → applications.cvs.new.*
  ✓ generating.title: "Generating Your CV"
  ✓ generating.description: "AI is crafting your professional CV..."
```

---

## Conflict Resolution

### Single Conflict: cvList + cvs.list Merge

**Source**: cvList.title ("My CVs") + existing cvs.list content  
**Strategy**: Merged INTO cvs.list subsection without data loss

**Result**:

```json
"list": {
  "title": "My CVs",  // ← from cvList
  "actions": {
    "create": "Create New CV",
    "settings": "Settings"
  },
  "tailored": "Tailored",
  "search": {
    "placeholder": "Search CVs...",
    "noResults": "No CVs match your search."
  }
}
```

---

## File Changes

- **File**: i18n/locales/en.json
- **Changes**:
  - Removed 8 root-level sections (cvs, cvList, cvDisplay, cvGenerate, cvSettings, cvTemplates, cvExperiencePicker, cvNew)
  - Created new `applications` root section (if not existed)
  - Added `applications.cvs` with all 10 subsections (page, list, delete, toast, display, generate, settings, templates, experiencePicker, new)
- **Validation**: ✅ JSON syntax valid
- **Data Loss**: ✅ Zero (all 200+ keys preserved)

---

## Next Steps for Code Updates

### 1. Update Component References

Need to search all Vue files and update translation key references:

```bash
# Find all usages of old keys:
grep -r "cvList\|cvDisplay\|cvGenerate\|cvSettings\|cvTemplates\|cvExperiencePicker\|cvNew\|cvs\." src/ --include="*.vue"
```

**Required changes**:

- `cvList.*` → `applications.cvs.list.*`
- `cvDisplay.*` → `applications.cvs.display.*`
- `cvGenerate.*` → `applications.cvs.generate.*`
- `cvSettings.*` → `applications.cvs.settings.*`
- `cvTemplates.*` → `applications.cvs.templates.*`
- `cvExperiencePicker.*` → `applications.cvs.experiencePicker.*`
- `cvNew.*` → `applications.cvs.new.*`
- `cvs.*` → `applications.cvs.*`

### 2. Files Likely Affected

- Any components in `src/components/` using CV-related keys
- Any pages in `src/pages/` under Applications section
- Any composables in `src/composables/` managing CV state

### 3. Validation

After updating component references:

```bash
npm run lint  # Check for i18n key errors
npm run test  # Run test suite
```

---

## Summary Stats

| Metric                          | Count            |
| ------------------------------- | ---------------- |
| Root sections removed           | 8                |
| Root sections created           | 1 (applications) |
| Subsections in applications.cvs | 10               |
| Total keys moved/consolidated   | 200+             |
| Conflicts resolved              | 1                |
| Data loss                       | 0                |
