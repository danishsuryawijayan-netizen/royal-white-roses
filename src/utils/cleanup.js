/**
 * Pembersihan deterministik seluruh resource WebGL/Three.js (geometri, material, tekstur)
 * agar aman terhadap React StrictMode dan unmount berulang.
 */
export function disposeMaterial(material) {
  if (!material) return;
  const materials = Array.isArray(material) ? material : [material];
  for (let i = 0; i < materials.length; i += 1) {
    const mat = materials[i];
    if (!mat) continue;
    Object.values(mat).forEach((val) => {
      if (val && typeof val === 'object' && val.isTexture) {
        val.dispose();
      }
    });
    if (mat.uniforms) {
      Object.values(mat.uniforms).forEach((uniform) => {
        if (uniform?.value && typeof uniform.value === 'object' && uniform.value.isTexture) {
          uniform.value.dispose();
        }
      });
    }
    mat.dispose();
  }
}

export function disposeObject3D(root) {
  if (!root) return;
  const disposedGeometries = new Set();
  root.traverse((node) => {
    if (node.geometry && !disposedGeometries.has(node.geometry)) {
      disposedGeometries.add(node.geometry);
      node.geometry.dispose();
    }
    if (node.material) {
      disposeMaterial(node.material);
    }
  });
}