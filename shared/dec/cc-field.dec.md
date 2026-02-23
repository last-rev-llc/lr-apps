# cc-field — DEC Spec

## Tag: `<cc-field>`

## Purpose
Form field component with label and built-in input types. Provides consistent styling and API.

## Attributes

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `label` | string | — | `""` | Field label |
| `type` | string | — | `"text"` | `"text"` \| `"textarea"` \| `"select"` \| `"number"` \| `"email"` \| `"url"` \| `"date"` \| `"tel"` |
| `name` | string | ✅ | `""` | Field name (used in `field-change` event) |
| `value` | string | — | `""` | Current value |
| `placeholder` | string | — | `""` | Placeholder text |
| `required` | boolean | — | — | Makes field required |
| `rows` | number | — | `4` | Textarea rows |
| `options` | JSON string | — | `[]` | For select: `["A","B"]` or `[{"value":"a","label":"A"}]` |
| `multiple` | boolean | — | — | For select: allow multi-select |

## JS API
```js
const field = document.querySelector('cc-field[name="title"]');
field.getValue();       // returns current value
field.setValue('new');   // sets value
field.clear();          // clears value
```

## Events
- `field-change` — `detail: { name, value }` — fired on input change.

## Correct Usage
```html
<cc-field label="Title" name="title" placeholder="Enter title" required></cc-field>
<cc-field label="Description" type="textarea" name="desc" rows="6"></cc-field>
<cc-field label="Category" type="select" name="cat" options='["Tech","Product","Business"]'></cc-field>
```

## Common Mistakes (Error Corrections)

- ❌ **Building custom form fields with raw `<input>`** — use `<cc-field>` for consistent styling.
- ❌ **Missing `name` attribute** — `field-change` event won't identify which field changed.
- ❌ **Passing options as HTML children for select** — use the `options` JSON attribute.
- ❌ **Invalid JSON in `options`** — must be valid JSON. Use single quotes around attribute, double inside.
- ❌ **Listening for `input` event instead of `field-change`** — use the component's custom event.
