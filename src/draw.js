import _first from 'lodash/first';
import _floor from 'lodash/floor';
import _last from 'lodash/last';
import _round from 'lodash/round';
import _values from 'lodash/values';

import Two from 'two.js/src/two';

import {
  Color,
  CurveConfig,
  CurveType,
  Point,
  Spectrum,
  rgba,
} from './classes';
import {
  mapInRange,
  revToRad,
  getPositions,
  getAllPoints,
  CENTER
} from './utils';


const two = new Two({
  width: 800,
  height: 800,
});

/**
 * Factory function for CurveConfigs
 *
 * @param {object} opts -  Options to pass to the CurveConfig constructor
 * @param {string} curveType
 * @returns {CurveConfig}
 */
function getCurveConfig(opts, curveType = CurveType.Other) {
  return new CurveConfig(opts, curveType);
}

/**
 * Draw a line between two points
 *
 * @param {Point} start
 * @param {Point} end
 * @returns {Two.Polygon}
 */
function drawLine(start, end) {
  // TODO: extend Two.prototype with this
  const line = two.makeLine(start.x, start.y, end.x, end.y);
  // Two.Polygon's vertices don't stay in consistent order...
  line.startPoint = start;
  line.endPoint = end;

  return line;
}

/**
 * Draw a circle at a given point
 * @param {Point} center - The point for the center the circle
 * @param {number} radius - The radial width of the circle
 * @param {string} color - A color to fill the circle
 */
function plot(center, radius = 1, color = 'red') {
  const dot = two.makeCircle(center.x, center.y, radius);
  dot.stroke = color;
  dot.fill = color;
}

function doStitching(spines, opts) {
  // TODO: explain inputs
  var resolution = opts.resolution,
    layerCount = opts.layerCount,
    layerSepFactor = opts.layerSepFactor,
    spectrum = opts.spectrum.segmentColors(layerCount);

  spines.stroke = (opts.showSpines) ? spines.stroke : rgba(0, 0, 0, 0);

  var group = two.makeGroup();
  group.add(spines);
  var points = opts.points || getAllPoints(_values(spines.children),
      opts);

  // Layering constants
  var layerRatio = _floor(resolution / layerCount);

  for (var i = 0; i < layerCount; i++) {
    var layer;
    switch (opts.curveType) {
      case CurveType.Star:
        layer = stitchOutward(points, (i * layerSepFactor *
          layerRatio) % resolution * 3 / 4);
        break;
      case CurveType.Ellipse: // This might be independent at some point
      case CurveType.Other:
      case CurveType.Polygon:
        var separation = ((layerCount - i) * layerRatio *
          layerSepFactor) % points.length / 2;
        layer = stitchInward(points, resolution, separation);
        break;
    }
    layer.stroke = spectrum.nextColor().toRGBAString();
    group.add(layer);
  }

  // Move the group to the right place
  group.translation.set(opts.center.x, opts.center.y);
  group.rotation = revToRad(opts.startAngle);

  return group;
}

/**
 * TODO: Figure out why I wrote this
 *
 * @param {number} reps - The number of symmetrical figures to draw
 * @param {number} startAngle - The angle at which to draw the first figure
 * @param {number} radius - The distance from the center to each figure
 * @param {Function} drawFunction - One of the following functions: drawRectCurve|drawStarCurve|drawEllipseCurve
 * @param {CurveConfig} curveOptions - The configuration options for each figure
 * @returns {Two.Group}
 */
function drawMultipleCurves(reps, startAngle, radius, drawFunction, curveOptions) {
  const curves = mapInRange(reps, (i) => {
    const angle = (i / reps) + startAngle;
    const opts = Object.assign({}, curveOptions, {
      center: getPositions(angle, radius, curveOptions.center),
    });
    const curve = drawFunction(opts);
    two.render();
    curve.rotation += revToRad(angle);
    return curve;
  });
  return two.makeGroup(curves);
}

/**
 * Draw a curve for a rectangle
 * @param {CurveConfig} opts
 * @returns {*}
 */
function drawRectCurve(opts) {
  // TODO: explain
  opts = getCurveConfig(opts, CurveType.Polygon);
  const radius = {
    x: opts.width / 2,
    y: opts.height / 2
  };

  const vertCount = opts.numVertices;
  const vertices = [getPositions(0, radius, CENTER)];

  const spines = mapInRange(1, (i) => {
    const point = getPositions(i / vertCount, radius, CENTER);
    const spine = drawLine(vertices[i - 1], point);
    vertices.push(point);
    return spine;
  }, vertCount);

  spines.push(drawLine(vertices[vertices.length - 1], vertices[0]));

  return doStitching(two.makeGroup(spines), opts);
}

/**
 * Draw a curve for a star
 * @param {CurveConfig} opts
 * @returns {*}
 */
function drawStarCurve(opts) {
  // TODO: explain why this is different than rect
  opts = getCurveConfig(opts, CurveType.Star);
  const starPointNum = opts.numVertices;

  const radius = {
    x: opts.width / 2,
    y: opts.height / 2
  };

  // rotate through all the angles drawing a spine for each
  const spines = mapInRange(starPointNum, (i) => {
    const tipPoint = getPositions(i / starPointNum, radius, CENTER);

    return drawLine(CENTER, tipPoint);
  });

  return doStitching(two.makeGroup(spines), opts);
}

