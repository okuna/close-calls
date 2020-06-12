import {HttpClient, json} from 'aurelia-fetch-client';

let httpClient = new HttpClient();

httpClient.configure(config => {
    config.withBaseUrl('api/')
        .withDefaults({
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'Fetch'
            }
        })
        .withInterceptor({
            request(request) {
                console.log(`Requesting ${request.method} ${request.url}`);
                return request;
            },
            response(response) {
                console.log(`Received ${response.status} ${response.url}`);
                return response.json();
            }
        });
});

async function callWithHttp(functionName, data) {
    return await httpClient.fetch(functionName, {
        method: 'post',
        body: json({'data': data})
    });
}

export class WebAPI {
    async call(functionName, data) {
        return await callWithHttp(functionName, data);
    }
}
