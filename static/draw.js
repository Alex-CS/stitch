/**
 * Created by alex on 4/7/15.
 */

(function(){
    var elem = document.getElementById('canvas'),
        two = new Two({
            width: 800,
            height: 800
        }).appendTo(elem);
    window.stitchCanvas = two.makeGroup();

    // Math Constants
    var round = Math.round,
        floor = Math.floor,
        sqrt = Math.sqrt,
        pi = Math.PI;

    function curveConfig(opts) {
        return _.defaults(opts || {}, {
            numVertices: 4,
            resolution: 2,
            layerCount: 1,
            layerSepFactor: 1,
            width: two.width,
            height: two.height,
            center: p(two.width/2, two.height/2),
            startAngle: 0,
            inward: true,
            showSpines: false,
            spectrum: new Spectrum(new Color(0, 0, 0, 1))
        });
    }

    function debugLog(message){
        (window.DEBUG) && console.log(message) && two.render();
    }

    function test(){
        var w = two.width,
            h = two.height;
        var spect = new Spectrum(new Color(0, 255, 127, 1.0),
                                 new Color(0, 127, 255, .5));
        drawRectCurve({
            resolution: 64,
            layerCount: 2,
            layerSepFactor: 1,
            width: w*sqrt(2),
            height: h*sqrt(2),
            startAngle: 1/8,
            spectrum: spect
        });

        var options = {
            resolution: 32,
            numVertices: 4,
            layerCount: 2,
            width: w/2,
            height: h/2,
            startAngle: 1/8,
            spectrum: new Spectrum(new Color(13, 255, 255, 1.0),
                                   new Color(52, 255, 13, .5)),
            center: curveConfig().center
        };

        //drawStarCurve(options);
        drawMultipleCurves(4, 1/8, h/4, drawRectCurve, options);

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

    function p(x, y){
        return {
            x: x,
            y: y,
            equals: function(p2) {
                return p2.x === x && p2.y === y;
            },
            toString: function() {
                return "("+x+","+y+")"
            }
        }
    }

    window.drawMultipleCurves = function(reps, startAngle, radius, drawFunction, curveOptions){
        var curves = two.makeGroup();
        for(var i=0; i<reps; i++){
            var angle = i/reps + startAngle;
            var opts = _.defaults({
                center: getPositions(angle, radius,
                                     curveOptions.center),
                spectrum: curveOptions.spectrum
            }, curveOptions);
            var curvI = drawFunction(opts);
            two.render();
            //rotateAbout(curveOptions.center, curvI, angle, radius);
            curves.add(curvI);
        }
        return curves;
    };

    window.drawRectCurve = function(opts) {
        // TODO: explain
        opts = curveConfig(opts);
        opts.inward = true;
        var radius = {
                x: opts.width/2,
                y: opts.height/2
            };

        var vertCount = opts.numVertices,
            vertices = [getPositions(opts.startAngle, radius, opts.center)],
            spines = [];

        for(var i=1; i<vertCount; i++){
            var point = getPositions(i/vertCount +  opts.startAngle,
                                     radius, opts.center);
            var spine = drawLine(vertices[i-1], point);
            vertices.push(point);
            spines.push(spine);
        }

        spines.push(drawLine(vertices[vertices.length-1], vertices[0]));

        return doStitching(spines, opts);
    };

    window.drawStarCurve = function(opts){
        // TODO: explain why this is different than rect
        opts = curveConfig(opts);
        opts.inward = false;
        var starPointNum = opts.numVertices;

        var radius = {
            x: opts.width / 2,
            y: opts.height / 2
        };

        var spines = [];
        // rotate through all the angles drawing a spine for each
        for(var i=0;i<starPointNum;i++){
            var tipPoint = getPositions(i/starPointNum + opts.startAngle,
                                        radius, opts.center);

            // Have to alternate to get pretty curves
            var p1 = (i % 2 == 0) ? opts.center : tipPoint,
                p2 = (i % 2 == 0) ? tipPoint : opts.center;

            var line = drawLine(p1, p2);

            spines.push(line);
        }

        return doStitching(spines, opts);
    };

    window.drawEllipseCurve = function (opts) {
        // TODO: Description
        opts = curveConfig(opts);
        opts.inward = true;

        var radius = {
            x: opts.width / 2,
            y: opts.height / 2
        };

        var vertices = [getPositions(opts.startAngle, radius, opts.center)],
            spines = [];
        var vertCount = opts.resolution * opts.numVertices;

        for(var i=1; i<vertCount; i++){
            var point = getPositions(i/vertCount +  opts.startAngle,
                                     radius, opts.center);
            var spine = drawLine(vertices[i-1], point);
            vertices.push(point);
            spines.push(spine);
        }
        opts.points = vertices;
        spines.push(drawLine(vertices[vertices.length-1], vertices[0]));

        return doStitching(spines, opts);
    };

    function doStitching(spines, opts){
        // TODO: explain inputs
        var resolution = opts.resolution,
            layerCount = opts.layerCount,
            layerSepFactor = opts.layerSepFactor,
            spectrum = opts.spectrum.segmentColors(layerCount);

        spines.forEach(function(spine){
            spine.stroke = (opts.showSpines) ? spine.stroke : rgba(0,0,0,0);
        });

        var group = two.makeGroup();
        group.add(spines);
        var points = opts.points || getAllPoints(spines, opts);

        for (var i = 0; i < layerCount; i++) {
            var layer = stitchContinuous(
                points,
                resolution,
                ((layerCount - i) * floor(resolution/layerCount) * layerSepFactor) % points.length/2,
                opts.inward
            );
            layer.stroke = spectrum.nextColor().rgbaStr();
            group.add(layer);
        }

        stitchCanvas.add(group);
        return group;
    }

    function revToRad(rev){
        // Converts a number of revolutions (1 rev = 2pi radians)
        return 2 * pi * rev;
    }

    var getPositions = function(angle, radius, center) {
        // Get x,y coordinates for a point `radius`
        // from `center` at the given `angle`.
        radius = (typeof radius == "number") ? {x:radius,y:radius} : radius;
        return p(
            Math.cos(revToRad(angle)) * radius.x + (center.x || 0),
            Math.sin(revToRad(angle)) * radius.y + (center.y || 0)
        );
    };

    var rotateAbout = function(cen, poly, angle, radius){
        // Rotates a Two.Polygon about a point, "orbiting" that point.
        // TODO: extend Two.Polygon with this
        // Derived from this example: http://code.tutsplus.com/tutorials/drawing-with-twojs--net-32024
        debugLog("OLD: angle=" + (poly.rotation/pi) + ", trans=" + poly.translation);
        poly.rotation = (poly.rotation + angle) % (2*pi);
        var pos = getPositions(poly.rotation, radius, cen);
        poly.translation.x = cen.x + pos.x/2;
        poly.translation.y = cen.y + pos.y/2;
        debugLog("NEW: angle=" + (poly.rotation/pi) + ", trans=" + poly.translation + "\n");
    };

    function Color(red, green, blue, alpha){
        this.red = red || 0;
        this.grn = green || 0;
        this.blu = blue || 0;
        this.alf = alpha || 1.0;
        this.attrList = [this.red, this.grn, this.blu, this.alf];
        this.rgbaStr = function(){
            return rgba(this.red, this.grn, this.blu, this.alf)
        };

        this.toString = function(){
            return "Color (" + this.red + ","
                             + this.grn + ","
                             + this.blu + ","
                             + this.alf + ")";
        };

        this.scaleDown = function(factor){
            this.red = round(this.red/factor);
            this.grn = round(this.grn/factor);
            this.blu = round(this.blu/factor);
            this.alf /= factor;
            return this;
        };

        this.distanceTo = function(otherColor){
            var rDist = otherColor.red - this.red,
                gDist = otherColor.grn - this.grn,
                bDist = otherColor.blu - this.blu,
                aDist = otherColor.alf - this.alf;
            return new Color(rDist, gDist, bDist, aDist);
        };

        this.stepsToward = function(otherColor, resolution){
            var colors = [this],
                colorStep = this.distanceTo(otherColor).scaleDown(resolution);

            // Handle all the colors between the start and end
            for (var i=1; i+1<resolution; i++){
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

    function Spectrum(){
        // TODO: test plotting through more than 2 initial colors

        this._colors = arguments || [];
        this._nextIndex = 0;
        this.clone = function(){
            var clone = new Spectrum(this._colors);
            clone._colors = this._colors;
            return clone;
        };

        this.firstColor = function(){
            return this._colors[0];
        };
        this.lastColor = function(){
            return this._colors[this._colors.length-1];
        };
        this.nextColor = function(){
            // Returns the next color in the sequence
            // Will repeat through colors if _nextIndex is greater
            // than the number of colors.
            var next = this._colors[this._nextIndex % this._colors.length];
            this._nextIndex++;
            return next;
        };

        this.segmentColors = function(resolution){
            // Add `resolution` colors between existing colors in the spectrum
            if (this._colors.length < 2){
                // There's no need to segment a single color
                return this;
            }
            var newColors = [];
            for (var i=0; i+1<this._colors.length; i++){
                var startingColor = this._colors[i],
                    endingColor = this._colors[i+1];
                newColors = newColors.concat(startingColor.stepsToward(endingColor, resolution));
            }

            this._colors = newColors;
            return this;
        };
    }

    function rgba(r, g, b, a){
        return "rgba("+ r + "," + g + "," + b + "," + a + ")"
    }

    function pointStr(vector){
        // TODO: extend Two.Vector with this
        return "("+vector.x+","+vector.y+")";
    }

   function drawLine(v1, v2){
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

    function decenter(point, trans){
        // Take a Two.Vector positioned relative to center,
        // and change it to be relative to top-left corner
        // TODO: extend Two.Vector with this
        return point.clone().set(trans.x - point.x, trans.y + point.y);
    }

    function plot(point, radius, color){
        var dot = two.makeCircle(point.x, point.y, radius || 1);
        dot.stroke = color || "red";
        dot.fill = color || "red";
    }

    function getPoints(line, resolution){
        // Returns an array of `resolution` points
        // evenly spaced along `line`.
        // TODO: test with Polygons
        // TODO: extend Two.Polygon with this
        var points = [];

        var vertexA = line.startPoint,
            vertexB = line.endPoint,
            rangeX = vertexB.x - vertexA.x,
            rangeY = vertexB.y - vertexA.y,
            stepX = rangeX / resolution,
            stepY = rangeY / resolution;

        for(var stepNum=0; stepNum <= resolution; stepNum++){
            var curX = vertexA.x + stepNum * stepX,
                curY = vertexA.y + stepNum * stepY,
                curPoint = p(curX, curY);
            //plot(curPoint);
            points.push(curPoint);
        }

        return points;
    }

    function getAllPoints(spines, opts){
        var points = [];
        for(var i = 0; i<spines.length; i++){
            var newPoints = getPoints(spines[i], opts.resolution);
            if (points.length && points[points.length-1].equals(newPoints[0])){
                newPoints.shift();
            }
            points = points.concat(newPoints);
        }

        // If the shape is closed
        if(points[0].equals(points[points.length-1])){
            points.pop();
        }

        // If the shape is a star, remove the center
        if(!opts.inward){
            return points.filter(function(point){
                return !point.equals(opts.center);
            });
        }

        return points;
    }

    function _connectDots(arr1, arr2) {
        // Given 2 equal-sized arrays of points,
        // connect them (draw lines) in order.
        var group = new Two.Group(),
            len = arr1.length;
        if (arr1.length != arr2.length) {
            return group;
        }
        for(var i=0; i<len; i++){
            var line = drawLine(arr1[i], arr2[i]);
            line.addTo(group);
        }
        return group;
    }

    function stitch(line1, line2, resolution){
        // "Stitch" a curve between the two lines given,
        // with `resolution` lines in the curve.
        var line1Points = getPoints(line1, resolution),
            line2Points = getPoints(line2, resolution),
            stitches = _connectDots(line1Points, line2Points);

        return stitches;
    }

    function _followCurve(points, separation){
        // Takes an array of points and draws a line from
        // each point to the one `separation` ahead of it.
        var group = new Two.Group(),
            len = points.length;
        for(var i=0; i<len; i++){
            var pointA = points[(len - separation + i) % len],
                pointB = points[i];
            drawLine(pointA, pointB).addTo(group);
        }
        return group;
    }

    function stitchContinuous(points, resolution, separation, inward){
        // "Stitch" a continuous curve between the list of lines given,
        // with `resolution` points per line, and a given number of
        // points of `separation`

        separation = round(separation || 0);
        var buffer = (inward) ? 1 : 0;
        return _followCurve(points, resolution + separation + buffer);

    }

    test();
    two.render();
})();

(function(){
    var saveLink = document.getElementById("save-me"),
        svg = document.getElementsByTagName("svg")[0];
    saveLink.href = "data:text/plain;charset=utf-8," + svg.outerHTML;
    saveLink.download = "curve.svg";
})();