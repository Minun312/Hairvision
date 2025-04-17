import { useEffect, useRef } from "react";
import * as THREE from "three";
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";

export default function Wavy2() {
  const viewerRef = useRef(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = parseInt(urlParams.get("mode")) || 0;

    const viewer = new GaussianSplats3D.Viewer({
      cameraUp: [0, 1, 0],
      initialCameraPosition: [-0.02885, 0.064, 0.812],
      initialCameraLookAt: [0, 0, 0],
      sphericalHarmonicsDegree: 2,
      alphaBlendMode: "PREMULTIPLIED_ALPHA",
      sortPoints: true,
    });

    viewerRef.current = viewer;

    const path = `/assets/data/wavy2/wavy2${mode ? "_high" : ""}.ksplat`;

    viewer
      .addSplatScene(path, {
        progressiveLoad: false,
      })
      .then(() => {
        if (viewerRef.current) {
          viewer.start();

          viewer.setBackgroundColor(new THREE.Color(0x000000));
          viewer.setRenderQuality(1.0);
        }
      })
      .catch((error) => {
        console.error("Error loading splat scene:", error);
      });

    return () => {
      if (viewerRef.current) {
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
    };
  }, []);

  return (
    <div
      id="gaussian-splats-container"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
