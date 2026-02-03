# i18n CV Architecture Refactoring

## Goal
Split CV-related i18n keys into two distinct processes:
1. **Ingestion** - CV parsing/import (extracting experiences)
2. **Applications** - CV generation (creating application materials)

## Target Structure

```
ingestion:
  cv:
    upload: {}        # All CV parsing/import keys

applications:
  cvs:
    page: {}          # Page metadata (title, description)
    list: {}          # CV list/management
    display: {}       # CV viewing/editing
    generate: {}      # CV generation flow
    settings: {}      # CV default settings
    templates: {}     # CV template management/editor
  coverLetters: {}    # Existing structure
  speeches: {}        # Existing structure
```

## Key Mapping: oldKey → newKey

### INGESTION - CV Upload/Parsing
These keys manage the CV parsing and experience extraction process.

| Old Key | New Key | Content |
|---------|---------|---------|
| `cvUpload.title` | `ingestion.cv.upload.title` | "Upload Your CV" |
| `cvUpload.description` | `ingestion.cv.upload.description` | "Upload your CV to extract..." |
| `cvUpload.dropzoneText` | `ingestion.cv.upload.dropzoneText` | "Drop your CV here or click..." |
| `cvUpload.dropzoneHint` | `ingestion.cv.upload.dropzoneHint` | "Supports PDF and TXT files..." |
| `cvUpload.fileUploaded` | `ingestion.cv.upload.fileUploaded` | "File uploaded: {fileName}" |
| `cvUpload.parsing` | `ingestion.cv.upload.parsing` | "Parsing your CV..." |
| `cvUpload.parsingDescription` | `ingestion.cv.upload.parsingDescription` | "AI is extracting your..." |
| `cvUpload.sections` | `ingestion.cv.upload.sections` | Object with "experiences" key |
| `cvUpload.confirmImport` | `ingestion.cv.upload.confirmImport` | "Confirm & continue" |
| `cvUpload.importing` | `ingestion.cv.upload.importing` | "Creating experiences..." |
| `cvUpload.successSummary` | `ingestion.cv.upload.successSummary` | "Imported {created}..." |
| `cvUpload.viewExperiences` | `ingestion.cv.upload.viewExperiences` | "View Experiences" |
| `cvUpload.errors` | `ingestion.cv.upload.errors` | Error messages object |

---

### APPLICATIONS - CV Management & Generation
These keys manage CV creation, display, settings, and templating for application materials.

#### List/Management
| Old Key | New Key | Content |
|---------|---------|---------|
| `cvList.title` | `applications.cvs.list.title` | "My CVs" |

#### Settings
| Old Key | New Key | Content |
|---------|---------|---------|
| `cvSettings.*` | `applications.cvs.settings.*` | All CV settings keys |
| `cvSettings.title` | `applications.cvs.settings.title` | "CV settings" |
| `cvSettings.subtitle` | `applications.cvs.settings.subtitle` | "Set defaults for every CV..." |
| `cvSettings.sections` | `applications.cvs.settings.sections` | Object with sections config |
| `cvSettings.template` | `applications.cvs.settings.template` | Template selection |
| `cvSettings.sectionLabels` | `applications.cvs.settings.sectionLabels` | Section label mappings |
| `cvSettings.experiences` | `applications.cvs.settings.experiences` | Experience picker config |
| `cvSettings.other` | `applications.cvs.settings.other` | Other settings |
| `cvSettings.toast` | `applications.cvs.settings.toast` | Save/error messages |

#### Generation Flow
| Old Key | New Key | Content |
|---------|---------|---------|
| `cvGenerate.*` | `applications.cvs.generate.*` | All CV generation keys |
| `cvGenerate.title` | `applications.cvs.generate.title` | "Generate CV" |
| `cvGenerate.subtitle` | `applications.cvs.generate.subtitle` | "Create a new CV using..." |
| `cvGenerate.defaultName` | `applications.cvs.generate.defaultName` | "CV — {date}" |
| `cvGenerate.entry` | `applications.cvs.generate.entry` | Pre-generation review |
| `cvGenerate.modal` | `applications.cvs.generate.modal` | Generation confirmation modal |
| `cvGenerate.actions` | `applications.cvs.generate.actions` | Generate/settings buttons |
| `cvGenerate.toast` | `applications.cvs.generate.toast` | Generation success/error |

