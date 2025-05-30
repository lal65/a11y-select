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

  it('Will not attempt to progressively enhance unlabelled select elements', async () => {
    await driver.get(`http://bs-local.com/test/preflight-label-missing.html`);
    await driver.sleep(1000);
    const errors = await driver.executeScript('return window.console.errors');
    assert.strictEqual(errors.length, 1);
    assert.strictEqual(errors[0], 'Skipping a11y-select progressive enhancement due to lack of accessible label.');

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

  it('Will respect the required attribute', async () => {
    await driver.get(`http://bs-local.com/test/required-combobox.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);
    const combobox = await driver.findElement(By.css('.a11y-select__combobox'));

    assert.strictEqual(await combobox.getAttribute('aria-required'), 'true');
  });

  it('Will appropriately trigger aria-invalid', async () => {
    await driver.get(`http://bs-local.com/test/required-combobox.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);
    const combobox = await driver.findElement(By.css('.a11y-select__combobox'));

    assert.strictEqual(await combobox.getAttribute('aria-invalid'), null);

    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
    await driver.findElement(By.css('#a11y-select-demo--option-3')).click();
    assert.strictEqual(await combobox.getAttribute('aria-invalid'), null);

    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
    await driver.findElement(By.css('#a11y-select-demo--option-1')).click();
    assert.strictEqual(await combobox.getAttribute('aria-invalid'), 'true');

    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
    await driver.findElement(By.css('#a11y-select-demo--option-3')).click();
    assert.strictEqual(await combobox.getAttribute('aria-invalid'), 'false');
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
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')), 1000);
    const combobox_value = await driver.findElement(By.css('.a11y-select__value'));
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await combobox_value.click();
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
  });

  it('Opens with the enter key', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')), 1000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
  });

  it('Opens with the space key', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')), 1000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.SPACE);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
  });

  it('Opens appropriately with the arrow-down key', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')), 1000);

    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await driver.actions().keyUp(Key.ALT).sendKeys(Key.ARROW_DOWN).perform();
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-3');
  });

  it('Opens appropriately with the alt+arrow-down keys', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')), 1000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await driver.actions().keyDown(Key.ALT).sendKeys(Key.ARROW_DOWN).keyUp(Key.ALT).perform();
    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-2');
  });

  it('Opens appropriately with the arrow-up key', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')), 1000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await driver.actions().keyUp(Key.ALT).sendKeys(Key.ARROW_UP).perform();
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-1');
  });

  it('Opens appropriately with the alt+arrow-up keys', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')), 1000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await driver.actions().keyDown(Key.ALT).sendKeys(Key.ARROW_UP).keyUp(Key.ALT).perform();

    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-2');
  });

  it('Moves the active descendant down with the arrow-down key', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')), 1000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
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
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')), 1000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
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
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')), 1000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
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
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')), 1000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
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
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')), 1000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-13');

    await driver.actions().sendKeys(Key.HOME).perform();
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-1');
  });

  it('Moves the active descendant up last option with the end key', async () => {
    await driver.get(`http://bs-local.com/test/many-options.html`);
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')), 1000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-13');

    await driver.actions().sendKeys(Key.END).perform();
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-26');
  });

  it('Closes the combobox and reverts the user selection with the escape key', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')), 1000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-2');

    await driver.actions().sendKeys(Key.ARROW_DOWN).perform();
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-3');

    await driver.actions().sendKeys(Key.ESCAPE).perform();
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), null);
    const selected = await driver.findElement(By.css('[aria-selected="true"]'));
    assert.strictEqual(await selected.getAttribute('id'), 'a11y-select-demo--option-2');
  });

  it('Closes the combobox and reverts the user selection when focus is lost', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')), 1000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-2');

    await driver.actions().sendKeys(Key.ARROW_DOWN).perform();
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-3');

    await driver.findElement(By.css('body')).click();
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), null);
    const selected = await driver.findElement(By.css('[aria-selected="true"]'));
    assert.strictEqual(await selected.getAttribute('id'), 'a11y-select-demo--option-2');
  });

  it('Updates the selected option when the user clicks an option', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')), 1000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-2');

    await driver.findElement(By.css('#a11y-select-demo--option-3')).click();

    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), null);
    assert.strictEqual(await driver.findElement(By.css('[aria-selected="true"]')).getAttribute('id'), 'a11y-select-demo--option-3');
  });

  it('Updates the selected option when the user uses the enter key to select an option', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')), 1000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await driver.actions().keyUp(Key.ALT).sendKeys(Key.ARROW_DOWN).perform();
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-3');
    await driver.actions().sendKeys(Key.ENTER).perform();
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), null);
    assert.strictEqual(await driver.findElement(By.css('[aria-selected="true"]')).getAttribute('id'), 'a11y-select-demo--option-3');
  });

  it('Updates the selected option when the user uses the space key to select an option', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')), 1000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await driver.actions().keyUp(Key.ALT).sendKeys(Key.ARROW_DOWN).perform();
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-3');
    await driver.actions().sendKeys(Key.SPACE).perform();
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), null);
    assert.strictEqual(await driver.findElement(By.css('[aria-selected="true"]')).getAttribute('id'), 'a11y-select-demo--option-3');
  });

  it('Updates the selected option when the user uses the tab key to select an option', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')), 1000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await driver.actions().keyUp(Key.ALT).sendKeys(Key.ARROW_DOWN).perform();
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-3');
    await driver.actions().sendKeys(Key.TAB).perform();
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), null);
    assert.strictEqual(await driver.findElement(By.css('[aria-selected="true"]')).getAttribute('id'), 'a11y-select-demo--option-3');
  });

  it('Updates the native select element value when a new value is chosen', async () => {
    await driver.get(`http://bs-local.com/test/simple.html`);
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')), 1000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'false');
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    await combobox.sendKeys(Key.ENTER);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-demo--option-2');

    await driver.findElement(By.css('#a11y-select-demo--option-3')).click();
    const native_select = await driver.findElement(By.css('select'));
    const selected_option = await driver.findElement(By.css('option[value="' + await native_select.getAttribute('value') + '"]'));
    assert.strictEqual(await selected_option.getAttribute("textContent"), 'Option 2');
  });

});

