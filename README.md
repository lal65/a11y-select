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

### `--a11y-select-combobox-font`
This property controls the font family, size, weight, style, etc...of the combobox.

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

### `--a11y-select-option-font`
This property controls the font family, size, weight, style, etc...of options.

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

### `--a11y-select-combobox-invalid-outline`
Adjust the combobox outline when in error state. This acts as a visual
indicator for the `aria-invalid` attribute.

Note that the `--a11y-select-combobox-focus-visible-outline` focus indicator
takes precedence.

### `--a11y-select-combobox-invalid-outline-offset`
Adjust the offset of the error state outline.

### `--a11y-select-option-active-descendant-background`
Adjust the background of the current active descendant.

### `--a11y-select-option-active-descendant-foreground`
Adjust the foreground of the current active descendant.

### `--a11y-select-option-active-descendant-selected-background`
Adjust the background of the currently selected active descendant.

Note this takes precedence over the
`--a11y-select-option-active-descendant-background` property, but
not the `--a11y-select-option-hovered-background` property.

### `--a11y-select-option-active-descendant-selected-foreground`
Adjust the foreground of the currently selected active descendant.

Note this takes precedence over the
`--a11y-select-option-active-descendant-foreground` property, but not the
`--a11y-select-option-hovered-foreground` property.

### `--a11y-select-option-active-descendant-selected-outline`
Adjust the outline of the currently selected active descendant.

Note this takes precedence over the
`--a11y-select-option-active-descendant-outline` property, but not the
`--a11y-select-option-active-descendant-hovered-outline` property.

### `--a11y-select-option-active-descendant-selected-outline-offset`
Adjust the outline-offset of the currently selected active descendant.
 Note this takes precedence over the
`--a11y-select-option-active-descendant-outline-offset` property, but not the
`--a11y-select-option-active-descendant-hovered-outline-offset` property.

### `--a11y-select-option-active-descendant-hovered-outline`
Adjust the outline of the active descendant hover state.

### `--a11y-select-option-active-descendant-hovered-outline-offset`
Adjust the outline-offset of the active descendant hover state.


#### Example: Default Theme
The default a11y-select theme is quite simple.
```css
:root {
 --a11y-select-combobox-background: ghostwhite url('data:image/svg+xml,<svg viewBox="0 0 13.18246 8" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M 6.0789337,7.7878096 0.21221033,1.9210554 c -0.28294711,-0.2829465 -0.28294711,-0.7416758 0,-1.02459275 L 0.89647062,0.21220341 C 1.1789345,-0.07026083 1.636726,-0.0708042 1.919855,0.21099579 L 6.5912534,4.8605021 11.2626,0.21099586 c 0.283139,-0.28180004 0.740934,-0.28125667 1.023377,0.001208 l 0.68427,0.68425917 c 0.282951,0.28294707 0.282951,0.74167527 0,1.02459277 l -5.8666887,5.866754 c -0.2829423,0.2829205 -0.7416787,0.2829205 -1.0246246,-2e-7 z" style="stroke-width:0.0301861" /></svg>') no-repeat calc(100% - 12px) center / auto 12px;
 --a11y-select-combobox-padding: 16px 44px 16px 16px;
 --a11y-select-combobox-focus-visible-outline: 2px solid black;
 --a11y-select-combobox-focus-visible-outline-offset: -2px;

 --a11y-select-listbox-background: ghostwhite;
 --a11y-select-listbox-max-height: 50vh;
 --a11y-select-listbox-padding: 16px;

 --a11y-select-group-label-padding: 16px;
 --a11y-select-group-indent: 16px;

 --a11y-select-option-padding: 16px;
 --a11y-select-option-background: ghostwhite;

 --a11y-select-option-selected-background: lightskyblue;

 --a11y-select-option-active-descendant-outline: 2px solid black;
 --a11y-select-option-active-descendant-outline-offset: -2px;

 --a11y-select-option-active-descendant-selected-background: lightskyblue;

 --a11y-select-option-active-descendant-selected-outline: 2px solid black;
 --a11y-select-option-active-descendant-selected-outline-offset: -2px;

 --a11y-select-option-hovered-background-color: navy;
 --a11y-select-option-hovered-foreground: white;

 --a11y-select-option-active-descendant-hovered-outline: 2px solid lightskyblue;
 --a11y-select-option-active-descendant-hovered-outline-offset: -4px;
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
