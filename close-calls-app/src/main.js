// regenerator-runtime is to support async/await syntax in ESNext.
// If you target latest browsers (have native support), or don't use async/await, you can remove regenerator-runtime.
import 'regenerator-runtime/runtime';
import * as environment from '../config/environment.json';
import {PLATFORM} from 'aurelia-pal';

export function configure(aurelia) {

    aurelia.use
        .plugin(PLATFORM.moduleName('aurelia-google-maps'), config => {
            config.options({
                apiKey: 'AIzaSyAVGnyUqiZzVuFC6Wq9ExM57C1ZBM2Ce24', // use `false` to disable the key
                apiLibraries: 'drawing,geometry', //get optional libraries like drawing, geometry, ... - comma seperated list
                options: { panControl: true, panControlOptions: { position: 9 } }, //add google.maps.MapOptions on construct (https://developers.google.com/maps/documentation/javascript/3.exp/reference#MapOptions)
                language:'' | 'en', // default: uses browser configuration (recommended). Set this parameter to set another language (https://developers.google.com/maps/documentation/javascript/localization)
                region: '' | 'US', // default: it applies a default bias for application behavior towards the United States. (https://developers.google.com/maps/documentation/javascript/localization)
                markerCluster: {
                    enable: true, // self-hosting this file is highly recommended. (https://developers.google.com/maps/documentation/javascript/marker-clustering)
                    src: 'https://cdn.rawgit.com/googlemaps/v3-utility-library/99a385c1/markerclusterer/src/markerclusterer.js', // the base URL where the images representing the clusters will be found. The full URL will be: `{imagePath}{[1-5]}`.`{imageExtension}` e.g. `foo/1.png`. Self-hosting these images is highly recommended. (https://developers.google.com/maps/documentation/javascript/marker-clustering)
                    imagePath: 'https://cdn.rawgit.com/googlemaps/v3-utility-library/tree/master/markerclusterer/images/m', 
                    imageExtension: 'png',
                }
            });
        });

  aurelia.use
    .standardConfiguration()
    .feature(PLATFORM.moduleName('resources/index'));

  aurelia.use.developmentLogging(environment.debug ? 'debug' : 'warn');

  if (environment.testing) {
    aurelia.use.plugin(PLATFORM.moduleName('aurelia-testing'));
  }

  aurelia.start().then(() => aurelia.setRoot(PLATFORM.moduleName('app')));
}
