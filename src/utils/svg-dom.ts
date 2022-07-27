

/**
 * Given an <svg>, determine what scale it's currently rendered at
 * (relative to its base coordinates, and in both dimensions)
 *
 * SVGs [S]cale cleanly because their internal coordinate system is independent of their rendered size.
 * Knowing the ratio between DOM coordinates and internal coordinates allows us to convert back and forth
 *
 * More info: https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement
 *
 * Note: This was originally a method of DragDraw.vue.
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
