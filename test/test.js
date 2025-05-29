const { Builder, Browser, By, Key, until } = require('selenium-webdriver');
const assert = require('assert');

describe('Preflight checks', () => {
  let driver;

  before(async () => {
    driver = await new Builder().withCapabilities({
      'goog:loggingPrefs': { browser: 'ALL' },
    }).forBrowser(Browser.CHROME).build();
    await driver.manage().setTimeouts({ implicit: 5000 });
  })

  after(async () => {
    await driver.quit();
  });

  it('Will not generate duplicate HTML IDs', async () => {
    await driver.get(`http://bs-local.com/test/preflight-invalid-duplicate-ids.html`);
    await driver.sleep(1000);
    const errors = await driver.executeScript('return window.console.errors');
    assert.strictEqual(errors.length, 1);
    assert.strictEqual(errors[0], 'The a11y-select progressive enhancement was not applied due to an ID collision ("demo"). Ensure that all calls to a11ySelect use a distinct "unique_id" parameter.');
  });

  xit('Will not attempt to progressively enhance on unsupported user-agents', async () => {
    // @TODO: Implement test.
  });

  it('Will not attempt to progressively enhance select elements that allow multiple selections', async () => {
    await driver.get(`http://bs-local.com/test/preflight-invalid-multiple-attribute.html`);
    await driver.sleep(1000);
    const errors = await driver.executeScript('return window.console.errors');
    assert.strictEqual(errors.length, 1);
    assert.strictEqual(errors[0], 'Skipping a11y-select progressive enhancement due to unsupported "multiple" attribute.');

  });

  it('Will not attempt to progressively enhance missing elements', async () => {
    await driver.get(`http://bs-local.com/test/preflight-invalid-missing-element.html`);
    await driver.sleep(1000);
    const errors = await driver.executeScript('return window.console.errors');
    assert.strictEqual(errors.length, 1);
    assert.strictEqual(errors[0], 'Skipping a11y-select progressive enhancement for "demo" due to incorrect element type.');
  });

  it('Will not attempt to progressively enhance invalid element types', async () => {
    await driver.get(`http://bs-local.com/test/preflight-invalid-element-type.html`);
    await driver.sleep(1000);
    const errors = await driver.executeScript('return window.console.errors');
    assert.strictEqual(errors.length, 1);
    assert.strictEqual(errors[0], 'Skipping a11y-select progressive enhancement for "demo" due to incorrect element type.');
  });

  it('Will not attempt to progressively enhanced disable select elements', async () => {
    await driver.get(`http://bs-local.com/test/preflight-invalid-disabled-attribute.html`);
    await driver.sleep(1000);
    const errors = await driver.executeScript('return window.console.errors');
    assert.strictEqual(errors.length, 1);
    assert.strictEqual(errors[0], 'Skipping a11y-select progressive enhancement due to unsupported "disabled" attribute.');
  });

  xit('Will warn about the use of option groups on macOS', async () => {
    // @TODO: Implement test.
  });

  it('Will warn about disabled options', async () => {
    await driver.get(`http://bs-local.com/test/preflight-warning-disabled-elements.html`);
    await driver.sleep(1000);
    const warnings = await driver.executeScript('return window.console.warnings');
    assert.strictEqual(warnings.length, 1);
    assert.strictEqual(warnings[0], 'One or more disabled options were found. Disabled options will not be transformed. Consider adjusting the options to not include disabled ones.');
  });

});

