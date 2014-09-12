// crear un mapa leaflet con capa base
var map = L.map('map');

L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 18,
	attribution: 'Map data &copy; OpenStreetMap contributors'
}).addTo(map);

var latLng = L.latLng(-33.443689, -70.659084);
map.setView(latLng, 13);

var sidebar = L.control.sidebar('sidebar');
sidebar.addTo(map);
setTimeout(function () {
    sidebar.open('home');
}, 500);



var Reader = L.Class.extend({

	initialize: function(element) {
		this.element = (typeof element === 'string') ? document.getElementById(element) : element;

		this.element.ondragover = this.ondragover.bind(this);
		this.element.ondragend = this.ondragend.bind(this);
		this.element.ondrop = this.ondrop.bind(this);

		this.audios = {};
		this.images = [];
	},

	ondragover: function (e) {
		this.element.className = 'hover';
		e.preventDefault();
	},

	ondragend: function (e) {
		this.element.className = '';
		e.preventDefault();
	},

	ondrop: function (e) {
		var self = this;
		this.element.className = '';
		map.closePopup();
		e.preventDefault();

		Array.prototype.forEach.call(e.dataTransfer.files, function(file) {
			var reader = new FileReader();
			reader.onload = function (event) {
				var result = event.target.result;
				if (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel') {
					self.processCSV(result);
				} else if (file.type === 'audio/wav') {
					self.processWAV(file.name, result);
				} else if (file.type === 'image/jpeg') {
					self.processJPEG(file.name, result);
				}
			};

			if (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel') {
				reader.readAsText(file);
			} else {
				reader.readAsDataURL(file);
			}
		});

		return false;
	},

	processWAV: function(name, dataURL) {
		this.audios[name] = dataURL;
	},

	processJPEG: function(name, dataURL) {
		var self = this;
	   	var image = new Image();
	    image.onload = function() {
	    	EXIF.getData(image, function(){
		    	var dateString = EXIF.getTag(image, 'DateTimeOriginal');
		    	var datetime = moment(dateString, 'YYYY:MM:DD hh:mm:ss').toDate();
	    		self.images.push({
					name: name,
					data: dataURL,
					time: datetime.getTime()
				});
			});
	    };
    	image.src = dataURL;
	},

	processCSV: function(text) {
		var lines = text.split(/\0\r\n|\0\n|\r\n|\n/);
		
		for (var i = 0, n = lines.length; i < n; i++) {
			var row = lines[i].split(',');
			this.onRow(row, i);
		}
		this.onFinish();
	},

	onRow: function(){
		console.log('method onRow is not implemented');
	},	

	onFinish: function(){
		console.log('method onFinish is not implemented');
	}	

});






var voiceLayer = L.layerGroup().addTo(map);
var trackLayer = L.layerGroup().addTo(map);
var poiLayer = L.layerGroup().addTo(map);

var overlayMaps = {
	'voice': voiceLayer,
	'track': trackLayer,
	'poi': poiLayer
};

L.control.layers(null, overlayMaps, {collapsed: false}).addTo(map);

var adapter = new ColumbusV900();
var reader = new Reader('dropzone');


reader.onRow = adapter.processRow.bind(adapter);
reader.onFinish = function(){
	var points = adapter.points;

	points.forEach(function(point){
		var marker = L.marker([point.lat, point.lng]);
		marker.point = point;
		marker.on('click', showPopup);
		var layer = overlayMaps[point.type];
		marker.addTo(layer);
	});
};


function searchImage(date) {
	var time = date.getTime();
	var images = reader.images;
	var delta = 30000; //30 seconds

	for(var i = 0, n = images.length; i < n; i++) {
		if (Math.abs(images[i].time - time) <= delta) {
			return images[i];
		}
	}
}

function showPopup(e) {
	var marker = e.target;
	var point = marker.point;

	var html = '<table>' +
	           '<tr><th>posicion:</th><td>' + point.lat + ',' + point.lng + '</td></tr>' +
	           '<tr><th>fecha:</th><td>' + moment(point.datetime).format('DD/MM/YY hh:mm:ss') + '</td></tr>';

	if (point.type === 'voice') {
		var filename = point.audio + '.WAV';
		var dataURL = reader.audios[filename];
		if (dataURL) {
			html += '<tr><th>audio:</th><td><audio id="' + filename + '" src="' + dataURL + '" controls preload="auto" autobuffer></audio></td></tr>';
		} else {
			html += '<tr><th>audio:</th><td>Sube el archivo ' + filename + '</td></tr>';
		}
	}

	var image = searchImage(point.datetime)
	if (image) {
		html += '<tr><th>foto:</th><td>'+ image.name +'<img width=150 height=150 src="' + image.data +'"></td></tr>';
	}

	html += '</table>';

	marker.unbindPopup();
	marker.bindPopup(html).openPopup();
}