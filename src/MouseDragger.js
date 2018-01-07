import {Plane, Raycaster, Vector2, Vector3} from 'three';
import EventEmitter from 'eventemitter3';
import {getMouseNDCPosition} from './CoordinateUtils';
import {isEmptyArray} from './CommonUtils';

const MOUSE = {LEFT: 0, MIDDLE: 1, RIGHT: 2};

/*
const mouseDragger = new MouseDragger([], camera, renderer.domElement);

mouseDragger.on('dragstart', function (data) {
  console.log('dragstart', data);
  orbit.enabled = false;
});

mouseDragger.on('drag', function (data) {
  console.log('drag', data);
  const {target, position} = data;
  if (target) {
    target.position.set(position.x, position.y, position.z);
  }
});

mouseDragger.on('dragend', function (data) {
  console.log('dragend', data);
  orbit.enabled = true;
});

mouseDragger.update(scene.children);
*/
class MouseDragger extends EventEmitter {
  constructor(objects, camera, domElement) {
    super();
    this.objects = objects;
    this.camera = camera;
    this.domElement = domElement || document;
    this.mouse = new Vector2(); // 鼠标NDC坐标
    this.raycaster = new Raycaster();
    this.offset = new Vector3(); // 被选中对象中心点与鼠标间的偏移
    this.plane = new Plane(); // 被选中对象所在平面
    this.intersection = new Vector3(); // 射线与平面的交点坐标

    this.selected = null;  // 被选中对象
    this.dragging = false; // 是否正在拖拽

    this.enabled = true;

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
    document.addEventListener('mousedown', self.onDocumentMouseDown, false);
    document.addEventListener('mousemove', self.onDocumentMouseMove, false);
    document.addEventListener('mouseup', self.onDocumentMouseUp, false);
  }

  /**
   * 事件解绑
   */
  detachEvents() {
    const self = this;
    document.removeEventListener('mousedown', self.onDocumentMouseDown, false);
    document.removeEventListener('mousemove', self.onDocumentMouseMove, false);
    document.removeEventListener('mouseup', self.onDocumentMouseUp, false);
  }

  /**
   * 检查鼠标坐标是否在 DOM 容器内
   * @param {MouseEvent} event
   */
  containsMousePoint(event) {
    const {top, right, bottom, left} = this.domElement.getBoundingClientRect();
    const {clientX, clientY} = event;
    // 落在容器外部
    if (clientX < left || clientX > right || clientY < top || clientY > bottom) {
      return false;
    }
    // 容器内部
    return true;
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
   * @param {string} eventName 事件名称
   * @param {Object3D} target 投射对象
   * @param {Vector3} position 位置
   * @param {Event} domEvent DOM事件对象
   */
  emitEvent(eventName, target, position, domEvent) {
    const self = this;
    super.emit(eventName, {
      target: target,
      mouse: self.mouse,
      position: position,
      event: domEvent
    });
  }

  /**
   * 鼠标左键被按下
   * @param {MouseEvent} event
   */
  onDocumentMouseDown = (event) => {
    const self = this;
    if (!self.enabled) {
      return;
    }
    // 不处理 DOM 容器外的 mousedown 事件
    if (!self.containsMousePoint(event)) {
      return;
    }
    if (event.button === MOUSE.LEFT) {
      event.preventDefault();
      const mouse = getMouseNDCPosition(event, self.domElement);
      const current = self.rayCast(mouse) || null;
      self.mouse = mouse;
      self.selected = current;
      self.emitEvent('mousedown', current, null, event);
    }
  };

  /**
   * 鼠标左键松开
   * - [x] 鼠标拖拽过程中可能会移到浏览器外，需要发送 dragend 事件
   * @param {MouseEvent} event
   */
  onDocumentMouseUp = (event) => {
    const self = this;
    if (!self.enabled) {
      return;
    }
    if (event.button === MOUSE.LEFT) {
      event.preventDefault();
      if (self.dragging) {
        if (self.selected) {
          // 此时可以启用 OrbitControls/TrackballControls
          self.domElement.style.cursor = 'auto';
          self.emitEvent('dragend', self.selected, self.intersection.clone(), event);
          self.selected = null;
          self.dragging = false;
          return;
        }
      }
      self.selected = null;
      self.dragging = false;
      // 容器内的模拟发送点击事件
      if (self.containsMousePoint(event)) {
        self.emitEvent('mouseup', null, null, event);
        self.emitEvent('click', null, null, event);
      }
    }
  };

  /**
   * 鼠标移动
   * - [x] 鼠标拖拽过程中可能会移到浏览器外
   * @param {MouseEvent} event
   */
  onDocumentMouseMove = (event) => {
    const self = this;
    if (!self.enabled) {
      return;
    }
    event.preventDefault();
    // 之前按下过鼠标
    if (self.selected) {
      const mouse = getMouseNDCPosition(event, self.domElement);

      // 没有移动，或者移动后的 NDC 坐标没变
      if (mouse.equals(self.mouse)) {
        return;
      }
      // 更新鼠标位置
      self.mouse = mouse;

      // 判定拖拽，补发一次 dragstart 事件
      if (self.dragging === false) {
        // 此时需要禁用 OrbitControls/TrackballControls
        // 创建一个与相机方向垂直、与选中物体中心共面的平面（相机方向作为平面的法向量）
        self.plane.setFromNormalAndCoplanarPoint(self.camera.getWorldDirection(), self.selected.position);

        // 计算鼠标与物体中心的偏移
        self.raycaster.setFromCamera(self.mouse, self.camera);
        self.raycaster.ray.intersectPlane(self.plane, self.intersection);
        self.offset.copy(self.intersection).sub(self.selected.position);

        self.domElement.style.cursor = 'move';
        self.emitEvent('dragstart', self.selected, self.selected.position.clone(), event);
        self.dragging = true;
      }

      // 发射射线，获取射线与平面的交点位置
      self.raycaster.setFromCamera(self.mouse, self.camera);
      self.raycaster.ray.intersectPlane(self.plane, self.intersection);

      // 发送位置时，减去偏移
      self.emitEvent('drag', self.selected, self.intersection.sub(self.offset).clone(), event);
    }
  };
}

export default MouseDragger;
