import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import {WebAPI} from './web-api';
import {inject} from 'aurelia-framework';
import moment from 'moment'

@inject(WebAPI)
export class App {
    constructor(api) {
        this.api = api;
        this.planes = [];
        this.closePlanes = [];
        this.markers = []
        this.latitude = 37.323;
        this.longitude = -122.0527;
        this.isLoading = false;
        this.zoom = 8;
        this.dataOptions = [];
        this.selectedOption = null;
        this.mode = "around center of screen";
        this.lookup = "";
    }

    async created() {
        this.dataOptions = [
            {name: 'All', value: 'all'},
            {name: '5-1-2018', value: '2018-05-01'},
            {name: '11-1-2019', value: '2019-11-01'},
            {name: '1-1-2020', value: '2020-01-01'}
        ];
        this.selectedOption = {name: 'All', value: 'all'};
        this.refreshPlanes();
    }

    attached() {
    }

    async refreshPlanes() {
        console.log("fetching", this.latitude, this.longitude);
        try {
            await this.getPlanes(this.latitude, this.longitude);
        } catch (err) {
            console.log(err);
        }
    }

    async getPlanes(lat, lon) {
        this.isLoading = true;
        let time = this.selectedOption.value;
        try {
            let planes = await this.api.call("getPlanes", {lat, lon, time});
            console.log(planes);
            this.isLoading = false;
            this.setUpMarkers(planes);
        } catch (err) {
            console.log(err);
        }
    }

    clearPlanes() {
        this.planes = [];
        this.markers = [];
        this.mode = "";
        this.lookup = "";
    }

    setUpMarkers(planes) {
        this.planes = [];
        this.markers = [];
        this.closePlanes = [];
        let otherPlane = {};
        let bluecolor = "0000FF";
        let redcolor = "FF0000";
        let index = 0;
        for (let plane of planes) {
            index++;

            plane.latitude = plane.Lat;
            plane.longitude = plane.Long;
            plane.Distance = Math.round(plane.Distance * 1000);
            plane.title = plane.Call ? plane.Call : plane.Reg
            plane.time = moment.unix(plane.PosTime).format('lll');
            plane.icon = {path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, rotation: plane.Trak, strokeColor: "blue", scale: 2};

            otherPlane.title = plane._Call ? plane._Call : plane._Reg
            otherPlane.latitude = plane._Lat;
            otherPlane.longitude = plane._Long;
            otherPlane.Icao = plane._Icao;
            otherPlane._Icao = plane.Icao;
            otherPlane.Call = plane._Call;
            otherPlane.Reg = plane._Reg;
            otherPlane._Reg = plane.Reg;
            otherPlane.icon = {path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, rotation: plane._Trak, strokeColor: "red", scale: 2};
            otherPlane.isOtherPlane = true;

            this.closePlanes.push(Object.assign({}, otherPlane));
        }
        this.planes = planes;
        this.markers = this.planes.concat(this.closePlanes);
        console.log(this.markers);

    }

    async getPlaneHistory(plane) {
        this.isLoading = true;
        let icao1 = plane.Icao;
        let icao2 = plane._Icao;
        if (plane.isOtherPlane) {
            icao1 = plane._Icao;
            icao2 = plane.Icao;
        }
            
        let points = await this.api.call("getPlaneHistory", { icao1, icao2 });
        this.isLoading = false;
        this.setUpMarkers(points);
        this.setLatLong(plane.latitude, plane.longitude);
    }

    async getPlaneByCall() {
        let call = this.lookup;
        this.isLoading = true;
        let points = await this.api.call("getPlaneByCall", { call });
        this.isLoading = false;
        this.setUpMarkers(points);
    }


    setLatLong (lat, lon) {
        this.latitude = lat;
        this.longitude = lon;
        this.zoom = 12;
    }

    handleMapClick(event) {
        let latLng = event.detail.latLng;
        this.latitude = latLng.lat();
        this.longitude = latLng.lng();
        this.mode = "around " + latLng.lat().toFixed(2) + " ," + latLng.lng().toFixed(2) ;
        this.refreshPlanes();
    }

    handleMarkerClick(event) {
        console.log(event);
        let plane = event.detail.marker;
        this.getPlaneHistory(plane);
        this.mode = `between ${plane.Reg} and ${plane._Reg}`;

    }
}