describe('Search tests', () => {
  let driver;

  before(async () => {
    driver = await new Builder().withCapabilities({
      'goog:loggingPrefs': { browser: 'ALL' },
    }).forBrowser(Browser.CHROME).build();
  })

  after(async () => {
    await driver.quit();
  });

  it('Should expand the combobox even if there are no matches', async () => {
    await driver.get(`http://bs-local.com/test/search.html`);
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')), 1000);
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    combobox.sendKeys('z');
    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-search-demo--option-1');
  });

  it('Should move the active descendant to the first search term that matches', async () => {
    await driver.get(`http://bs-local.com/test/search.html`);
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')), 1000);
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    combobox.sendKeys('a');
    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-search-demo--option-2');
  });

  it('Should move the active descendant to the most relevant search term that matches', async () => {
    await driver.get(`http://bs-local.com/test/search.html`);
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')), 1000);
    await driver.executeScript(`document.querySelector('.a11y-select__combobox').focus();`);
    combobox.sendKeys('peac');
    const listbox = await driver.findElement(By.css('.a11y-select__listbox'));
    await driver.wait(until.elementIsVisible(listbox), 2000);
    assert.strictEqual(await combobox.getAttribute('aria-expanded'), 'true');
    assert.strictEqual(await combobox.getAttribute('aria-activedescendant'), 'a11y-select-search-demo--option-15');
  });
});

