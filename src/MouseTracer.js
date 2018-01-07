import {Raycaster, Vector2} from 'three';
import EventEmitter from 'eventemitter3';
import Hammer from 'hammerjs';
import {getMouseNDCPosition} from './CoordinateUtils';
import {isEmptyArray} from './CommonUtils';

class MouseTracer extends EventEmitter {
  constructor(objects, camera, domElement) {
    super();
    this.objects = objects;
    this.camera = camera;
    this.domElement = domElement || document;
    this.mouse = new Vector2();
    this.raycaster = new Raycaster();
    this.intersected = null;

    this.enabled = true;
    this.enableMouseMove = true;
    this.enableClick = true;
    this.enableDoubleClick = true;
    this.enableContextMenu = true;

    // 使用 Hammer.js 修复双击时触发两次单击的问题
    this.hammertime = new Hammer.Manager(this.domElement);
    const singleTap = new Hammer.Tap({event: 'singletap'});
    const doubleTap = new Hammer.Tap({event: 'doubletap', taps: 2});
    this.hammertime.add([doubleTap, singleTap]);
    doubleTap.recognizeWith(singleTap);
    singleTap.requireFailure([doubleTap]);

    // 自动绑定事件
    this.attachEvents();
  }

  /**
   * 更新需要光线投射的对象
   * @param objects
   */
  update(objects) {
    this.objects = objects;
  }

  /**
   * 重置
   */
  reset() {
    const self = this;
    self.enabled = true;
    self.enableMouseMove = true;
    self.enableClick = true;
    self.enableDoubleClick = true;
    self.enableContextMenu = true;
  }


  /**
   * 回收处理
   */
  dispose() {
    this.detachEvents();
  }

  /**
   * 事件绑定
   */
  attachEvents() {
    const self = this;
    self.domElement.addEventListener('mousemove', self.onMouseMove, false);
    self.domElement.addEventListener('contextmenu', self.onContextMenu, false);

    self.hammertime.on('singletap', self.onClick);
    self.hammertime.on('doubletap', self.onDoubleClick);
  }

  /**
   * 事件解绑
   */
  detachEvents() {
    const self = this;
    self.domElement.removeEventListener('mousemove', self.onMouseMove, false);
    self.domElement.removeEventListener('contextmenu', self.onContextMenu, false);

    self.hammertime.off('singletap', self.onClick);
    self.hammertime.off('doubletap', self.onDoubleClick);
  }

  /**
   * 获取DOM事件对象，hammer.js event => dom event
   * @param {Event|MouseEvent} event
   * @return {Event|MouseEvent} event
   */
  getDomEvent(event) {
    if (event.srcEvent !== undefined) {
      return event.srcEvent;
    }
    return event;
  }

  /**
   * 获取鼠标投射到的物体
   * @param {Vector2} mouse
   * @returns {Object3D|null}
   */
  rayCast(mouse) {
    const self = this;
    if (isEmptyArray(self.objects)) {
      return null;
    }
    self.raycaster.setFromCamera(mouse, self.camera);
    let intersects = self.raycaster.intersectObjects(self.objects, true);
    if (intersects.length > 0) {
      return intersects[0].object;
    }
    return null;
  }

  /**
   * 事件发送
   * @param eventName 事件名称
   * @param target 投射对象
   * @param domEvent DOM事件对象
   */
  emitEvent(eventName, target, domEvent) {
    super.emit(eventName, {
      target: target,
      event: domEvent
    });
  }

  /**
   * 鼠标移动
   * @param event
   */
  onMouseMove = (event) => {
    const self = this;
    if (self.enabled === false) {
      return;
    }
    if (self.enableMouseMove === false) {
      return;
    }
    event.preventDefault();
    const domEvent = self.getDomEvent(event);
    const mouse = getMouseNDCPosition(domEvent, self.domElement);
    const current = self.rayCast(mouse);

    // 之前有 intersected 对象
    if (self.intersected !== null && self.intersected !== current) {
      self.emitEvent('mouseleave', self.intersected, domEvent);
    }
    // 两次投射对象不同
    if (current && self.intersected !== current) {
      self.emitEvent('mouseenter', current, domEvent);
    }
    if (current) {
      self.intersected = current;
    } else {
      self.intersected = null;
    }
  };

  /**
   * 单击
   * @param event
   */
  onClick = (event) => {
    const self = this;
    if (self.enabled === false) {
      return;
    }
    if (self.enableClick === false) {
      return;
    }
    event.preventDefault();
    const domEvent = self.getDomEvent(event);
    const mouse = getMouseNDCPosition(domEvent, self.domElement);
    console.log('mouse', mouse);
    const current = self.rayCast(mouse);
    if (current) {
      self.emitEvent('click', current, domEvent);
    }
  };

  /**
   * 双击
   * @param event
   */
  onDoubleClick = (event) => {
    const self = this;
    if (self.enabled === false) {
      return;
    }
    if (self.enableDoubleClick === false) {
      return;
    }
    event.preventDefault();
    const domEvent = self.getDomEvent(event);
    const mouse = getMouseNDCPosition(domEvent, self.domElement);
    const current = self.rayCast(mouse);
    if (current) {
      self.emitEvent('dblclick', current, domEvent);
    }
  };

  /**
   * 右击
   * @param event
   */
  onContextMenu = (event) => {
    const self = this;
    if (self.enabled === false) {
      return;
    }
    if (self.enableContextMenu === false) {
      return;
    }
    event.preventDefault();
    const domEvent = self.getDomEvent(event);
    const mouse = getMouseNDCPosition(domEvent, self.domElement);
    const current = self.rayCast(mouse);
    if (current) {
      self.emitEvent('contextmenu', current, domEvent);
    }
  };
}

export default MouseTracer;
