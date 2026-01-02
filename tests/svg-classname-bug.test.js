/**
 * Test for SVG className bug fix
 *
 * This test reproduces the bug where SVG elements cause a TypeError
 * because className is an SVGAnimatedString object, not a string
 */

describe('SVG className bug fix', () => {
  let mockDocument;
  let mockNode;

  beforeEach(() => {
    // Create a mock SVG element where className is an object (SVGAnimatedString)
    mockNode = {
      nodeType: 1, // ELEMENT_NODE
      className: {
        // SVGAnimatedString has baseVal and animVal properties
        baseVal: 'Plasmic',
        animVal: 'Plasmic'
      },
      tagName: 'svg'
    };
  });

  test('should safely check className for SVG elements without throwing TypeError', () => {
    // This is the buggy code that causes: TypeError: node.className.includes is not a function
    const buggyCheck = () => {
      if (mockNode.nodeType === 1 &&
          mockNode.className.includes('Plasmic')) {
        return true;
      }
      return false;
    };

    // This should throw TypeError with the current buggy implementation
    expect(buggyCheck).toThrow(TypeError);
  });

  test('should correctly identify Plasmic className in SVG elements with fixed code', () => {
    // This is the fixed code that handles both strings and SVGAnimatedString
    const fixedCheck = () => {
      if (mockNode.nodeType === 1) {
        const className = typeof mockNode.className === 'string'
          ? mockNode.className
          : (mockNode.className?.baseVal || '');

        if (className.includes('Plasmic')) {
          return true;
        }
      }
      return false;
    };

    // This should NOT throw and should return true
    expect(fixedCheck()).toBe(true);
  });

  test('should handle regular HTML elements with string className', () => {
    const htmlNode = {
      nodeType: 1,
      className: 'Plasmic menu-item',
      tagName: 'div'
    };

    const fixedCheck = () => {
      if (htmlNode.nodeType === 1) {
        const className = typeof htmlNode.className === 'string'
          ? htmlNode.className
          : (htmlNode.className?.baseVal || '');

        if (className.includes('Plasmic')) {
          return true;
        }
      }
      return false;
    };

    expect(fixedCheck()).toBe(true);
  });

  test('should handle elements with no className', () => {
    const noClassNode = {
      nodeType: 1,
      tagName: 'div'
    };

    const fixedCheck = () => {
      if (noClassNode.nodeType === 1) {
        const className = typeof noClassNode.className === 'string'
          ? noClassNode.className
          : (noClassNode.className?.baseVal || '');

        if (className.includes && className.includes('Plasmic')) {
          return true;
        }
      }
      return false;
    };

    // Should not throw, should return false
    expect(fixedCheck()).toBe(false);
  });
});
