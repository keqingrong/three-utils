/**
 * Dispose object from scene.
 * @param {object} object mesh, line, sprite etc.
 * @param {object} scene
 * @link https://github.com/mrdoob/three.js/issues/5175
 */
function disposeObject(object, scene) {
  // remove from scene
  scene.remove(object);

  const children = object.children;
  if (children && children.length > 0) {
    children.forEach(item => {
      disposeObject(item, scene);
    });
  }

  // dispose geometry
  if (object.geometry) {
    object.geometry.dispose();
  }

  // dispose material
  if (object.material) {
    if (object.material.map) {
      // dispose textures
      object.material.map.dispose();
    }
    object.material.dispose();
  }
}

export {disposeObject};
