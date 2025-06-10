const unique_ids = [];

export const a11ySelect = (native_select, unique_id) => {

  // First up, run some mission-critical checks that should gracefully abort.

  // Do not allow this library to duplicate id attributes.
  if (unique_ids.indexOf(unique_id) > -1) {
    console.error('The a11y-select progressive enhancement was not applied due to an ID collision ("' + unique_id + '"). Ensure that all calls to a11ySelect use a distinct "unique_id" parameter.');
    return;
  }
  unique_ids.push(unique_id);

  // @TODO: Remove user-agent detection when macOS 14 is no longer supported.
  const is_probably_macos = navigator.platform === 'MacIntel';
  const is_probably_safari = navigator.vendor === 'Apple Computer, Inc.';

  // Prior to macOS 15, the aria-activedescendant attribute is not supported.
  // This attribute is critical for the proper identification of the currently
  // active descendant for VoiceOver on macOS.  Our testing indicates that the
  // attribute is of lesser importance for VoiceOver on iOS.
  if (is_probably_macos && is_probably_safari) {
    console.info('The a11y-select progressive enhancement was not applied due to an incompatible user-agent.  The combobox pattern is not accessible in macOS 14 or earlier and Apple does not allow for operating system version detection via javascript.');
    return;
  }

  // Make sure the element that was passed in is actually a select.
  if (native_select?.tagName?.toLowerCase() !== 'select') {
    console.error('Skipping a11y-select progressive enhancement for "' + unique_id + '" due to incorrect element type.');
    return;
  }

  // Multiple selections result in poor UX and are NOT supported.
  if (native_select.hasAttribute('multiple')) {
    console.error('Skipping a11y-select progressive enhancement due to unsupported "multiple" attribute.');
    return;
  }
  if (native_select.hasAttribute('disabled')) {
    console.error('Skipping a11y-select progressive enhancement due to unsupported "disabled" attribute.');
    return;
  }

  // Make sure that the native control has an accessible label.
  let native_label = native_select.closest('label');
  if (!native_label && native_select.hasAttribute('id')) {
    native_label = document.querySelector('label[for="' + native_select.getAttribute('id') + '"]');
  }

  if (!native_label) {
    console.error('Skipping a11y-select progressive enhancement due to lack of accessible label.');
    return;
  }

  // Next up, some run-time education...

  // Option groups have never really had good accessibility support. In
  // particular, Apple doesn't seem to care about color contrast, and Voiceover
  // does not seem to announce the option group labels as the user navigates
  // inside.
  // @see https://bugs.webkit.org/show_bug.cgi?id=293506
  if (is_probably_macos && native_select.querySelector('optgroup')) {
    console.warn('Option groups are not well supported on MacOS / Voiceover. Instead of using option groups, consider a different user experience.')
  }

  // The disabled options may result in poor accessibility.
  if (native_select.querySelector('[disabled]')) {
    console.warn('One or more disabled options were found. Disabled options will not be transformed. Consider adjusting the options to not include disabled ones.');
  }

  // If we got this far, it should be smooth sailing.

  /**
   * This element wraps around the entirety of the a11y-select instance.
   *
   * @type {HTMLElement}
   */
  const wrapping_element = Object.assign(document.createElement('div'), {
    className: 'a11y-select',
  });

  native_select.insertAdjacentElement('afterend', wrapping_element);
  wrapping_element.appendChild(native_select);

  /**
   * This element is the combobox.
   *
   * @type {HTMLElement}
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/combobox_role
   */
  const combobox = Object.assign(document.createElement('div'), {
    className: 'a11y-select__combobox',
    tabIndex: '0',
    ariaHasPopup: 'listbox',
    role: 'combobox',
    ariaExpanded: 'false',
  });
  combobox.setAttribute('aria-controls', `a11y-select-${unique_id}--listbox`);

  if (!native_label.hasAttribute('id')) {
    native_label.setAttribute('id', `a11y-select-${unique_id}--combobox-label`);
  }
  combobox.setAttribute('aria-labelledby', native_label.getAttribute('id'));

  if (native_select.hasAttribute('aria-describedby')) {
    combobox.setAttribute('aria-describedby', native_select.getAttribute('aria-describedby'));
  }

  native_label.addEventListener('click', () => {
    combobox.focus();
  });

  // When the combobox element is clicked, toggle the combobox state. If
  // the new state is to be closed, the user selection is reverted to what it
  // previously was when they last opened it.
  combobox.addEventListener('click', () => {
    if (combobox.getAttribute('aria-expanded') === 'true') {
      closeCombobox(false);
    }
    else {
      openCombobox();
    }
  });

  /**
   * This element is the listbox that is controlled by the combobox.
   *
   * @type {HTMLDivElement}
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/listbox_role
   */
  const listbox = Object.assign(document.createElement('div'), {
    className: 'a11y-select__listbox',
    id: `a11y-select-${unique_id}--listbox`,
    role: 'listbox',
    tabIndex: '-1',
  });

  function revalidate_attributes() {
    if (native_select.hasAttribute('required')) {
      combobox.setAttribute('aria-required', 'true');
    }
    else {
      combobox.removeAttribute('aria-required');
    }
    if (native_select.hasAttribute('aria-describedby')) {
      combobox.setAttribute('aria-describedby', native_select.getAttribute('aria-describedby'));
    }
    else {
      combobox.removeAttribute('aria-describedby');
    }
  }

  function revalidate_options() {

    options = [];
    listbox.innerHTML = '';
    // Now we have to iterate over all the things inside the native select
    // element and populate the combobox options.  Select elements can contain
    // both option and optgroup elements, each of which can be disabled.  When
    // an optgroup is disabled, this property is effectively inherited by all
    // child options.  This is a very troublesome pattern for accessibility and
    // if detected, a console warning was previously emitted by this library.

    // Set up some counters in order to keep the option ID values unique.
    let group_counter = 0, option_counter = 0;


    /**
     * Transforms a native option element to a combobox option.
     *
     * @param {HTMLElement} option
     *   The option to transform.
     * @param {HTMLElement} parent
     *   The parent element of the option.
     * @param {number} unique_counter
     *   An integer that aids in keeping IDs unique.
     *
     * @returns {HTMLDivElement}
     */
    function create_combobox_option(option, parent, unique_counter) {

      const combobox_option = Object.assign(document.createElement('div'), {
        className: `a11y-select__option${option.hasAttribute('selected') ? ' a11y-select__option--selected' : ''}`,
        id: `a11y-select-${unique_id}--option-${unique_counter}`,
        role: 'option',
        tabIndex: '-1',
        ariaSelected: option.hasAttribute('selected') ? 'true' : 'false',
        textContent: option.textContent,
      });

      combobox_option.setAttribute('data-native-option-value', option.getAttribute('value'));
      combobox_option.addEventListener('click', e => {
        e.preventDefault();
        active_descendant = combobox_option;
        closeCombobox(true);
      });
      options.push(combobox_option);
      parent.appendChild(combobox_option);
    }

    /**
     * Transforms a native option element to a combobox option.
     *
     * @param {HTMLElement} group
     *   The option group to transform.
     * @param {number} unique_counter
     *   An integer that aids in keeping IDs unique.
     *
     * @returns {HTMLDivElement}
     */
    function create_combobox_group(group, unique_counter) {
      const group_accessible_name = Object.assign(document.createElement('div'), {
        className: 'a11y-select__group-label',
        role: 'presentation',
        tabindex: '-1',
        id: `a11y-select-${unique_id}--optgroup-${unique_counter}`,
        textContent: group.getAttribute('label'),
      });

      const combobox_group = Object.assign(document.createElement('div'), {
        className: 'a11y-select__group',
        role: 'group',
      });

      combobox_group.appendChild(group_accessible_name);
      combobox_group.setAttribute('aria-labelledby', `a11y-select-${unique_id}--optgroup-${unique_counter}`);
      group.querySelectorAll('option:not([disabled])').forEach(option => {
        create_combobox_option(option, combobox_group, ++option_counter);
      });

      listbox.appendChild(combobox_group);
    }

    native_select.querySelectorAll(':scope > option:not([disabled]), :scope > optgroup:not([disabled])').forEach(native_element =>  {
      if (native_element.tagName.toLowerCase() === 'optgroup') {
        create_combobox_group(native_element, ++group_counter);
      }
      else {
        create_combobox_option(native_element, listbox, ++option_counter);
      }
    });

    // If no option is selected, we should use the first option.  Note that we
    // have already removed all the disabled options.
    // @see https://html.spec.whatwg.org/multipage/form-elements.html#selectedness-setting-algorithm
    active_descendant = last_selected_option = selected_option = listbox.querySelector('[aria-selected="true"]') ?? options[0];
    selected_option?.setAttribute('aria-selected', 'true');
    selected_option?.classList.add('a11y-select__option--selected');
    combobox.textContent = selected_option?.textContent;
  }

  /**
   * These options are used for constant time lookups.
   *
   * @type {HTMLElement[]}
   */
  let options = [];

  /**
   * The option that was previously selected prior to opening the combobox.
   *
   * This option is used to restore the user's last choice if the combobox is
   * closed in a manner that indicates the user wants to cancel the operation,
   * such as via the escape key.
   *
   * @type {HTMLElement}
   */
  let last_selected_option = null;

  /**
   * The option that is currently selected.
   *
   * This option carries the aria-selected="true" designation.
   *
   * @type {HTMLElement}
   */
  let selected_option = null;

  /**
   * The option that is currently the active descendant.
   *
   * This option is the target of the combobox aria-activedescendant attribute.
   *
   * @type {HTMLElement}
   */
  let active_descendant = null;

  /**
   * A buffer that holds recent keystrokes.
   *
   * @type {string}
   */
  let search_buffer = '';

  /**
   * The id of the search buffer timeout function.
   *
   * @type {number|null}
   */
  let search_buffer_timeout_id = null;

  /**
   * Ensures that the activeElement remains visible within the scrollParent.
   *
   * This was adapted from the WAI combobox select only example.
   *
   * @see https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/
   */
  function maintainScrollVisibility() {
    const { offsetHeight, offsetTop } = active_descendant;
    const { offsetHeight: parentOffsetHeight, scrollTop } = listbox;

    const isAbove = offsetTop < scrollTop;
    const isBelow = offsetTop + offsetHeight > scrollTop + parentOffsetHeight;

    if (isAbove) {
      listbox.scrollTo(0, offsetTop);
    } else if (isBelow) {
      listbox.scrollTo(0, offsetTop - parentOffsetHeight + offsetHeight);
    }
  }


  /**
   * Opens the combobox.
   */
  function openCombobox() {
    combobox.setAttribute('aria-expanded', 'true');
    revalidateState();
  }

  /**
   * Closes the combobox.
   *
   * @param {boolean} update_selection
   *   If true, the selection will be updated, otherwise it will be reverted.
   */
  function closeCombobox(update_selection) {
    combobox.setAttribute('aria-expanded', 'false');
    if (update_selection) {
      if (last_selected_option !== active_descendant) {
        last_selected_option = selected_option = active_descendant;
        observer.disconnect();
        native_select.value = selected_option.getAttribute('data-native-option-value');
        native_select.dispatchEvent(new Event('change'));
        if (!native_select.checkValidity()) {
          combobox.setAttribute('aria-invalid', 'true');
        }
        else if (combobox.getAttribute('aria-invalid') === 'true') {
          combobox.setAttribute('aria-invalid', 'false');
        }
        observer.observe(native_select, {attributes: true, attributeFilter: ['required', 'aria-describedby'], childList: true, subtree: true, characterData: true});
      }
    }
    else {
      if (combobox.hasAttribute('aria-invalid') && !native_select.checkValidity()) {
        combobox.setAttribute('aria-invalid', 'true');
      }
      active_descendant = selected_option = last_selected_option;
    }
    revalidateState();
    combobox.removeAttribute('aria-activedescendant');
  }

  /**
   * Revalidates the combobox state.
   */
  function revalidateState() {
    combobox.setAttribute('aria-busy', 'true');
    combobox.removeAttribute('aria-activedescendant');

    // Reset the aria-selected option.
    listbox.querySelector('[aria-selected="true"]')?.setAttribute('aria-selected', 'false');

    listbox.querySelector('.a11y-select__option--selected')?.classList.remove('a11y-select__option--selected');

    // Reset the aria-activedescendant option.
    listbox.querySelector('.a11y-select__option--active-descendant')?.classList.remove('a11y-select__option--active-descendant');

    // Re-apply the correct aria-selected option.
    selected_option?.setAttribute('aria-selected', 'true');
    selected_option?.classList.add('a11y-select__option--selected');

    // Re-apply the aria-activedescendant option.
    active_descendant?.classList.add('a11y-select__option--active-descendant');
    if (active_descendant) {
      combobox.setAttribute('aria-activedescendant', active_descendant.getAttribute('id'));
    }

    combobox.textContent = selected_option.textContent;

    combobox.removeAttribute('aria-busy');
  }

  // When focus leaves the expanded combobox, close it and revert the user
  // selection to what it previously was when they last opened it.
  combobox.addEventListener('focusout', e => {
    if (combobox.getAttribute('aria-expanded') === 'true' && !combobox.nextElementSibling.contains(e.relatedTarget)) {
      closeCombobox(false);
    }
    combobox.setAttribute('aria-invalid', native_select.checkValidity() ? 'false' : 'true');
  });

  // React to a pile of keydown events.
  combobox.addEventListener('keydown', e => {

    // The tab key should close the combobox, persist the user selection
    // and continue bubbling the event up through the DOM.  Ultimately, unless
    // cancelled by another listener, focus will proceed to the next (or
    // previous if the user activated the alt key) focusable element.
    if (e.key === 'Tab') {
      selected_option = active_descendant;
      closeCombobox(true);
    }
      // The escape key should close the combobox and revert the user selection
    // to the state it was the last time they opened the combobox.
    else if (e.key === 'Escape') {
      closeCombobox(false);
    }
      // The space key should toggle the combobox state.  If the combobox is
      // currently closed: it should be opened.  If the combobox is currently
    // open: it should be closed and the user selection should be persisted.
    else if (e.key === 'Enter' || e.key === ' ') {
      if (combobox.getAttribute('aria-expanded') === 'true') {
        closeCombobox(true);
      }
      else {
        openCombobox();
      }
    }
      // The home key should move the selection to the first option if the
    // combobox is currently open.
    else if (e.key === 'Home') {
      if (combobox.getAttribute('aria-expanded') === 'true') {
        e.preventDefault();
        active_descendant = options[0];
        revalidateState();
        maintainScrollVisibility();
      }
    }
      // The page up key should move the selection up by 10 options or to the
    // first option, whichever comes first if the combobox is currently open.
    else if (e.key === 'PageUp') {
      if (combobox.getAttribute('aria-expanded') === 'true') {
        e.preventDefault();
        active_descendant = options[Math.max(0, options.indexOf(active_descendant) - 10)];
        revalidateState();
        maintainScrollVisibility(active_descendant, listbox);
      }
    }
      // The arrow up key has multiple functions.  If the combobox is currently
      // closed, the combobox is opened.  Furthermore, unless the user was
      // holding the alt key, the current selection will be moved up one option
      // unless the user was already on the first option in the list. If the
      // combobox is currently open, the current selection is moved up one option
    // unless the user was already on the first option in the list.
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (combobox.getAttribute('aria-expanded') === 'false') {
        if (!e.altKey) {
          active_descendant = options[Math.max(0, options.indexOf(active_descendant) - 1)];
        }
        openCombobox();
      }
      else {
        active_descendant = options[Math.max(0, options.indexOf(active_descendant) - 1)];
        revalidateState();
      }
      maintainScrollVisibility(active_descendant, listbox);
    }
      // The arrow down key has multiple functions.  If the combobox is currently
      // closed, the combobox is opened.  Furthermore, unless the user was
      // holding the alt key, the current selection will be moved down one option
      // unless the user was already on the last option in the list. If the
      // combobox is currently open, the current selection is moved down one
    // option unless the user was already on the last option in the list.
    else if (e.key === 'ArrowDown') {
      e.preventDefault();

      if (combobox.getAttribute('aria-expanded') === 'false') {
        if (!e.altKey) {
          active_descendant = options[Math.min(options.indexOf(active_descendant) + 1, options.length - 1)];
        }
        openCombobox();
      }
      else {
        active_descendant = options[Math.min(options.indexOf(active_descendant) + 1, options.length - 1)];
        revalidateState();
      }

      maintainScrollVisibility(active_descendant, listbox);
    }
      // The page down key should move the selection up by 10 options or to the
    // last option, whichever comes first if the combobox is currently open.
    else if (e.key === 'PageDown') {
      if (combobox.getAttribute('aria-expanded') === 'true') {
        e.preventDefault();
        active_descendant = options[Math.min(options.indexOf(active_descendant) + 10, options.length - 1)];
        revalidateState();
        maintainScrollVisibility(active_descendant, listbox);
      }
    }
      // The home key should move the selection to the last option if the
    // combobox is currently open.
    else if (e.key === 'End') {
      if (combobox.getAttribute('aria-expanded') === 'true') {
        e.preventDefault();
        active_descendant = options[options.length - 1];
        revalidateState();
        maintainScrollVisibility();
      }
    }
    else if (e.key.length === 1) {
      if (combobox.getAttribute('aria-expanded') === 'false') {
        openCombobox();
      }

      if (search_buffer_timeout_id !== null) {
        clearTimeout(search_buffer_timeout_id);
      }
      search_buffer_timeout_id = setTimeout(() => {
        search_buffer = '';
        search_buffer_timeout_id = null;
      }, 500);

      search_buffer += e.key;

      const matching_options = options
        .filter(option => option.textContent.toLowerCase().indexOf(search_buffer) === 0);

      if (matching_options.length) {
        active_descendant = matching_options[0];
        maintainScrollVisibility();
      }

      revalidateState()
    }

  });

  const observer = new MutationObserver(function(mutations) {

    observer.disconnect();
    let revalidated_attributes = false, revalidated_options = false;
    for (const mutation of mutations) {
      if (!revalidated_attributes && mutation.type === 'attributes') {
        revalidate_attributes();
        revalidated_attributes = true;
      }
      else if (!revalidated_options) {
        console.warn('The native select has been modified. Users may find this confusing.');
        revalidate_options();
        revalidated_options = true;
      }
    }
    observer.observe(native_select, {attributes: true, attributeFilter: ['required', 'aria-describedby'], childList: true, subtree: true, characterData: true});
  });
  revalidate_attributes();
  revalidate_options();

  // Finally, swap out the native select element with the new one.  Ideally,
  // the native select element will have the same styling as the combobox.
  // That would make for a zero-layout-shift replacement.
  requestAnimationFrame(() => {
    wrapping_element.appendChild(combobox);
    wrapping_element.appendChild(listbox);
    observer.observe(native_select, {attributes: true, attributeFilter: ['required', 'aria-describedby'],  childList: true, subtree: true, characterData: true});
  });

};