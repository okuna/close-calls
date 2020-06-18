import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import {WebAPI} from './web-api';
import {inject} from 'aurelia-framework';

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
    }

    async created() {
        this.refreshPlanes();
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
        let planes = await this.api.call("getPlanes", {lat, lon});
        console.log(planes);
        this.isLoading = false;
        this.setUpMarkers(planes);
    }

    setUpMarkers(planes) {
        this.planes = [];
        this.markers = [];
        this.closePlanes = [];
        let otherPlane = {};
        for (let plane of planes) {
            plane.latitude = plane.Lat;
            plane.longitude = plane.Long;
            plane.Distance = Math.round(plane.Distance * 1000);
            plane.title = plane.Call ? plane.Call : plane.Reg
            otherPlane.title = plane._Call ? plane._Call : plane._Reg
            otherPlane.latitude = plane._Lat;
            otherPlane.longitude = plane._Long;
            otherPlane.Icao = plane._Icao;
            otherPlane._Icao = plane.Icao;
            otherPlane.Call = plane._Call;
            otherPlane.Reg = plane._Reg;
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


    setLatLong (lat, lon) {
        this.latitude = lat;
        this.longitude = lon;
        this.zoom = 12;
    }

    handleMapClick(event) {
        let latLng = event.detail.latLng;
        this.latitude = latLng.lat();
        this.longitude = latLng.lng();
        this.refreshPlanes();
    }

    handleMarkerClick(event) {
        console.log(event);
        let plane = event.detail.marker;
        this.getPlaneHistory(plane);

    }
}
