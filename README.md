# a11y-select
## What is this project?
This project aims to be a no-frills replacement for native `<select>` elements
that can be targeted with CSS styles. It is based on the [WAI Select-Only
Combobox Example](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/).

## What is this project NOT?
1. This project is NOT a replacement for well-formed, semantic HTML. In fact,
this project performs a series of pre-flight checks to determine if
progressively enhancing the native element will result in an accessible user
experience and will abort if any critical issues are found.  It will **_not_**
attempt to automatically "fix" the web application.
2. This project is NOT a kitchen-sink build-a-combobox utility. History has
proven that a kitchen-sink approach to the combobox design pattern inevitably
leads to impossible to maintain code, maintainer burn-out, and poor
accessibility.
3. This project is NOT in the business of making unreasonable
backwards-compatibility accommodations. There are well documented expectations
in regard to what are supported customizations. If customizations are made
outside the documented expectations, expect breakages between releases.

## Basic Example
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>a11y-select | Basic Example</title>
    <link rel="stylesheet" href="dist/a11y-select.min.css">
  </head>
  <body>
    <label for="demo-select">Demo Select</label>
    <select id="demo-select">
      <option>Select an option</option>
      <option value="option-1">Option 1</option>
      <option value="option-2">Option 2</option>
      <option value="option-3">Option 3</option>
    </select>
    <script type="module">
      import {a11ySelect} from 'dist/a11y-select.min.mjs';
      a11ySelect(document.getElementById('demo-select'), 'demo');
    </script>
  </body>
