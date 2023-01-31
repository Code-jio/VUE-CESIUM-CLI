<template>
  <div id="cesiumContainer"></div>
</template>

<script setup>
import "@/utils/circleRipple.js";
import "@/utils/LineFlow.js";
import "@/utils/radarScan.js";
import TrackMatte from "@/utils/trackMatte.js";
import { onMounted } from "vue";
import { Ion, Viewer, createWorldTerrain, Cartesian3, Math } from "cesium";
Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhYTAwYjQ4YS00YmYzLTRkZDQtOWM2Zi00ZmY4ZTRlYzJlMDYiLCJpZCI6ODU1NjgsImlhdCI6MTY2MjA4Mzc5Nn0.3fKd5dr-G90a1bsl-Mi7BYxFXLM37jcybNDd6dxnKdI";

// 立体雷达扫描
const trackMatter = (viewer) => {
  new TrackMatte({
    viewer: viewer,
    id: 1,
    shortwaveRange: 1000.0,
    position: [116.4, 39.89],
  });
};
// 平面雷达扫描
const createRadar = (viewer) => {
  let radar = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(116.397, 39.918),
    name: "雷达扫描",
    ellipse: {
      semiMajorAxis: 1000.0,
      semiMinorAxis: 1000,
      material: new Cesium.RadarScanMaterialProperty({
        color: new Cesium.Color(1.0, 1.0, 0.0, 0.7),
        speed: 8.0,
      }),
      height: 20.0,
      heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
      outline: true,
      outlineColor: new Cesium.Color(1.0, 1.0, 0.0, 1.0),
    },
  });
};

// 创建飞线
const parabola = (startPosition, endPosition, height = 0, count = 50) => {
  let result = [];
  height = Math.max(+height, 100);
  count = Math.max(+count, 50);
  let diffLon = Math.abs(startPosition[0] - endPosition[0]);
  let diffLat = Math.abs(startPosition[1] - endPosition[1]);
  let L = Math.max(diffLon, diffLat);
  let dlt = L / count;
  if (diffLon > diffLat) {
    //base on lon
    let delLat = (endPosition[1] - startPosition[1]) / count;
    if (startPosition[0] - endPosition[0] > 0) {
      dlt = -dlt;
    }
    for (let i = 0; i < count; i++) {
      let h =
        height -
        (Math.pow(-0.5 * L + Math.abs(dlt) * i, 2) * 4 * height) /
          Math.pow(L, 2);
      let lon = startPosition[0] + dlt * i;
      let lat = startPosition[1] + delLat * i;
      let point = new Cesium.Cartesian3.fromDegrees(lon, lat, h);
      result.push(point);
    }
  } else {
    //base on lat
    let delLon = (endPosition[0] - startPosition[0]) / count;
    if (startPosition[1] - endPosition[1] > 0) {
      dlt = -dlt;
    }
    for (let i = 0; i < count; i++) {
      let h =
        height -
        (Math.pow(-0.5 * L + Math.abs(dlt) * i, 2) * 4 * height) /
          Math.pow(L, 2);
      let lon = startPosition[0] + delLon * i;
      let lat = startPosition[1] + dlt * i;
      let point = new Cesium.Cartesian3.fromDegrees(lon, lat, h);
      result.push(point);
    }
  }
  return result;
};
const parabolaFlowInit = (_viewer, _num) => {
  let _center = [113.9236839, 22.528061];
  let _positions = [
    [113.8236839, 22.528061],
    [114.0236839, 22.528061],
    [113.9236839, 22.428061],
    [113.9236839, 22.628061],
    [113.8236839, 22.428061],
    [114.0236839, 22.628061],
    [113.8236839, 22.628061],
    [114.0236839, 22.428061],
  ];
  _positions.forEach((item) => {
    let _siglePositions = parabola(_center, item, 5000);
    // 创建飞线
    for (let i = 0; i < _num; i++) {
      _viewer.entities.add({
        polyline: {
          positions: _siglePositions,
          material: new Cesium.LineFlow({
            color: new Cesium.Color(1.0, 1.0, 0.0, 0.8),
            speed: 15 * Math.random(),
            percent: 0.1,
            gradient: 0.01,
          }),
        },
      });
    }
    // 创建轨迹线
    _viewer.entities.add({
      polyline: {
        positions: _siglePositions,
        material: new Cesium.Color(1.0, 1.0, 0.0, 0.2),
      },
    });
  });
};
//创建 标牌
const poiIconLabelAdd = (viewer, lon, lat, name, color, url) => {
  viewer.entities.add({
    name: name,
    position: Cesium.Cartesian3.fromDegrees(lon, lat, 300),
    // 图标
    billboard: {
      image: url,
      width: 50,
      height: 50,
    },
    label: {
      //文字标签
      text: name,
      font: "20px sans-serif",
      style: Cesium.LabelStyle.FILL,
      // 对齐方式(水平和竖直)
      horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      pixelOffset: new Cesium.Cartesian2(20, -2),
      showBackground: true,
      backgroundColor: new Cesium.Color.fromBytes(0, 70, 24),
    },
  });

  // 先画线后画点，防止线压盖点
  let linePositions = [];
  linePositions.push(new Cesium.Cartesian3.fromDegrees(lon, lat, 5));
  linePositions.push(new Cesium.Cartesian3.fromDegrees(lon, lat, 300));
  viewer.entities.add({
    polyline: {
      positions: linePositions,
      width: 1.5,
      material: color,
    },
  });

  // 画点
  viewer.entities.add({
    // 给初始点位设置一定的离地高度，否者会被压盖
    position: Cesium.Cartesian3.fromDegrees(lon, lat, 5),
    point: {
      color: color,
      pixelSize: 15,
    },
  });
};

onMounted(() => {
  const viewer = new Viewer("cesiumContainer", {
    terrainProvider: createWorldTerrain(),
    animation: false,
    fullscreenButton: false,
    vrButton: false,
    geocoder: false,
    selectionIndicator: false,
    timeline: false,
    infoBox: false,
    baseLayerPicker: false,
    homeButton: false,
    scene3DOnly: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    orderIndependentTranslucency: false,
    // resolutionScale: 0.5,
    // useBrowserRecommendedResolution: true,
    contextOptions: {
      webgl: {
        alpha: true,
      },
    },
    fullscreenElement: document.body,
    useDefaultRenderLoop: true,
    targetFrameRate: undefined,
    showRenderLoopErrors: false,
    sceneMode: Cesium.SceneMode.SCENE3D,
  });

  viewer.bottomContainer.style.display = "none";

  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(116.3518, 39.784, 50000.0),
    // orientation: {
    //   // heading: Math.toRadians(20),
    //   // pitch: Math.toRadians(-20.0),
    // },
  });

  //创建 标牌
  poiIconLabelAdd(
    viewer,
    116.3518,
    39.784,
    "中山公园",
    new Cesium.Color.fromBytes(0, 70, 24),
    "@/assets/logo.png"
  );
  createRadar(viewer);
  // 创建立体雷达扫描
  trackMatter(viewer);
  // 创建飞线
  parabolaFlowInit(viewer, 3);
});
</script>

<style lang="sass" scoped>
#cesiumContainer{
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
