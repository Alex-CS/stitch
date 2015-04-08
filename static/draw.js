/**
 * Created by alex on 4/7/15.
 */

(function(){
    var elem = document.getElementById('canvas'),
        params = {width: 800, height: 800},
        two = new Two(params).appendTo(elem),
        maxX = two.width,
        maxY = two.height,
        count = 24,
        spine1 = two.makeLine(0, 0, maxX, 0),
        spine2 = two.makeLine(0, 0, 0, maxY),
        spine3 = two.makeLine(maxX, maxY, 0, maxY),
        spine4 = two.makeLine(maxX, maxY, maxX, 0);
    window.curve = two.makeGroup();
    curve.add(spine1, spine2, spine3, spine4);
    curve.stroke = "red";
    var box = [spine1, spine2, spine3, spine4],
        step = 4;

    for (var i=0; i<count/step; i++){
        var layer = stitchContinuous(box, count, count + i*step);
        layer.stroke = "rgba(0, "+(127+i*16)+", "+(255-i*32)+", "+ (1.0-i/8)+")";
        layer.addTo(curve);
    }

    function pointStr(vector){
        return "("+vector.x+","+vector.y+")";
    }

    function logPoint(vector){
        console.log(pointStr(vector));
    }

    function decenter(point, trans){
        // Take a Two.Vector positioned relative to center,
        // and change it to be relative to top-left corner
        return point.clone().set(trans.x - point.x, trans.y + point.y);
    }

    function drawLine(v1, v2){
        // wrapper function to make a line between a pair
        // of Two.Vector points
        return two.makeLine(v1.x, v1.y, v2.x, v2.y);
    }

    function getPoints(line, resolution, reverse){
        // Returns an array of `resolution` points
        // evenly spaced along `line`.
        // if `reverse`, get the points in reverse order.
        var vertices = line.vertices,
            translation = line.translation,
            points = [];
        for(var i=0; i<vertices.length; i++){
            var vertexA = vertices[i],
                vertexB = vertices[(i+1) % vertices.length],
                rangeX = vertexB.x - vertexA.x,
                rangeY = vertexB.y - vertexA.y,
                stepX = rangeX / resolution,
                stepY = rangeY / resolution,
                linePoints = [];
            // hack to avoid repetition
            if (vertexB === vertices[0] && vertices.length <= 2){
                continue;
            }

            console.log(pointStr(vertexA) + "->" + pointStr(vertexB));
            for(var stepNum=0; stepNum <= resolution; stepNum++){
                var curX = vertexA.x + stepNum * stepX,
                    curY = vertexA.y + stepNum * stepY,
                    curPoint = decenter(new Two.Anchor(curX, curY), translation);
                logPoint(curPoint);
                two.makeCircle(curPoint.x, curPoint.y, 2);
                points.push(curPoint);
            }
            //points.push(linePoints);
        }
        // Flip array if necessary
        reverse && points.reverse();
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
            console.log("Connecting " + pointStr(arr1[i]) + "~>" + pointStr(arr2[i]));
            var line = drawLine(arr1[i], arr2[i]);
            line.addTo(group);
        }
        return group;
    }

    function _followCurve(points, separation){
        // Takes an array of points and connects each to
        // the one `separation` ahead of it.
        var group = new Two.Group(),
            len = points.length;
        for(var i=0; i+separation<len; i++){
            var pointA = points[i],
                pointB = points[i+separation],
                line = drawLine(pointA, pointB);
            console.log("Connecting " + pointStr(pointA) + "~>" + pointStr(pointB));
            line.addTo(group);
        }
        return group;
    }

    function stitch(line1, line2, resolution){
        // "Stitch" a curve between the two lines given,
        // with `resolution` lines in the curve.
        var line1Points = getPoints(line1, resolution),
            line2Points = getPoints(line2, resolution),
            stitches = _followCurve(line1Points.concat(line2Points), resolution+2);//_connectDots(line1Points, line2Points);

        return stitches;
    }

    function stitchContinuous(lines, resolution, step){
        // "Stitch" a curve between the two lines given,
        // with `resolution` lines in the curve.
        var points = getPoints(lines[0], resolution),
            stitches;
            for(var i = 0; i<lines.length; i++){
                var newPoints = getPoints(lines[(i+1)%lines.length], resolution);
                if (points.length && points[points.length-1].equals(newPoints[0])){
                    newPoints.shift();
                }
                points = points.concat(newPoints);
            }
        step = step || resolution + 1;
        stitches = _followCurve(points, step);//_connectDots(line1Points, line2Points);

        return stitches;
    }

    two.render();
})();