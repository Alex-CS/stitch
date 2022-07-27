

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
  // TODO: Need to test this with other external ways of resizing the SVG, and other internal ways of defining the coordinate system
  //      It's only been tested using viewBox internally and getting styled to be 100% width externally
  //      Also, if aspect ratio is preserved, the scale _maaaay_ always be the same in both dimensions

  const renderedWidth = svgEl.width.baseVal.value;
  const coordinateWidth = svgEl.viewBox.baseVal.width;

  const renderedHeight = svgEl.height.baseVal.value;
  const coordinateHeight = svgEl.viewBox.baseVal.height;

  const x = coordinateWidth / renderedWidth;
  const y = coordinateHeight / renderedHeight;

  return { x, y };
}