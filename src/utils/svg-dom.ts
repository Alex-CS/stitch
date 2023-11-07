import {
  type PointLike,
} from '@/classes';


/**
 * Given an <svg>, determine what scale it's currently rendered at
 * (relative to its base coordinates, and in both dimensions)
 *
 * SVGs [S]cale cleanly because their internal coordinate system is independent of their rendered size.
 * Knowing the ratio between DOM coordinates and internal coordinates allows us to convert back and forth
 *
 * More info: https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement
 *
 * Note: This was originally a method of StitchDragDrawSVG.vue.
 *       Check the history of that file for previous iterations
 */
export function getRenderedScaleOfSVG(svgEl: SVGSVGElement): { x: number, y: number } {
  // If there's no viewBox, the scale doesn't differ
  if (!svgEl.hasAttribute('viewBox')) {
    return { x: 1, y: 1 };
  }

  const {
    clientWidth: renderedWidth,
    clientHeight: renderedHeight,
    viewBox,
  } = svgEl;

  const {
    width: coordinateWidth,
    height: coordinateHeight,
  } = viewBox.baseVal;

  const x = coordinateWidth / renderedWidth;
  const y = coordinateHeight / renderedHeight;

  return { x, y };
}

/**
 * Get the (SVG) coordinates of an <svg> element's top-left point.
 * All child element coordinates are relative to this, so it's essentially an "offset" for them
 *
 * More info: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/viewBox
 */
export function getCoordinateOffset(svgEl: SVGSVGElement): { x: number, y: number } {
  const { x, y } = svgEl.viewBox.baseVal;

  return { x, y };
}

/**
 * Convert the coordinates from a `MouseEvent` into SVG coordinates
 */
export function convertEventCoordsToSVGCoords(
  event: MouseEvent,
  svgEl: SVGSVGElement,
): PointLike {
  const {
    // DOM Coordinates of the mouse relative to the top-left corner of the <svg>
    offsetX: mouseX,
    offsetY: mouseY,
  } = event;

  // The scale at which the SVG is currently rendered relative to its native dimensions
  const scaleBy = getRenderedScaleOfSVG(svgEl);
  const minCoords = getCoordinateOffset(svgEl);

  return {
    x: (mouseX * scaleBy.x) + minCoords.x,
    y: (mouseY * scaleBy.y) + minCoords.y,
  };
}

/**
 * Convert scaled SVG coordinates into pixel coordinates relative to the top-left corner of the <svg>
 */
export function convertSVGCoordsToHTML(
  coordinates: PointLike,
  svgEl: SVGSVGElement,
): PointLike {
  const {
    x: svgX,
    y: svgY,
  } = coordinates;

  // The scale at which the SVG is currently rendered relative to its native dimensions
  const scaleBy = getRenderedScaleOfSVG(svgEl);
  const minCoords = getCoordinateOffset(svgEl);

  return {
    x: (svgX - minCoords.x) / scaleBy.x,
    y: (svgY - minCoords.y) / scaleBy.y,
  };
}
