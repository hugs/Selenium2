// Copyright 2010 WebDriver committers
// Copyright 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


/**
 * @fileoverview Atoms-based implementation of the webelement interface.
 */

goog.provide('webdriver.element');

goog.require('bot.dom');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.math');
goog.require('goog.string');
goog.require('goog.style');


/**
 * Get the value of the given property or attribute. If the "attribute" is for
 * a boolean property, we return null in the case where the value is false. If
 * the attribute name is "style" an attempt to convert that style into a string
 * is done.
 *
 * @param {!Element} element The element to use.
 * @param {!string} attribute The name of the attribute to look up.
 * @return {string} The string value of the attribute or property, or null.
 */
webdriver.element.getAttribute = function(element, attribute) {
  var value = null;
  var name = attribute.toLowerCase();

  if ('style' == attribute.toLowerCase()) {
    value = element.style;

    if (value && !goog.isString(value)) {
      value = value.cssText;
    }

    return value;
  }

  if ('selected' == name || 'checked' == name &&
      bot.dom.isSelectable(element)) {
    return bot.dom.isSelected(element) ? 'true' : null;
  }

  // Our tests suggest that returning the attribute is desirable for
  // the href attribute of <a> tags and the src attribute of <img> tags,
  // but we normally attempt to get the property value before the attribute.
  var isLink = bot.dom.isElement(element, goog.dom.TagName.A);
  var isImg = bot.dom.isElement(element, goog.dom.TagName.IMG);

  // Although the attribute matters, the property is consistent. Return that in
  // preference to the attribute for links and images.
  if ((isImg && name == 'src') || (isLink && name == 'href')) {
    value = bot.dom.getAttribute(element, name);
    if (value) {
      // We want the full URL if present
      value = bot.dom.getProperty(element, name);
    }
    return value;
  }

  var property;
  try {
    property = bot.dom.getProperty(element, attribute);
  } catch (e) {
    // Leaves property undefined or null
  }

  // 1- Call getAttribute if getProperty fails,
  // i.e. property is null or undefined.
  // This happens for event handlers in Firefox.
  // For example, calling getProperty for 'onclick' would
  // fail while getAttribute for 'onclick' will succeed and
  // return the JS code of the handler.
  //
  // 2- When property is an object we fall back to the
  // actual attribute instead.
  // See issue http://code.google.com/p/selenium/issues/detail?id=966
  if (!goog.isDefAndNotNull(property) || goog.isObject(property)) {
    value = bot.dom.getAttribute(element, attribute);
  } else {
    value = property;
  }

  // The empty string is a valid return value.
  return goog.isDefAndNotNull(value) ? value.toString() : null;
};


/**
 * Get the location of the element, if it's displayed.
 *
 * @param {!Element} element The element to get the location for.
 * @return {goog.math.Rect} The bounding rectangle of the element.
 */
webdriver.element.getLocation = function(element) {
  if (!bot.dom.isShown(element)) {
    return null;
  }
  return goog.style.getBounds(element);
};


/**
 * @param {Element} element The element to use.
 * @return {boolean} Whether the element is in the HEAD tag.
 * @private
 */
webdriver.element.isInHead_ = function(element) {
  while (element) {
    if (element.tagName && element.tagName.toLowerCase() == 'head') {
      return true;
    }
    try {
      element = element.parentNode;
    } catch (e) {
      // Fine. the DOM has dispeared from underneath us
      return false;
    }
  }

  return false;
};


/**
 * @param {Element} element The element to get the text from.
 * @return {string} The visible text or an empty string.
 */
webdriver.element.getText = function(element) {
  if (webdriver.element.isInHead_(element)) {
    var doc = goog.dom.getOwnerDocument(element);
    if (element.tagName.toUpperCase() == goog.dom.TagName.TITLE &&
        goog.dom.getWindow(doc) == bot.window_.top) {
      return goog.string.trim(doc.title);
    }
    return '';
  }

  return bot.dom.getVisibleText(element);
};
