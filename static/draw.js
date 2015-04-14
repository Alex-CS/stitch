/**
 * Created by alex on 4/7/15.
 */

(function(){
    var elem = document.getElementById('canvas'),
        two = new Two({
            width: 800,
            height: 800
        }).appendTo(elem);
    window.curve = two.makeGroup();

    // Constants
    var pi = Math.PI,
        round = Math.round,
        floor = Math.floor;

    function curveConfig(opts) {
        return _.defaults(opts || {}, {
            resolution: 2,
            layerCount: 1,
            layerSepFactor: 1,
            width: two.width,
            height: two.height,
            center: {
                x: two.width/2,
                y: two.height/2
            },
            startAngle: 0,
            leaveOpen: false
        });
    }

    function test(){
        drawRectCurve({
            resolution: 64,
            layerCount: 2,
            layerSepFactor: 1,
            leaveOpen: false
        });
        drawStarCurve(4, {resolution: 32, startAngle: 1/4});
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

    window.drawRectCurve = function(opts) {
        // TODO: explain
        // TODO: figure out an API for color properties
        // TODO: add initialAngle property
        opts = curveConfig(opts);

        var c = [
            p(0,0),
            p(opts.width,0),
            p(opts.width, opts.height),
            p(0, opts.height)
        ];

        var spines = [
            drawLine(c[0], c[1]),
            drawLine(c[1], c[2]),
            drawLine(c[2], c[3]),
            drawLine(c[3], c[0])
        ];

        doStitching(spines, opts);

    };

    window.drawStarCurve = function(starPointNum, opts){
        // TODO: explain why this is different than rect
        opts = curveConfig(opts);

        var radius = Math.min(opts.width, opts.height) / 2; // FIXME this only works for rotationally symmetric stars

        var spines = [];
        // rotate through all the angles drawing a spine for each
        for(var i=0;i<starPointNum;i++){
            var tipPoint = getPositions(
                i/starPointNum + opts.startAngle,
                radius, opts.center
            );

            // Have to alternate to get pretty curves
            var p1 = (i % 2 == 0) ? opts.center : tipPoint,
                p2 = (i % 2 == 0) ? tipPoint : opts.center;

            var line = drawLine(p1, p2);

            spines.push(line);
            two.render();
        }

        doStitching(spines, opts);
    };

    function doStitching(spines, opts){
        // TODO: explain inputs
        var resolution = opts.resolution,
            layerCount = opts.layerCount,
            layerSepFactor = opts.layerSepFactor;

        curve.add(spines);

        for (var i = 0; i < layerCount; i++) {
            var layer = stitchContinuous(
                spines,
                resolution,
                i * floor(resolution/layerCount) * layerSepFactor,
                opts.leaveOpen
            );
            layer.stroke = rgba(0, 127 + i * 16, 255 - i * 32, 1.0 - i / 8);
            layer.addTo(curve);
            two.render();
        }
    }

    function revToRad(rev){
        // Converts a number of revolutions (1 rev = 2pi radians)
        return 2 * pi * rev;
    }

    var getPositions = function(angle, radius, center) {
        // Get x,y coordinates for a point `radius`
        // from `center` at the given `angle`.
        return {
            x: Math.cos(revToRad(angle)) * radius + (center.x || 0),
            y: Math.sin(revToRad(angle)) * radius + (center.y || 0)
        };
    };

    var rotateAbout = function(cen, poly, angle){
        // Rotates a Two.Polygon about a point, "orbiting" that point.
        // TODO: extend Two.Polygon with this
        // Derived from this example: http://code.tutsplus.com/tutorials/drawing-with-twojs--net-32024
        console.log("OLD: angle=" + (poly.rotation/pi) + ", trans=" + poly.translation);
        poly.rotation = (poly.rotation + angle) % (2*pi);
        var pos = getPositions(poly.rotation, poly.length);
        poly.translation.x = cen.x + pos.x/2;
        poly.translation.y = cen.y + pos.y/2;
        console.log("NEW: angle=" + (poly.rotation/pi) + ", trans=" + poly.translation + "\n");
    };

    function Color(red, green, blue, alpha){
        this.r = red;
        this.g = green;
        this.b = blue;
        this.a = alpha;
        this.rgbaStr = function(){
            return rgba(this.r, this.g, this.b, this.a)
        };
    }

    // TODO: Color profile
    // startColor,
    // endColor,
    // pattern(?) alternate or transition

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
       two.render();

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
        // TODO: test with polygons
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
            //console.log(pointStr(pointA) + "~>" + pointStr(pointB));
            drawLine(pointA, pointB).addTo(group);
        }
        return group;
    }

    function stitchContinuous(lines, resolution, separation, leaveOpen){
        // "Stitch" a continuous curve between the list of lines given,
        // with `resolution` points per line, and a given number of
        // points of `separation`
        var points = [],
            stitches;
            for(var i = 0; i<lines.length; i++){
                var newPoints = getPoints(lines[i], resolution);
                if (points.length && points[points.length-1].equals(newPoints[0])){
                    newPoints.shift();
                }
                points = points.concat(newPoints);
            }
        separation = separation || 0;
        stitches = _followCurve(points, resolution + separation + 1);

        return stitches;
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