# i18n Structure Migration Guide

## Overview

The i18n translations have been unified to follow a consistent structure across all application pages. The new structure coexists with the old keys to maintain backward compatibility during migration.

## New Unified Structure

All resource pages (companies, experiences, stories, cvs, coverLetters, speeches, jobs) now follow this pattern:

```json
{
  "resourceName": {
    "page": {
      "title": "Resource Title",
      "description": "What this resource is about"
    },
    "list": {
      "title": "Resource Title",
      "description": "Resource description",
      "actions": {
        "add": "Add Resource",
        "create": "Create Resource"
      },
      "search": {
        "placeholder": "Search resources...",
        "noResults": "No resources match your search."
      },
      "empty": {
        "title": "No resources yet",
        "description": "Start by adding your first resource."
      },
      "errors": {
        "title": "Unable to load resources",
        "generic": "Something went wrong while loading your resources."
      }
    },
    "detail": {
      "title": "Resource Title",
      "description": "What you can do with this resource",
      "notFound": "Resource not found",
      "notFoundDescription": "The resource you're looking for doesn't exist.",
      "loading": "Loading resource...",
      "errors": {
        "title": "Unable to load resource",
        "generic": "Something went wrong while loading this resource.",
        "notFound": "This resource could not be found."
      }
    },
    "form": {
      "createTitle": "Create Resource",
      "editTitle": "Edit Resource",
      "fields": {
        "fieldName": {
          "label": "Field Label",
          "placeholder": "Enter field value...",
          "hint": "Helpful hint"
        }
      },
      "errors": {
        "title": "Unable to save resource",
        "generic": "Something went wrong while saving."
      }
    },
    "delete": {
      "title": "Delete Resource",
      "message": "Are you sure you want to delete this resource? This action cannot be undone."
    },
    "toast": {
      "created": "Resource created successfully",
      "createFailed": "Failed to create resource",
      "updated": "Resource updated successfully",
      "updateFailed": "Failed to update resource",
      "deleted": "Resource deleted successfully",
      "deleteFailed": "Failed to delete resource"
    }
  }
}
```

## Common Actions, States, and Messages

A new `common` section contains reusable translations:

```json
{
  "common": {
    "actions": {
      "add": "Add",
      "create": "Create",
      "edit": "Edit",
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete",
      "view": "View",
      "print": "Print",
      ...
    },
    "states": {
      "loading": "Loading...",
      "saving": "Saving...",
      "deleting": "Deleting...",
      "error": "Error",
      "success": "Success"
    },
    "messages": {
      "requiredField": "This field is required",
      "unsavedChanges": "You have unsaved changes",
      "confirmDelete": "Are you sure you want to delete this? This action cannot be undone.",
      ...
    }
  }
}
```

## Migration Strategy

### Phase 1: ✅ Create New Structure (DONE)

- Created `i18n/locales/en-new-structure.json` with unified pattern
- Merged with existing `en.json` preserving old keys
- Both structures coexist for backward compatibility

### Phase 2: Migrate Components (IN PROGRESS)

Update components to use new keys:

**Before:**

```vue
<template>
  <h1>{{ t('companies.list.title') }}</h1>
  <UButton>{{ t('companies.list.actions.add') }}</UButton>
</template>
```

**After:**

```vue
<template>
  <h1>{{ t('companies.page.title') }}</h1>
  <UButton>{{ t('common.actions.add') }}</UButton>
</template>
```

### Phase 3: Cleanup (TODO)

Once all components use new keys, remove old unused keys from `en.json`.

## Key Mappings

### Common Actions

Use `t('common.actions.*')` instead of resource-specific action labels:

- ✅ `t('common.actions.save')` instead of `t('companies.form.actions.save')`
- ✅ `t('common.actions.edit')` instead of `t('experiences.list.edit')`
- ✅ `t('common.actions.delete')` instead of `t('stories.card.delete')`

### Page Titles

- ✅ `t('companies.page.title')` for main page heading
- ✅ `t('companies.list.title')` for list view heading
- ✅ `t('companies.detail.title')` for detail view heading
- ✅ `t('companies.form.createTitle')` for create form heading
- ✅ `t('companies.form.editTitle')` for edit form heading

### Form Fields

All form fields are now under `form.fields.*`:

```vue
t('companies.form.fields.companyName.label') t('companies.form.fields.companyName.placeholder')
t('companies.form.fields.companyName.hint')
```

### Toast Messages

Use unified toast structure:

- ✅ `t('companies.toast.created')`
- ✅ `t('companies.toast.updated')`
- ✅ `t('companies.toast.deleted')`
- ✅ `t('companies.toast.createFailed')`

### Error Messages

- ✅ `t('companies.list.errors.title')` for list errors
- ✅ `t('companies.detail.errors.notFound')` for 404 errors
- ✅ `t('companies.form.errors.generic')` for form errors

## Resources with New Structure

All following resources have the unified structure:

- ✅ companies
- ✅ experiences
- ✅ stories
- ✅ cvs
- ✅ coverLetters
- ✅ speeches
- ✅ jobs

## Benefits

1. **Consistency**: Same structure across all pages makes it easy to find keys
2. **Reusability**: Common actions reduce duplication
3. **Scalability**: Adding new resources follows the same pattern
4. **Maintainability**: Clear organization makes updates easier
5. **Discoverability**: Predictable paths mean less searching

## Next Steps

1. Update component files to use new keys (see component list in project)
2. Test thoroughly to ensure no broken translations
3. Clean up old unused keys once migration is complete
4. Document any resource-specific keys that don't fit the pattern
