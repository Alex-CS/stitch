(function(_, Two) {
    // Math shortcuts
    var round = Math.round,
        floor = Math.floor,
        sqrt = Math.sqrt,
        pi = Math.PI;

    // Calculated constants
    var root2 = sqrt(2),
        root3 = sqrt(3);

    var elem = document.getElementById('stitch-canvas'),
        two = new Two({
            width: 800,
            height: 800
        }).appendTo(elem),
        CurveType = {
            Polygon: "Polygon",
            Star: "Star",
            Ellipse: "Ellipse",
            Other: "Other"
        },
        CENTER = new Point(0, 0);
    window.stitchCanvas = two.makeGroup();

    function curveConfig(opts, curveType) {
        return _.defaults(opts || {}, {
            numVertices: 4,
            resolution: 2,
            layerCount: 1,
            layerSepFactor: 1,
            width: two.width,
            height: two.height,
            center: new Point(two.width / 2, two.height / 2),
            startAngle: 0,
            curveType: curveType || CurveType.Other,
            showSpines: false,
            spectrum: new Spectrum(new Color(0, 0, 0, 1))
        });
    }

    function debugLog(message) {
        (window.DEBUG) && console.log(message) && two.render();
    }

    function test() {
        var w = two.width,
            h = two.height;
        var spect = new Spectrum(new Color(0, 255, 127, 1.0),
            new Color(0, 127, 255, .5));
        //drawRectCurve({
        //    resolution: 64,
        //    layerCount: 2,
        //    layerSepFactor: 1,
        //    width: w,
        //    height: h,
        //    startAngle: 1/4,
        //    spectrum: spect
        //});

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
            center: curveConfig().center
        };

        //drawRectCurve(options);
        //drawStarCurve(_.defaults({width: w, height: h, resolution: 64, spectrum: options.spectrum.clone().flip()}, options));
        drawMultipleCurves(6, 1 / 4, h / 4, drawStarCurve, options);
        //drawStarCurve({
        //    numVertices: 8,
        //    resolution: 32,
        //    width: 600,
        //    startAngle: 1/4,
        //    spectrum: new Spectrum(new Color(255, 127, 0, .75))
        //});

        //drawEllipseCurve({
        //    resolution: 32,
        //    numVertices: 4,
        //    layerCount: 8,
        //    layerSepFactor: 1.5,
        //    spectrum: new Spectrum(new Color(255, 191, 0, 1),
        //                           new Color(255, 31, 0, .5))
        //});

        //var ellOpts = {
        //    resolution: 32,
        //    numVertices: 4,
        //    layerCount: 4,
        //    layerSepFactor: 2,
        //    width: two.width*8/16,
        //    height: two.width*8/16,
        //    spectrum: new Spectrum(new Color(255, 191, 0, 1),
        //                           new Color(255, 31, 0, .5)
        //    ),
        //    center: curveConfig().center
        //};
        //var curveReps = 4,
        //    startAngle = 1/8,
        //    rad = ellOpts.height / 2;
        //drawMultipleCurves(8, 1/8, ellOpts.height/2, drawEllipseCurve, ellOpts);


    }

    function Point(x, y) {
        this.x = round(x) || 0;
        this.y = round(y) || 0;
        this.equals = function(p2) {
            return p2.x === this.x && p2.y === this.y;
        };
        this.toString = function() {
            return "(" + this.x + "," + this.y + ")"
        };
    }

    window.drawMultipleCurves = function(reps, startAngle, radius,
        drawFunction, curveOptions) {
        var curves = two.makeGroup();
        for (var i = 0; i < reps; i++) {
            var angle = i / reps + startAngle;
            var opts = _.defaults({
                center: getPositions(angle, radius,
                    curveOptions.center),
                spectrum: curveOptions.spectrum.clone()
            }, curveOptions);
            var curvI = drawFunction(opts);
            two.render();
            curvI.rotation += revToRad(angle);
            curves.add(curvI);
        }
        return curves;
    };

    window.drawRectCurve = function(opts) {
        // TODO: explain
        opts = curveConfig(opts, CurveType.Polygon);
        var radius = {
                x: opts.width / 2,
                y: opts.height / 2
            },
            center = CENTER;

        var vertCount = opts.numVertices,
            vertices = [getPositions(0, radius, center)],
            spines = two.makeGroup();

        for (var i = 1; i < vertCount; i++) {
            var point = getPositions(i / vertCount, radius, center);
            var spine = drawLine(vertices[i - 1], point);
            vertices.push(point);
            spines.add(spine);
        }

        spines.add(drawLine(vertices[vertices.length - 1], vertices[0]));

        return doStitching(spines, opts);
    };

    window.drawStarCurve = function(opts) {
        // TODO: explain why this is different than rect
        opts = curveConfig(opts, CurveType.Star);
        var starPointNum = opts.numVertices;

        var radius = {
                x: opts.width / 2,
                y: opts.height / 2
            },
            center = CENTER;

        var spines = two.makeGroup();
        // rotate through all the angles drawing a spine for each
        for (var i = 0; i < starPointNum; i++) {
            var tipPoint = getPositions(i / starPointNum,
                radius, center);

            var line = drawLine(center, tipPoint);

            spines.add(line);
        }

        return doStitching(spines, opts);
    };

    window.drawEllipseCurve = function(opts) {
        // TODO: Description
        opts = curveConfig(opts, CurveType.Ellipse);
        opts.inward = true;

        var radius = {
                x: opts.width / 2,
                y: opts.height / 2
            },
            center = CENTER;

        var vertices = [getPositions(0, radius, center)],
            spines = two.makeGroup();
        var vertCount = opts.resolution * opts.numVertices;

        for (var i = 1; i < vertCount; i++) {
            var point = getPositions(i / vertCount, radius, center);
            var spine = drawLine(vertices[i - 1], point);
            vertices.push(point);
            spines.add(spine);
        }
        opts.points = vertices;
        spines.add(drawLine(_.last(vertices), _.first(vertices)));

        return doStitching(spines, opts);
    };

    function doStitching(spines, opts) {
        // TODO: explain inputs
        var resolution = opts.resolution,
            layerCount = opts.layerCount,
            layerSepFactor = opts.layerSepFactor,
            spectrum = opts.spectrum.segmentColors(layerCount);

        spines.stroke = (opts.showSpines) ? spines.stroke : rgba(0, 0, 0, 0);

        var group = two.makeGroup();
        group.add(spines);
        var points = opts.points || getAllPoints(_.values(spines.children),
            opts);

        // Layering constants
        var layerRatio = floor(resolution / layerCount);

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
            layer.stroke = spectrum.nextColor().rgbaStr();
            group.add(layer);
        }

        // Move the group to the right place
        group.translation.set(opts.center.x, opts.center.y);
        group.rotation = revToRad(opts.startAngle);

        return group;
    }

    function revToRad(rev) {
        // Converts a number of revolutions (1 rev = 2pi radians)
        return 2 * pi * rev;
    }

    var getPositions = function(angle, radius, center) {
        // Get x,y coordinates for a point `radius`
        // from `center` at the given `angle`.
        radius = (typeof radius == "number") ? {
            x: radius,
            y: radius
        } : radius;
        center = center || CENTER;
        return new Point(
            Math.cos(revToRad(angle)) * radius.x + center.x,
            Math.sin(revToRad(angle)) * radius.y + center.y
        );
    };

    var rotateAbout = function(cen, poly, angle, radius) {
        // Rotates a Two.Polygon about a point, "orbiting" that point.
        // TODO: extend Two.Polygon with this
        // Derived from this example: http://code.tutsplus.com/tutorials/drawing-with-twojs--net-32024
        debugLog("OLD: angle=" + (poly.rotation / pi) + ", trans=" +
            poly.translation);
        poly.rotation = (poly.rotation + angle) % (2 * pi);
        var pos = getPositions(poly.rotation, radius, cen);
        poly.translation.x = cen.x + pos.x / 2;
        poly.translation.y = cen.y + pos.y / 2;
        debugLog("NEW: angle=" + (poly.rotation / pi) + ", trans=" +
            poly.translation + "\n");
    };

    function Color(red, green, blue, alpha) {
        this.red = red || 0;
        this.grn = green || 0;
        this.blu = blue || 0;
        this.alf = alpha || 1.0;
        this.attrList = [this.red, this.grn, this.blu, this.alf];

        this.rgbaStr = function() {
            return rgba(this.red, this.grn, this.blu, this.alf)
        };

        this.clone = function() {
            return new Color(this.red, this.grn, this.blu, this.alf);
        };

        this.toString = function() {
            return "Color (" + this.red + "," + this.grn + "," + this.blu +
                "," + this.alf + ")";
        };

        this.scaleDown = function(factor) {
            this.red = round(this.red / factor);
            this.grn = round(this.grn / factor);
            this.blu = round(this.blu / factor);
            this.alf /= factor;
            return this;
        };

        this.distanceTo = function(otherColor) {
            var rDist = otherColor.red - this.red,
                gDist = otherColor.grn - this.grn,
                bDist = otherColor.blu - this.blu,
                aDist = otherColor.alf - this.alf;
            return new Color(rDist, gDist, bDist, aDist);
        };

        this.stepsToward = function(otherColor, resolution) {
            var colors = [this],
                colorStep = this.distanceTo(otherColor).scaleDown(
                    resolution);

            // Handle all the colors between the start and end
            for (var i = 1; i < resolution; i++) {
                var r = this.red + (colorStep.red * i),
                    g = this.grn + (colorStep.grn * i),
                    b = this.blu + (colorStep.blu * i),
                    a = this.alf + (colorStep.alf * i);
                var nextColor = new Color(r, g, b, a);
                colors.push(nextColor);
            }
            colors.push(otherColor);
            return colors;
        };
    }

    function Spectrum() {
        // TODO: test plotting through more than 2 initial colors

        this._colors = _.toArray(arguments) || [];
        this._nextIndex = 0;
        this.clone = function() {
            var clone = new Spectrum();
            clone._colors = this._colors.map(function(color) {
                return color.clone();
            });
            clone._nextIndex = 0;
            return clone;
        };

        this.firstColor = function() {
            return _.first(this._colors);
        };
        this.lastColor = function() {
            return _.last(this._colors);
        };
        this.nextColor = function() {
            // Returns the next color in the sequence
            // Will repeat through colors if _nextIndex is greater
            // than the number of colors.
            var next = this._colors[this._nextIndex % this._colors.length];
            this._nextIndex++;
            return next;
        };

        this.segmentColors = function(resolution) {
            // Add `resolution` colors between existing colors in the spectrum
            if (this._colors.length < 2) {
                // There's no need to segment a single color
                return this;
            }
            var newColors = [],
                start = this.firstColor(),
                end = this.lastColor();
            newColors = newColors.concat(start.stepsToward(end,
                resolution));

            this._colors = newColors;
            return this;
        };

        this.flip = function() {
            // Reverse the spectrum
            this._colors.reverse();
            this._nextIndex = 0;
            return this;
        }
    }

    function rgba(r, g, b, a) {
        return "rgba(" + r + "," + g + "," + b + "," + a + ")"
    }

    function pointStr(vector) {
        // TODO: extend Two.Vector with this
        return "(" + vector.x + "," + vector.y + ")";
    }

    function drawLine(v1, v2) {
        // wrapper function to make a line between a pair
        // of Two.Vector points (or anything else with x, y properties)
        // TODO: extend Two.prototype with this
        var line = two.makeLine(v1.x, v1.y, v2.x, v2.y);
        // Two.Polygon's vertices don't stay in consistent order...
        line.startPoint = v1;
        line.endPoint = v2;
        debugLog(v1 + "~>" + v2);

        return line;
    }

    function decenter(point, trans) {
        // Take a Two.Vector positioned relative to center,
        // and change it to be relative to top-left corner
        // TODO: extend Two.Vector with this
        return point.clone().set(trans.x - point.x, trans.y + point.y);
    }

    function plot(point, radius, color) {
        var dot = two.makeCircle(point.x, point.y, radius || 1);
        dot.stroke = color || "red";
        dot.fill = color || "red";
    }

    function getPoints(line, resolution, excluded) {
        // Returns an array of `resolution` points
        // evenly spaced along `line`, excluding points in `excluded`.
        // TODO: test with Polygons
        // TODO: extend Two.Polygon with this
        var points = [];

        var vertexA = line.startPoint,
            vertexB = line.endPoint,
            rangeX = vertexB.x - vertexA.x,
            rangeY = vertexB.y - vertexA.y,
            stepX = rangeX / resolution,
            stepY = rangeY / resolution;

        for (var stepNum = 0; stepNum <= resolution; stepNum++) {
            var curX = vertexA.x + stepNum * stepX,
                curY = vertexA.y + stepNum * stepY,
                curPoint = new Point(curX, curY);
            //plot(curPoint);
            points.push(curPoint);
        }

        // Remove excluded points
        points = points.filter(function(point) {
            return !_.any(excluded, function(exPoint) {
                return exPoint.equals(point);
            });
        });

        return points;
    }

    function getAllPoints(spines, opts) {
        var points = [];

        for (var i = 0; i < spines.length; i++) {
            var excluded,
                newPoints;
            if (opts.curveType == CurveType.Star) {
                excluded = [CENTER];
                newPoints = getPoints(spines[i], opts.resolution, excluded);
                points.push(newPoints);
            } else {
                excluded = (points.length > 1) ? [_.first(points), _.last(
                    points)] : [];
                newPoints = getPoints(spines[i], opts.resolution, excluded);
                points = points.concat(newPoints);
            }
        }

        return points;
    }

    function _connectDots(spineA, spineB, shave) {
        // Given 2 equal-sized arrays of points,
        // connect them (draw lines) in order.
        var group = two.makeGroup(),
            maxIndex = spineA.length - shave - 1;
        if (spineA.length != spineB.length) {
            debugLog("ERROR: mismatched spine resolutions!");
            return group;
        }
        for (var i = 0; i <= maxIndex; i++) {
            var a = spineA[maxIndex - i],
                b = spineB[i],
                line = drawLine(a, b);
            line.addTo(group);
        }
        return group;
    }

    function stitchOutward(spinePoints, shave) {
        // "Stitch" a curve between the given arrays of points,
        // not using the `shave` number of points at the end (used for layering)
        var group = two.makeGroup();
        for (var i = 0; i < spinePoints.length; i++) {
            var spineA = spinePoints[i],
                spineB = spinePoints[(i + 1) % spinePoints.length];
            group.add(_connectDots(spineA, spineB, round(shave)));
        }

        return group;
    }

    function _followCurve(points, separation) {
        // Takes an array of points and draws a line from
        // each point to the one `separation` ahead of it.
        var group = two.makeGroup(),
            len = points.length;
        for (var i = 0; i < len; i++) {
            var pointA = points[(len - separation + i) % len],
                pointB = points[i],
                line = drawLine(pointA, pointB);
            line.addTo(group);
        }
        return group;
    }

    function stitchInward(points, resolution, separation) {
        // "Stitch" a continuous curve between the list of lines given,
        // with `resolution` points per line, and a given number of
        // points of `separation`

        separation = round(separation || 0);
        return _followCurve(points, resolution + separation + 1);

    }

    test();
    two.render();
})(_, Two);

(function() {
    var saveLink = document.getElementById("save-me"),
        svg = document.getElementsByTagName("svg")[0];
    saveLink.href = "data:text/plain;charset=utf-8," + svg.outerHTML;
    saveLink.download = "curve.svg";
})();
