import {
  Vector3,
  Box3
} from 'three';

/**
 * 计算 Sprite 的包围盒：使用 position 和 scale 属性模拟
 * @param {Sprite} sprite
 * @param {Vector3} sprite.position
 * @param {Vector3} sprite.scale
 * @returns {Box3}
 */
function computeSpriteBBox(sprite) {
  const position = sprite.position;
  const scale = sprite.scale;
  const min = new Vector3(position.x - scale.x / 2, position.y - scale.y / 2, position.z);
  const max = new Vector3(position.x + scale.x / 2, position.y + scale.y / 2, position.z);
  return new Box3(min, max);
}

/**
 * 计算包围盒
 * @param {Mesh|Line|LineSegments|Sprite|Group|Object3D} object
 * @returns {Box3}
 */
function computeBBox(object) {
  // min: ( + Infinity, + Infinity, + Infinity ), max: ( - Infinity, - Infinity, - Infinity )
  const bBox = new Box3();
  if (object.geometry) {
    // Mesh, Line 等有 geometry 属性的对象内置 computeBoundingBox() 方法
    bBox.setFromObject(object);
    // Line, LineSegments 可能没有顶点
    if (bBox.isEmpty()) {
      return bBox;
    }
    return bBox;
  } else if (object.isSprite) {
    return computeSpriteBBox(object);
  } else {
    const children = object.children;
    if (children.length > 0) {
      children.forEach((child) => {
        let childBBox = computeBBox(child);
        bBox.union(childBBox); // 取最小值和最大值
      });
      // TODO: 需要考虑父容器 Group 的位置、缩放
      bBox.expandByVector(object.position); // 边界的最大值加上position，最小值减去position
      return bBox;
    }
    console.warn(`暂不支持计算 ${object.type} 类型对象的包围盒`); // eslint-disable-line no-console
    return bBox;
  }
}

export {
  computeSpriteBBox,
  computeBBox
};
