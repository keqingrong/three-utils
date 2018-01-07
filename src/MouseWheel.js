import {Vector3} from 'three';
import {getMouseNDCPosition} from './CoordinateUtils';

const center = new Vector3(0, 0, 0);

/**
 * 控制器 控制鼠标滚轮滚动相机位置，在dom内拖拽相机位置
 */
export default class MouseWheel {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement || document;
    this.enabled = true;
    this.enableDrag = true;
    this.enableWheel = true;
    this.dragging = false;

    this.farDistance = 15000000;  // 相机离中心点允许的最远的距离
    this.nearDistance = 200;  // 相机离中心点允许的最远的距离

    // 自动绑定事件
    this.attachEvents();
  }

  /**
   * 设置相机离中心点最远和最近距离
   * @param {number} near 最近距离
   * @param {number} far 最远距离
   */
  setRangeDistance = (near, far) => {
    this.farDistance = far;
    this.nearDistance = near;
  };

  /**
   * 事件绑定
   */
  attachEvents = () => {
    this.domElement.addEventListener('wheel', this.onMouseWheel, false);
    this.domElement.addEventListener('mousedown', this.onDocumentMouseDown, false);
    this.domElement.addEventListener('mousemove', this.onDocumentMouseMove, false);
    this.domElement.addEventListener('mouseup', this.onDocumentMouseUp, false);
  };

  /**
   * 事件解绑
   */
  detachEvents = () => {
    this.domElement.addEventListener('wheel', this.onMouseWheel, false);
    this.domElement.addEventListener('mousedown', this.onDocumentMouseDown, false);
    this.domElement.addEventListener('mousemove', this.onDocumentMouseMove, false);
    this.domElement.addEventListener('mouseup', this.onDocumentMouseUp, false);
  };

  /**
   * 鼠标滚轮滚动
   */
  onMouseWheel = (event) => {
    const self = this;
    if (this.enabled === false || this.enableWheel === false) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    const mouse = getMouseNDCPosition(event, self.domElement);
    const vector = new Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(self.camera);
    vector.sub(self.camera.position);

    const distance = self.camera.position.distanceTo(center); // 相机离中心点的距离
    let factor = distance * this.scale(Math.pow(distance, 2) / Math.pow(this.farDistance, 2), 0.02, 1); // 离得越远，缩放的倍数就越大

    if (event.deltaY < 0) {
      // 鼠标滚轮向上滚 把相机向鼠标在的点移动 视觉效果根据鼠标点位置放大场景
      let nextPosition = new Vector3(0, 0, 0).addVectors(self.camera.position, vector.setLength(factor));
      let willDistance = nextPosition.distanceTo(center);
      if (willDistance < self.nearDistance || nextPosition.z < 0) {
        return;
      }
      self.camera.position.set(nextPosition.x, nextPosition.y, nextPosition.z);
      // self.camera.position.addVectors(self.camera.position, vector.setLength(factor));
    } else {
      // 鼠标滚轮向下滚 把相机向鼠标在的点移动 视觉效果根据鼠标点位置缩小场景
      let nextPosition = new Vector3(0, 0, 0).subVectors(self.camera.position, vector.setLength(factor));
      let willDistance = nextPosition.distanceTo(center);
      if (willDistance > self.farDistance) {
        return;
      }
      self.camera.position.set(nextPosition.x, nextPosition.y, nextPosition.z);
    }
  };

  /**
   * 鼠标按下事件
   */
  onDocumentMouseDown = (event) => {
    if (this.enabled === false || this.enableDrag === false) {
      return;
    }
    // 不处理 DOM 容器外的 mousedown 事件
    if (!this.containsMousePoint(event)) {
      return;
    }
    this.mouse = getMouseNDCPosition(event, this.domElement);
    this.dragging = true;
    this.domElement.style.cursor = 'pointer';
  };

  /**
   * 鼠标移动
   */
  onDocumentMouseMove = (event) => {
    const self = this;
    if (self.enabled === false || self.enableDrag === false || self.dragging === false) {
      return;
    }
    const mouse = getMouseNDCPosition(event, this.domElement);
    if (mouse.equals(self.mouse)) {
      return;
    }
    if (mouse.x >= 1 || mouse.y >= 1) {
      self.domElement.style.cursor = 'auto';
      return;
    }
    self.domElement.style.cursor = 'pointer';
    const vector = new Vector3(mouse.x - self.mouse.x, mouse.y - self.mouse.y, 0);
    const distance = self.camera.position.distanceTo(center);
    self.camera.position.subVectors(self.camera.position, vector.setLength(distance * 0.05));
    self.mouse = mouse;
  };

  /**
   * 鼠标松开
   */
  onDocumentMouseUp = (event) => {
    if (this.enabled === false || this.enableDrag === false) {
      return;
    }
    this.dragging = false;
    this.domElement.style.cursor = 'auto';
  };

  // [0, 1] => [a, b]
  scale = (x, a, b) => {
    return (b - a) * x + a;
  };

  /**
   * 检查鼠标坐标是否在 DOM 容器内
   * @param {MouseEvent} event
   */
  containsMousePoint = (event) => {
    const {top, right, bottom, left} = this.domElement.getBoundingClientRect();
    const {clientX, clientY} = event;
    // 落在容器外部
    if (clientX < left || clientX > right || clientY < top || clientY > bottom) {
      return false;
    }
    // 容器内部
    return true;
  };
}