#### Display/Editing
| Old Key | New Key | Content |
|---------|---------|---------|
| `cvDisplay.*` | `applications.cvs.display.*` | All CV display/edit keys |
| `cvDisplay.untitled` | `applications.cvs.display.untitled` | "Untitled CV" |
| `cvDisplay.description` | `applications.cvs.display.description` | "Review and refine..." |
| `cvDisplay.loading` | `applications.cvs.display.loading` | "Loading CV..." |
| `cvDisplay.saving` | `applications.cvs.display.saving` | "Saving changes..." |
| `cvDisplay.editMode` | `applications.cvs.display.editMode` | "Edit CV Content" |
| `cvDisplay.contentLabel` | `applications.cvs.display.contentLabel` | "Markdown Content" |
| `cvDisplay.markdownPlaceholder` | `applications.cvs.display.markdownPlaceholder` | Editor placeholder |
| `cvDisplay.markdownHelp` | `applications.cvs.display.markdownHelp` | Markdown syntax help |
| `cvDisplay.notFound` | `applications.cvs.display.notFound` | "CV Not Found" |
| `cvDisplay.notFoundDescription` | `applications.cvs.display.notFoundDescription` | Error description |
| `cvDisplay.actions` | `applications.cvs.display.actions` | Edit/print/export buttons |
| `cvDisplay.toast` | `applications.cvs.display.toast` | Save messages |
| `cvDisplay.photoToggleLabel` | `applications.cvs.display.photoToggleLabel` | "Profile photo" |
| `cvDisplay.photoToggleDescription` | `applications.cvs.display.photoToggleDescription` | Photo toggle help |
| `cvDisplay.photoToggleOn` | `applications.cvs.display.photoToggleOn` | "Photo included" |
| `cvDisplay.photoToggleOff` | `applications.cvs.display.photoToggleOff` | "Photo hidden" |
| `cvDisplay.photoLoading` | `applications.cvs.display.photoLoading` | "Loading profile photo..." |
| `cvDisplay.photoUnavailable` | `applications.cvs.display.photoUnavailable` | "No profile photo found..." |
| `cvDisplay.photoPreviewHelp` | `applications.cvs.display.photoPreviewHelp` | Photo preview help |
| `cvDisplay.photoAlt` | `applications.cvs.display.photoAlt` | "Profile photo" |

#### Templates
| Old Key | New Key | Content |
|---------|---------|---------|
| `cvTemplates.*` | `applications.cvs.templates.*` | All template management |
| `cvTemplates.list` | `applications.cvs.templates.list` | Template listing page |
| `cvTemplates.editor` | `applications.cvs.templates.editor` | Template editor interface |
| `cvTemplates.labels` | `applications.cvs.templates.labels` | Label/badge strings |
| `cvTemplates.system` | `applications.cvs.templates.system` | System template definitions |
| `cvTemplates.delete` | `applications.cvs.templates.delete` | Delete confirmation |
| `cvTemplates.toast` | `applications.cvs.templates.toast` | Operation messages |
| `cvTemplates.errors` | `applications.cvs.templates.errors` | Error messages |

#### Helper Components (New location)
| Old Key | New Key | Content |
|---------|---------|---------|
| `cvExperiencePicker.*` | `applications.cvs.experiencePicker.*` | Experience selection modal |
| `cvNew.*` | `applications.cvs.new.*` | New CV flow messages |

---

### Related Keys (Not moving, but referencing CV context)
These stay in their current locations but reference CV concepts:

| Key | Location | Notes |
|-----|----------|-------|
| `tailoredMaterials.*` | Root level | References CVs in tailored materials context |
| `settings.cv.*` | Root level | High-level CV settings navigation |
| `cvs.*` (new structured) | Root level | The unified CVs resource (already refactored) |

---

## Navigation References Update

Current navigation references:
- `navigation.cvUpload: "Upload CV"` → Update to use `ingestion.cv.upload.title`
- `features.cvUpload.*` → Clarify if feature description or ingestion reference
- `navigation.cv: "CV"` → Keep (general label, but can also reference `applications.cvs.page.title`)

---

## Implementation Notes

1. **No Value Changes**: All string values remain identical; only key paths change
2. **Backward Compatibility**: Old keys can coexist during transition if needed
3. **Component Updates**: Will require code changes to reference new key paths
4. **Test Strategy**: Validate all old → new mappings are correctly updated in code
5. **Phased Approach**: 
   - Phase 1: Define architecture (this document)
   - Phase 2: Refactor i18n keys
   - Phase 3: Update component references
   - Phase 4: Remove old keys

---

## File Structure After Refactoring

```json
{
  "ingestion": {
    "cv": {
      "upload": {
        "title": "...",
        "description": "...",
        "dropzoneText": "...",
        // ... all upload-specific keys
      }
    }
  },
  "applications": {
    "cvs": {
      "page": {
        "title": "...",
        "description": "..."
      },
      "list": {
        "title": "..."
      },
      "settings": {
        "title": "...",
        "subtitle": "...",
        // ... all settings keys
      },
      "generate": {
        "title": "...",
        "subtitle": "...",
        // ... all generation keys
      },
      "display": {
        "untitled": "...",
        // ... all display/edit keys
      },
      "templates": {
        "list": { ... },
        "editor": { ... },
        // ... all template keys
      },
      "experiencePicker": {
        "title": "...",
        // ... picker keys
      },
      "new": {
        "generating": { ... }
      }
    },
    "coverLetters": { ... },  // Existing
    "speeches": { ... }        // Existing
  }
}
```

---

## Summary

**Total Keys to Move: 70+**
- Ingestion CV Upload: 13 keys
- Applications CVs Settings: 20 keys
- Applications CVs Generate: 15 keys
- Applications CVs Display: 21 keys
- Applications CVs Templates: 8 keys
- Applications CVs Experience Picker: 8 keys
- Applications CVs New: 2 keys