describe('Optgroup Tests', () => {
  let driver;

  before(async () => {
    driver = await new Builder().withCapabilities({
      'goog:loggingPrefs': { browser: 'ALL' },
    }).forBrowser(Browser.CHROME).build();
  })

  after(async () => {
    await driver.quit();
  });


  it('Transforms the native select element appropriately', async () => {
    await driver.get(`http://bs-local.com/test/optgroups.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);

    const select = await driver.findElement(By.tagName('select'));

    assert.strictEqual(
      await select.getCssValue('display'),
      'none',
      'The native select element is hidden from the accessibility tree.'
    );

    const native_optgroups = await driver.findElements(By.tagName('optgroup'));
    for (const optgroup of native_optgroups) {
      const label = await optgroup.getAttribute('label');
      const replacement_optgroup_label = await driver.findElement(By.xpath('//*[text()="' + label + '"][1]'));
      const replacement_optgroup = await driver.findElement(By.css(`[aria-labelledby="${await replacement_optgroup_label.getAttribute('id')}`));
      assert.strictEqual(
        await replacement_optgroup.getAttribute('role'),
        'group',
      );

      const native_options = await optgroup.findElements(By.tagName('option'));
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

    }
  });
});

describe('Dependent options', () => {
  let driver;

  before(async () => {
    driver = await new Builder().withCapabilities({
      'goog:loggingPrefs': { browser: 'ALL' },
    }).forBrowser(Browser.CHROME).build();
  })

  after(async () => {
    await driver.quit();
  });


  it('Should issue a warning when options are changed', async () => {
    await driver.get(`http://bs-local.com/test/dependent-options.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);

    await driver.findElement(By.css('#option-set-selector [value="options2"]')).click();
    await driver.sleep(1000);
    const warnings = await driver.executeScript('return window.console.warnings');
    assert.strictEqual(warnings.length, 1);
    assert.strictEqual(warnings[0], 'The native select has been modified. Users may find this confusing.');
  });

  it('Should automatically rebuild dependent options correctly', async () => {
    await driver.get(`http://bs-local.com/test/dependent-options.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);

    assert.strictEqual((await driver.findElements(By.css('[data-native-option-value="1"]'))).length, 1);
    assert.strictEqual((await driver.findElements(By.css('[data-native-option-value="2"]'))).length, 1);
    assert.strictEqual((await driver.findElements(By.css('[data-native-option-value="3"]'))).length, 1);
    assert.strictEqual((await driver.findElements(By.css('[data-native-option-value="4"]'))).length, 0);
    assert.strictEqual((await driver.findElements(By.css('[data-native-option-value="5"]'))).length, 0);
    assert.strictEqual((await driver.findElements(By.css('[data-native-option-value="6"]'))).length, 0);

    await driver.findElement(By.css('#option-set-selector [value="options2"]')).click();

    assert.strictEqual((await driver.findElements(By.css('[data-native-option-value="1"]'))).length, 0);
    assert.strictEqual((await driver.findElements(By.css('[data-native-option-value="2"]'))).length, 0);
    assert.strictEqual((await driver.findElements(By.css('[data-native-option-value="3"]'))).length, 0);
    assert.strictEqual((await driver.findElements(By.css('[data-native-option-value="4"]'))).length, 1);
    assert.strictEqual((await driver.findElements(By.css('[data-native-option-value="5"]'))).length, 1);
    assert.strictEqual((await driver.findElements(By.css('[data-native-option-value="6"]'))).length, 1);

    await driver.findElement(By.css('#option-set-selector [value="options1"]')).click();

    assert.strictEqual((await driver.findElements(By.css('[data-native-option-value="1"]'))).length, 1);
    assert.strictEqual((await driver.findElements(By.css('[data-native-option-value="2"]'))).length, 1);
    assert.strictEqual((await driver.findElements(By.css('[data-native-option-value="3"]'))).length, 1);
    assert.strictEqual((await driver.findElements(By.css('[data-native-option-value="4"]'))).length, 0);
    assert.strictEqual((await driver.findElements(By.css('[data-native-option-value="5"]'))).length, 0);
    assert.strictEqual((await driver.findElements(By.css('[data-native-option-value="6"]'))).length, 0);
  });

  it('Will appropriately revalidate the required attribute on mutation', async () => {
    await driver.get(`http://bs-local.com/test/dependent-options.html`);
    const a11y_select = await driver.findElement(By.css('.a11y-select'));
    await driver.wait(until.elementIsVisible(a11y_select), 1000);
    const combobox = await driver.findElement(By.css('.a11y-select__combobox'));

    assert.strictEqual(await combobox.getAttribute('aria-required'), null);

    await driver.executeScript('document.querySelector("#a11y-select-demo").setAttribute("required", "")');
    assert.strictEqual(await combobox.getAttribute('aria-required'), 'true');

    await driver.executeScript('document.querySelector("#a11y-select-demo").removeAttribute("required")');
    assert.strictEqual(await combobox.getAttribute('aria-required'), null);

  });
});

describe('Label association tests', () => {
  let driver;

  before(async () => {
    driver = await new Builder().withCapabilities({
      'goog:loggingPrefs': { browser: 'ALL' },
    }).forBrowser(Browser.CHROME).build();
  })

  after(async () => {
    await driver.quit();
  });


  it('Correctly assigns the aria-labelledby attribute when the native label is associated via the "for" attribute with a pre-existing ID', async () => {
    await driver.get(`http://bs-local.com/test/label-association-for.html`);
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')));
    const label = await driver.wait(until.elementLocated(By.css('label')));

    assert.strictEqual(await combobox.getAttribute('aria-labelledby'), 'pre-existing-id');
  });

  it('Correctly assigns the aria-labelledby attribute when the native label is associated via the "for" attribute without a pre-existing ID', async () => {
    await driver.get(`http://bs-local.com/test/label-association-for-without-id.html`);
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')));
    const label = await driver.wait(until.elementLocated(By.css('label')));

    assert.strictEqual(await combobox.getAttribute('aria-labelledby'), 'a11y-select-demo--combobox-label');
  });

  it('Correctly assigns the aria-labelledby attribute when the native label is associated via DOM inheritance', async () => {
    await driver.get(`http://bs-local.com/test/label-association-implicit.html`);
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')));
    const label = await driver.wait(until.elementLocated(By.css('label')));

    assert.strictEqual(await combobox.getAttribute('aria-labelledby'), await label.getAttribute('id'));
  });

  it('Correctly moves focus when the label element is clicked on', async () => {
    await driver.get(`http://bs-local.com/test/label-association-implicit.html`);
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')));
    const label = await driver.wait(until.elementLocated(By.css('label')));

    await label.click();
    assert.strictEqual(await driver.switchTo().activeElement().getAttribute('id'), await combobox.getAttribute('id'));
  });

  it('Correctly associates the aria-describedby attribute', async () => {
    await driver.get(`http://bs-local.com/test/label-association-describedby.html`);
    const combobox = await driver.wait(until.elementLocated(By.css('.a11y-select__combobox')));

    assert.strictEqual(await combobox.getAttribute('aria-describedby'), 'a11y-select-demo-more-context');

  });
});
