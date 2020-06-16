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
        let otherPlane = {};
        console.log(planes);
        this.isLoading = false;
        for (let plane of planes) {
            plane.latitude = plane.Lat;
            plane.longitude = plane.Long;
            plane.label = plane.Call;
            otherPlane.latitude = plane._Lat;
            otherPlane.longitude = plane._Long;
            otherPlane.label = plane._Call;
            otherPlane.Icao = plane._Icao;
            otherPlane.Call = plane._Call;
            otherPlane.Reg = plane._Reg;
            this.closePlanes.push(Object.assign({}, otherPlane));
        }
        this.planes = planes;
        this.markers = this.planes.concat(this.closePlanes);
        console.log(this.markers)
    }

    setLatLong (lat, lon) {
        this.latitude = lat;
        this.longitude = lon;
    }

    handleMapClick(event) {
        let latLng = event.detail.latLng;
        this.latitude = latLng.lat();
        this.longitude = latLng.lng();
        this.refreshPlanes();
    }
}
