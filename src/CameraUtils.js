import {
  Frustum,
  Matrix4,
  Math as _Math
} from 'three';
import {isEmpty} from './CommonUtils';

const {degToRad} = _Math;

/**
 * 计算相机高度
 * @param {object} camera 相机
 * @param {number|null} width 三维空间可视宽度
 * @param {number|null} height 三维空间可视高度
 * @return {number|null}
 */
function getCameraDistance(camera, width, height) {
  if (!camera || camera.isCamera !== true) {
    console.error(`${camera} is not an instance of THREE.Camera`);
    return null;
  }
  if (camera.isPerspectiveCamera) {
    const aspect = camera.aspect;
    const vFOV = degToRad(camera.fov); // 垂直视场，转换为弧度制方便计算
    const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * aspect); // 水平视场
    const _width = width || 0;
    const _height = height || 0;
    const distanceV = (_height / 2) / Math.tan(vFOV / 2);
    const distanceH = (_width / 2) / Math.tan(hFOV / 2);
    if (width && isEmpty(height)) {       // 只传宽度
      return distanceH;
    } else if (isEmpty(width) && height) { // 只传高度
      return distanceV;
    } else if (width && height) {          // 同时传宽高
      return Math.max(distanceV, distanceH);
    }
    console.error('至少需要传入可视宽度或者高度');
  } else if (camera.isOrthographicCamera) {
    // TODO: 待完善
  } else {
    console.error('暂不支持该相机类型');
  }
  return null;
}

/**
 * 判断对象是否在相机视锥内
 * @param {object} camera
 * @param {object} object
 * @return {boolean}
 * @link https://stackoverflow.com/questions/10858599/how-to-determine-if-plane-is-in-three-js-camera-frustum
 */
function isInViewFrustum(camera, object) {
  // 更新相机的矩阵
  camera.updateMatrix();
  camera.updateMatrixWorld(true);
  camera.matrixWorldInverse.getInverse(camera.matrixWorld);

  // 更新物体的矩阵
  if (object.updateMatrix) {
    object.updateMatrix();
    object.updateMatrixWorld(true);
  }

  // 获取当前相机的视锥
  const frustum = new Frustum();
  frustum.setFromMatrix(new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));

  if (object.isVector3) {
    return frustum.containsPoint(object);
  } else if (object.geometry) {
    // have Geometry or BufferGeometry
    return frustum.intersectsObject(object);
  } else if (object.isSprite) {
    return frustum.intersectsSprite(object);
  } else {
    console.error('暂不支持该对象', object);
    return false;
  }
}

export {
  getCameraDistance,
  isInViewFrustum
};