/**
 * Draw a curve for an ellipse
 * @param {CurveConfig} opts
 * @returns {*}
 */
function drawEllipseCurve(opts) {
  // TODO: Description
  opts = getCurveConfig(opts, CurveType.Ellipse);
  opts.inward = true;

  const radius = {
      x: opts.width / 2,
      y: opts.height / 2
    };

  const vertices = [getPositions(0, radius, CENTER)];
  const vertCount = opts.resolution * opts.numVertices;

  const spines = mapInRange(vertCount, (i) => {
    const point = getPositions(i / vertCount, radius, CENTER);
    const spine = drawLine(vertices[i - 1], point);
    vertices.push(point);
    return spine;
  });
  spines.push(drawLine(_last(vertices), _first(vertices)));

  opts.points = vertices;

  return doStitching(two.makeGroup(spines), opts);
}

/**
 * Given 2 equal-sized arrays of points, connect them (draw lines) in order.
 *
 * @private
 * @param {Point[]} spineA
 * @param {Point[]} spineB
 * @param {number} shave
 * @returns {Two.Group}
 */
function _connectDots(spineA, spineB, shave) {
  const maxIndex = spineA.length - shave - 1;
  if (spineA.length != spineB.length) {
    return two.makeGroup();
  }
  const lines = mapInRange(maxIndex, (i) => {
    const a = spineA[maxIndex - i];
    const b = spineB[i];
    const line = drawLine(a, b);
    return line;
  });
  return two.makeGroup(lines);
}

/**
 * "Stitch" a curve between the given arrays of points,
 * not using the `shave` number of points at the end (used for layering)
 *
 * @param {Point[][]} spines
 * @param {number} shave
 * @returns {Two.Group}
 */
function stitchOutward(spines, shave) {
  const spines = spines.map((spineA, i) => {
    const spineB = spines[(i + 1) % spines.length];
    return _connectDots(spineA, spineB, _round(shave));
  });

  return two.makeGroup(spines);
}

/**
 * Draw a line from each Point in `points` to the one `separation` ahead of it.
 *
 * @private
 * @param {Point[]} points
 * @param {number} separation
 * @returns {Two.Group}
 */
function _followCurve(points, separation) {
  const len = points.length;
  const lines = points.map((pointB, i) => {
    const pointA = points[(len - separation + i) % len];
    const line = drawLine(pointA, pointB);
    return line;
  });
  return two.makeGroup(lines);
}

/**
 * "Stitch" a continuous curve between the list of lines given,
 * with `resolution` points per line, and a given number of points of `separation`
 *
 * @param {Point[]} points
 * @param {number} resolution
 * @param {number} separation
 * @returns {Two.Group}
 */
function stitchInward(points, resolution, separation = 0) {
  const followDistance = _round(resolution + separation + 1);
  return _followCurve(points, followDistance);

}


function test() {
  var w = two.width,
    h = two.height;
  var spect = new Spectrum(new Color(0, 255, 127, 1.0),
    new Color(0, 127, 255, .5));
  // drawRectCurve({
  //   resolution: 64,
  //   layerCount: 2,
  //   layerSepFactor: 1,
  //   width: w,
  //   height: h,
  //   startAngle: 1/4,
  //   spectrum: spect
  // });

  var options = {
    resolution: 32,
    numVertices: 6,
    layerCount: 4,
    layerSepFactor: 1,
    width: w / 2,
    height: h / 2,
    startAngle: 1 / 12,
    spectrum: new Spectrum(new Color(0, 0, 255, 1.0),
      new Color(0, 255, 0, .75)),
    center: getCurveConfig().center
  };

  // drawRectCurve(options);
  // drawStarCurve(Object.assign({}, options, {
  //   width: w,
  //   height: h,
  //   resolution: 64,
  //   spectrum: options.spectrum.clone().reverse()
  // }));
  drawMultipleCurves(6, 1 / 4, h / 4, drawStarCurve, options);
  // drawStarCurve({
  //   numVertices: 8,
  //   resolution: 32,
  //   width: 600,
  //   startAngle: 1/4,
  //   spectrum: new Spectrum(new Color(255, 127, 0, .75))
  // });

  // drawEllipseCurve({
  //   resolution: 32,
  //   numVertices: 4,
  //   layerCount: 8,
  //   layerSepFactor: 1.5,
  //   spectrum: new Spectrum(new Color(255, 191, 0, 1),
  //                          new Color(255, 31, 0, .5))
  // });

  // var ellOpts = {
  //   resolution: 32,
  //   numVertices: 4,
  //   layerCount: 4,
  //   layerSepFactor: 2,
  //   width: two.width*8/16,
  //   height: two.width*8/16,
  //   spectrum: new Spectrum(new Color(255, 191, 0, 1),
  //                          new Color(255, 31, 0, .5)
  //   ),
  //   center: getCurveConfig().center
  // };
  // const curveReps = 4;
  // const startAngle = 1/8;
  // const rad = ellOpts.height / 2;
  // drawMultipleCurves(8, 1/8, ellOpts.height/2, drawEllipseCurve, ellOpts);
}

two.appendTo(document.getElementById('stitch-canvas'));
test();
two.render();

(function () {
  var saveLink = document.getElementById("save-me"),
    svg = document.getElementsByTagName("svg")[0];
  saveLink.href = "data:text/plain;charset=utf-8," + svg.outerHTML;
  saveLink.download = "curve.svg";
})();
