export const isUndefined = (object) => (typeof object === 'undefined');
export const isNull = (object) => (object === null);
export const isFunction = (object) => (typeof object === 'function');
export const isNumber = (object) => (typeof object === 'number');
export const isString = (object) => (typeof object === 'string');
export const isObject = (object) => (Object.prototype.toString.call(object) === '[object Object]');
export const isDate = (object) => (Object.prototype.toString.call(object) === '[object Date]');
export const isValidDate = (object) => (isDate(object) && !isNaN(object.getTime()));
export const isNaN = (object) => (Number.isNaN(object));
export const isArray = (object) => (Array.isArray(object));
export const isFinite = (object) => (Number.isFinite(object));

/**
 * undefined, null, '', [], {}
 * 与 Lodash 不同的是， 此处认为 0 非空
 * @param object
 * @return {boolean}
 */
export const isEmpty = (object) => {
  if (isUndefined(object)) {
    return true;
  }
  if (isNull(object)) {
    return true;
  }
  if (isString(object) && object.length === 0) {
    return true;
  }
  if (isArray(object) && object.length === 0) {
    return true;
  }
  if (isObject(object) && Object.keys(object).length === 0) {
    return true;
  }
  if (isNumber(object)) {
    return false;
  }
  return false;
};

/**
 * 空数组
 * @param object
 * @return {boolean}
 */
export const isEmptyArray = (object) => {
  if (isArray(object) && object.length === 0) {
    return true;
  }
};
