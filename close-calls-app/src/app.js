import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import {WebAPI} from './web-api';
import {inject} from 'aurelia-framework';
import mapsapi from 'google-maps-api';

@inject(WebAPI)
export class App {
    constructor(api, mapsapi) {
        this.api = api;
        this.planes = [];
        this.latitude = 37.323;
        this.longitude = -122.0527;
        this.isLoading = false;
    }

    async created() {
        await this.getPlanes(this.latitude, this.longitude);
    }

    async getPlanes(lat, lon) {
        this.isLoading = true;
        let planes = await this.api.call("getPlanes", {lat, lon});
        this.isLoading = false;
        this.planes = planes;
        console.log(planes);
    }
    async refreshPlanes() {
        console.log("fetching", this.latitude, this.longitude);
        await this.getPlanes(this.latitude, this.longitude);
    }
    handleMapClick(event) {
        let latLng = event.detail.latLng;
        this.latitude = latLng.lat();
        this.longitude = latLng.lng();
        this.refreshPlanes();
    }
}
