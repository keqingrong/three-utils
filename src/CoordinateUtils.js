import {Vector2} from 'three';
import {isFunction} from './CommonUtils';

/**
 * 标准化到 [-1,1] 区间
 * @param {Number} number
 * @return {Number}
 */
function normalize(number) {
  if (number < -1) {
    return -1;
  } else if (number > 1) {
    return 1;
  } else {
    return number;
  }
}

/**
 * 获取鼠标 NDC 坐标
 * @param {MouseEvent} event
 * @param {Element} container
 * @return {Vector2}
 */
function getMouseNDCPosition(event, container) {
  let rect;
  // 传了 container，且是 Element
  if (container && isFunction(container.getBoundingClientRect)) {
    rect = container.getBoundingClientRect();
  } else {
    // 没有传 container
    rect = {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight
    };
  }
  const {left, top, width, height} = rect;
  if (event.clientX === undefined || event.clientY === undefined) {
    console.warn(`${event} 不是标准的 DOM 事件，缺少 clientX, clientY 属性`); // eslint-disable-line no-console
  }
  // 相对于视口 => 相对于容器
  const clientX = event.clientX - left;
  const clientY = event.clientY - top;
  const x = (clientX / width) * 2 - 1;
  const y = -(clientY / height) * 2 + 1;
  return new Vector2(normalize(x), normalize(y));
}

export {
  normalize,
  getMouseNDCPosition
};
