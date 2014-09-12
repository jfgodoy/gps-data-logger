
	
function ColumbusV900() {
	//INDEX	TAG	DATE	TIME	LATITUDE N/S	LONGITUDE E/W	HEIGHT	SPEED	HEADING	VOX
	this.headers = [];
	this.points = [];

	this.tagRename = {
		'T': 'track',
		'V': 'voice',
		'C': 'poi'
	};

	this.headersRename = {
		'TAG': 'tag',
		'DATE': 'date',
		'TIME': 'time',
		'LATITUDE N/S': 'lat',
		'LONGITUDE E/W': 'lng',
		'HEIGHT': 'height',
		'SPEED': 'speed',
		'HEADING': 'heading',
		'VOX': 'audio'
	};
}

ColumbusV900.prototype.processRow = function(row, index) {
	var record, header, name, i, n;

	if (index === 0) {
		for (i = 0, n = row.length; i < n; i++) {
			this.headers[i] = row[i];
		}
		return;
	}

	record = {};
	for (i = 0, n = row.length; i < n; i++) {
		header = this.headers[i];
		name = this.headersRename[header];
		if (name) {
			record[name] = row[i];
		}
	}

	if (record.lat && record.lng){
		this.processRecord(record, index);
	}
};

ColumbusV900.prototype.processRecord = function(record, index) {
	var point = {};

	point.lat = (record.lat[record.lat.length -1] === 'S' ? -1 : 1) * parseFloat(record.lat);
	point.lng = (record.lng[record.lng.length -1] === 'W' ? -1 : 1) * parseFloat(record.lng);
	point.datetime = moment.utc(record.date + record.time, 'YYMMDDhhmmss').toDate();
	point.height = parseFloat(record.height);
	point.speed = parseFloat(record.speed);
	point.type = this.tagRename[record.tag];
	point.audio = record.audio;

	if (point.type === 'voice') {
		point.voice = record.vox;
	}

	this.points.push(point);
};
