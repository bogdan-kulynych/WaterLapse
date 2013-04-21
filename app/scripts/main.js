(function() {
  var datasource = '/data/precipitation-small.json';

  xhr = new XMLHttpRequest();
  xhr.open('GET', datasource, true);

  xhr.onreadystatechange = function(e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        // var ungzipped = JXG.decompress(xhr.responseText);
        var ungzipped = xhr.responseText;
        var data = JSON.parse(ungzipped);
        window.data = data;

        var ratio = 1 / 2;
        window.width = window.innerWidth,
        window.height = ratio * width;

        var canvas = $('<canvas></canvas>')
            .addClass('map')
            .attr("width", width)
            .attr("height", height);
        $("body").append(canvas);

        var ctx = canvas[0].getContext("2d");
        console.log(ctx);

        plot_array(ctx, data[0]['data']);
      }
    };
  };
  xhr.send();

  var equirectangular = function(latitude, longitude) {
    x = ((longitude + 180) * (width  / 360));
    y = (((latitude * -1) + 90) * (height/ 180));
    return [x, y]
  };

  var mercator = function(latitude, longitude) {
    x = (width*(180+longitude)/360)%width+(width/2);
    const PI = Math.PI;
    const tan = Math.tan;
    const log = Math.log;

    // convert from degrees to radians
    latRad = latitude*PI/180;

    // get y value
    mercN = log(tan((PI/4)+(latRad/2)));
    y     = (height/2)-(width*mercN/(2*PI));
    return [x - width / 2, y]
  };

  var convert_coordinates = function(latitude, longitude) {
    return equirectangular(latitude, longitude);
  };

  var plot_array = function(ctx, array) {
    console.log(array);
    for (var i = 0; i < array.length; ++i) {
      var obj = array[i];

      coords = convert_coordinates(obj['lat'], obj['lon']);
      x = coords[0], y = coords[1];

      ctx.beginPath();
      ctx.fillStyle = "white"
      ctx.arc(x, y, 1, 0, 2 * Math.PI, true);
      ctx.fill();
    }
  };
})();