</html>
```

## User Guide
### Prerequisites / Pre-flight Checks
1. This library actively prevents ID attribute collisions. When instantiating
a progressively enhanced select element, the caller must provide a unique ID
that will be internally tracked by the library. Attempting to initialize
multiple select elements with the same ID will result in a console error.

2. This library does not support multiple selection. The `<select multiple>`
design pattern suffers from well documented user experience problems.
Supporting this pattern is not on the roadmap and attempting to initialize
a select element with the multiple attribute will result in a console error.

3. This library does not support disabled select elements.  Disabling form
elements in general is highly discouraged and will result in inaccessible
user experiences. Attempting to initialize a disabled select element will
result in a console error.

4. This library does not support select elements without an accessible label.
This label can either be associated with the native control via the `for`
attribute, or implicitly via having a parent `<label>` element. Attempting to
initialize a select element without an accessible label will result in a
console error.

5. This library will emit warnings when the native select element contains
`<optgroup>` elements. There are known issues with Safari and Voiceover such
that [nested group accessible names are not announced properly](https://bugs.webkit.org/show_bug.cgi?id=293506).

6. This library will emit warnings when any child element of the native select
element has the `disabled` attribute.  Disabled options are not well-supported
by assistive technology, and as a result, then are filtered out of the
resulting combobox structure.

7. This library will emit warnings when the native select element undergoes
any changes outside the library itself.  The "dependent options" design pattern
should be avoided and may lead to confusion.

### How to customize (the right way)
This library exposes a number of CSS custom properties which can be used to
apply custom styling.

### `--a11y-select-combobox-background`
This forms the background of the combobox. It's recommended to add a decorative
icon in the background that indicates to visual users that they can expand the
combobox.

### `--a11y-select-combobox-foreground`
This is the text color of the combobox. Ensure at least a 3:1 contrast ratio
against the chosen background color.

### `--a11y-select-combobox-padding`
Adjust the combobox padding. Ensure the tap area height of the combobox is at
least 44px high to help meet touch target accessibility requirements.

### `--a11y-select-combobox-border-radius`
Customize the border radius of the combobox. There is another custom property
that can be used to further refine the border radius only when the combobox is
open.

### `--a11y-select-combobox-expanded-border-radius`
It is common to want to zero out the bottom-left and bottom-right border radii
when the combobox is expanded.

### `--a11y-select-combobox-box-shadow`
Give the combobox a box shadow to hint visual users that activating the
combobox will open a drop-down. It is recommended to add a similar, if
not exactly the same, box shadow to the listbox element.

### `--a11y-select-combobox-focus-visible-outline` (falls back to `revert`)
Adjust the focus-visible indicator. Note that also adjusting the outline offset
may be required to prevent the listbox from clipping the bottom edge of the
focus indicator.

### `--a11y-select-combobox-focus-visible-outline-offset`
Adjust the offset of the focus-visible indicator. It is common to set this to
a negative value to prevent the listbox from clipping the bottom edge of the
focus indicator.

### `--a11y-select-listbox-z-index` (falls back to  `1`)
This z-index value is for the expandable panel. It should be set to a value
greater than zero to ensure that subsequent a11y-select elements do not obscure
one that may be expanded.

### `--a11y-select-listbox-padding`
Adjust the padding of the listbox.

### `--a11y-select-listbox-background`
This forms the background of the listbox. It's recommended to match the color
of the combobox to ensure design consistency.

### `--a11y-select-listbox-border-radius`
Adjust the border radius of the listbox. If the combobox border radius is also
customized, it's recommended to match the bottom-left and bottom-right
property values here to add the visual illusion that the combobox expands
rather than having an adjacent element simply appear.

### `--a11y-select-listbox-box-shadow`
Adjust the box shadow of the listbox. It's recommended to match the box shadow
of the combobox.

### `--a11y-select-listbox-max-height`
Adjust the maximum height of the listbox. It is recommended that this value be
based on the viewport height unit to ensure that the listbox options do not
flow off-screen in ways that the user cannot interact with.

### `--a11y-select-group-label-font`
Adjust the font of group labels. It is recommended to visually bold this.

### `--a11y-select-group-label-padding`
Adjust the padding of group labels.

### `--a11y-select-group-indent`
Adjust the indentation of options within groups.

### `--a11y-select-option-background`
This forms the background of an option. It's recommended to match the color
of the combobox to ensure design consistency. Additional properties exist
for selected and hovered states. It's critical to provide visually distinct
styles for each state.

### `--a11y-select-option-foreground`
This is the text color of an option. Ensure at least a 3:1 contrast ratio
against the chosen option background color. Additional properties exist
for selected and hovered states.

### `--a11y-select-option-border-radius`
Adjust the border radius of options.

### `--a11y-select-option-padding`
Adjust the padding of options. Ensure the tap area height of options is at
least 44px high to help meet touch target accessibility requirements.

### `--a11y-select-option-selected-background`
This forms the background of an option when it is selected. It's recommended
to add a decorative checkmark icon as part of the background to visually 
indicate that the option is selected.

### `--a11y-select-option-selected-foreground`
This is the text color of an option. Ensure at least a 3:1 contrast ratio
against the chosen selected option background color.

### `--a11y-select-option-hovered-background-color`
This adjusts the background color of an option when it is hovered over. Given
that an option may be selected or not, only the background-color property is
affected by this customization point.

### `--a11y-select-option-hovered-foreground`
This is the text color of an option. Ensure at least a 3:1 contrast ratio
against the chosen hovered option background color.

### `--a11y-select-option-active-descendant-outline`
Adjust the active descendant indicator. Note that also adjusting the outline
offset may be required to prevent the next option from clipping the bottom 
edge of the active descendant indicator.

### `--a11y-select-option-active-descendant-outline-offset`
Adjust the offset of the active descendant indicator. It is common to set this
to a negative value to prevent the next option from clipping the bottom edge of
the active descendant indicator.

#### Example: Default Theme
The default a11y-select theme is quite simple.
```css
:root {
  --a11y-select-combobox-background: ghostwhite;
  --a11y-select-combobox-padding: 1rem;
  --a11y-select-combobox-focus-visible-outline: .2rem solid black;
  --a11y-select-combobox-focus-visible-outline-offset: -2px;
  --a11y-select-listbox-background: ghostwhite;
  --a11y-select-listbox-max-height: 50vh;
  --a11y-select-listbox-padding: 1rem;
  --a11y-select-group-label-padding: 1rem;
  --a11y-select-group-indent: 1rem;
  --a11y-select-option-padding: 1rem;
  --a11y-select-option-background: ghostwhite;
  --a11y-select-option-selected-background: lightskyblue;
  --a11y-select-option-active-descendant-outline: .2rem solid black;
  --a11y-select-option-active-descendant-outline-offset: -2px;
  --a11y-select-option-hovered-background: navy;
  --a11y-select-option-hovered-foreground: white;
}
```

#### Unsupported customizations
The internal HTML structure that is generated by this library is not subject
to backwards-compatibility guarantees. Given the nature of assistive technology
and how difficult it is to maintain compatibility amongst all major vendors, it
is not possible to also guarantee stable markup.

1. Any attempts to override CSS via cascade is not subject to
backwards-compatibility guarantees.  Use the custom properties instead.
2. Any attempts to modify the structure of any element within the
`.a11y-select` element with javascript is not supported.