describe('Simple Tests', () => {
  let driver;

  before(async () => {
    driver = await new Builder().withCapabilities({
      'goog:loggingPrefs': { browser: 'ALL' },
    }).forBrowser(Browser.CHROME).build();
    await driver.manage().setTimeouts({ implicit: 5000 });
  })

  after(async () => {
    await driver.quit();
  });

  it('Transforms the native select element appropriately', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);

    const select = await driver.findElement(By.tagName('select'));

    assert.strictEqual(
      await select.getCssValue('display'),
      'none',
      'The native select element is hidden from the accessibility tree.'
    );

    const native_options = await driver.findElements(By.tagName('option'));
    for (const option of native_options) {
      const value = await option.getAttribute('value');

      const replacement_option = await driver.findElement(By.css('[data-native-option-value="' + value + '"]'));
      assert.strictEqual(
        await option.getAttribute('textContent'),
        await replacement_option.getAttribute('textContent'),
        'The replacement option has an appropriate label.'
      );

      assert.strictEqual(
        await option.getAttribute('selected') ? 'true' : 'false',
        await replacement_option.getAttribute('aria-selected'),
        'The replacement option has an appropriate selection state.'
      );
    }
  });

  it('Will remove disabled options before transforming elements', async () => {
    await driver.get(`http://bs-local.com/test/simple-disabled-elements.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);
    const options = await driver.findElements(By.css('[role="option"]'));
    assert.strictEqual(options.length, 3);
  });

  it ('Opens with a mouse', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);

    const combobox = await driver.findElement(By.css('.a11y-select__combobox'));
    const combobox_value = await driver.findElement(By.css('.a11y-select__value'));
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await combobox_value.click();
    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
  });

  it('Opens with the enter key', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);

    const combobox = await driver.findElement(By.css('.a11y-select__combobox'));
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
  });

  it('Opens with the space key', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);

    const combobox = await driver.findElement(By.css('.a11y-select__combobox'));
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.SPACE);
    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
  });

  it('Opens appropriately with the arrow-down key', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);

    const combobox = await driver.findElement(By.css('.a11y-select__combobox'));
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await driver.actions().keyUp(Key.ALT).sendKeys(Key.ARROW_DOWN).perform();
    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-3');
  });

  it('Opens appropriately with the alt+arrow-down keys', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);

    const combobox = await driver.findElement(By.css('.a11y-select__combobox'));
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await driver.actions().keyDown(Key.ALT).sendKeys(Key.ARROW_DOWN).perform();
    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-2');
  });

  it('Opens appropriately with the arrow-up key', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);

    const combobox = await driver.findElement(By.css('.a11y-select__combobox'));
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await driver.actions().keyUp(Key.ALT).sendKeys(Key.ARROW_UP).perform();
    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-1');
  });

  it('Opens appropriately with the alt+arrow-up keys', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);

    const combobox = await driver.findElement(By.css('.a11y-select__combobox'));
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await driver.actions().keyDown(Key.ALT).sendKeys(Key.ARROW_UP).perform();
    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-2');
  });

  it('Moves the active descendant down with the arrow-down key', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);

    const combobox = await driver.findElement(By.css('.a11y-select__combobox'));
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-2');

    await driver.actions().sendKeys(Key.ARROW_DOWN).perform();
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-3');

    await driver.actions().sendKeys(Key.ARROW_DOWN).perform();
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-4');

    // The selection should be at the end of the options list.
    await driver.actions().sendKeys(Key.ARROW_DOWN).perform();
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-4');
  });

  it('Moves the active descendant up with the arrow-up key', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);

    const combobox = await driver.findElement(By.css('.a11y-select__combobox'));
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-2');

    await driver.actions().sendKeys(Key.ARROW_UP).perform();
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-1');

    // The selection should be at the beginning of the options list.
    await driver.actions().sendKeys(Key.ARROW_UP).perform();
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-1');
  });

  it('Moves the active descendant down 10 options with the page-down key', async () => {
    await driver.get(`http://bs-local.com/test/many-options.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);

    const combobox = await driver.findElement(By.css('.a11y-select__combobox'));
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-13');

    await driver.actions().sendKeys(Key.PAGE_DOWN).perform();
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-23');

    // Another page-up should bring it to the last option.
    await driver.actions().sendKeys(Key.PAGE_DOWN).perform();
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-26');
  });

  it('Moves the active descendant up 10 options with the page-up key', async () => {
    await driver.get(`http://bs-local.com/test/many-options.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);

    const combobox = await driver.findElement(By.css('.a11y-select__combobox'));
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-13');

    await driver.actions().sendKeys(Key.PAGE_UP).perform();
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-3');

    // Another page-up should bring it to the last option.
    await driver.actions().sendKeys(Key.PAGE_UP).perform();
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-1');
  });

  it('Moves the active descendant to the first option with the home key', async () => {
    await driver.get(`http://bs-local.com/test/many-options.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);

    const combobox = await driver.findElement(By.css('.a11y-select__combobox'));
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-13');

    await driver.actions().sendKeys(Key.HOME).perform();
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-1');
  });

  it('Moves the active descendant up last option with the end key', async () => {
    await driver.get(`http://bs-local.com/test/many-options.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);

    const combobox = await driver.findElement(By.css('.a11y-select__combobox'));
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-13');

    await driver.actions().sendKeys(Key.END).perform();
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-26');
  });

  it('Closes the combobox and reverts the user selection with the escape key', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);

    const combobox = await driver.findElement(By.css('.a11y-select__combobox'));
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-2');

    await driver.actions().sendKeys(Key.ARROW_DOWN).perform();
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-3');

    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.wait(until.elementIsNotVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), null);
    const selected = await driver.findElement(By.css('[aria-selected="true"]'));
    assert.strictEqual(await selected.getAttribute('id'), 'a11y-select-demo--option-2');
  });

  it('Closes the combobox and reverts the user selection when focus is lost', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);

    const combobox = await driver.findElement(By.css('.a11y-select__combobox'));
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-2');

    await driver.actions().sendKeys(Key.ARROW_DOWN).perform();
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-3');

    await driver.findElement(By.css('body')).click();
    await driver.wait(until.elementIsNotVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), null);
    const selected = await driver.findElement(By.css('[aria-selected="true"]'));
    assert.strictEqual(await selected.getAttribute('id'), 'a11y-select-demo--option-2');
  });

  it('Updates the selected option when the user clicks an option', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);

    const combobox = await driver.findElement(By.css('.a11y-select__combobox'));
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-2');

    await driver.findElement(By.css('#a11y-select-demo--option-3')).click();
    await driver.wait(until.elementIsNotVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), null);
    assert.strictEqual(await driver.findElement(By.css('[aria-selected="true"]')).getAttribute('id'), 'a11y-select-demo--option-3');
  });

  it('Updates the selected option when the user uses the enter key to select an option', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);

    const combobox = await driver.findElement(By.css('.a11y-select__combobox'));
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await driver.actions().keyUp(Key.ALT).sendKeys(Key.ARROW_DOWN).perform();
    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-3');
    await driver.actions().sendKeys(Key.ENTER).perform();
    await driver.wait(until.elementIsNotVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), null);
    assert.strictEqual(await driver.findElement(By.css('[aria-selected="true"]')).getAttribute('id'), 'a11y-select-demo--option-3');
  });

  it('Updates the selected option when the user uses the space key to select an option', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);

    const combobox = await driver.findElement(By.css('.a11y-select__combobox'));
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await driver.actions().keyUp(Key.ALT).sendKeys(Key.ARROW_DOWN).perform();
    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-3');
    await driver.actions().sendKeys(Key.SPACE).perform();
    await driver.wait(until.elementIsNotVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), null);
    assert.strictEqual(await driver.findElement(By.css('[aria-selected="true"]')).getAttribute('id'), 'a11y-select-demo--option-3');
  });

  it('Updates the selected option when the user uses the tab key to select an option', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);

    const combobox = await driver.findElement(By.css('.a11y-select__combobox'));
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await driver.actions().keyUp(Key.ALT).sendKeys(Key.ARROW_DOWN).perform();
    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-3');
    await driver.actions().sendKeys(Key.TAB).perform();
    await driver.wait(until.elementIsNotVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), null);
    assert.strictEqual(await driver.findElement(By.css('[aria-selected="true"]')).getAttribute('id'), 'a11y-select-demo--option-3');
  });

});

/*describe('Optgroup Tests', () => {

});*/