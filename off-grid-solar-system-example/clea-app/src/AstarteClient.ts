import axios, { AxiosInstance } from "axios";

type AstarteClientProps = {
    astarteUrl: URL;
    realm: string;
    token: string;
    deviceId: string;
};

type Config = AstarteClientProps & {
    appeEngineURL: URL;
};

type QueryParameters = {
    sinceAfter?: string;
    since?: Date;
    to?: Date;
    limit?: number;
};

class AstarteClient {
    config: Config;
    EXTERNAL_SENSORS_INTERFACE:string   = `ai.clea.examples.offgrid.ExternalSensors`;
    LOAD_STATISTICS_INTERFACE:string    = `ai.clea.examples.offgrid.LoadStats`;
    BATTERY_STATISTICS_INTERFACE:string = `ai.clea.examples.offgrid.BatteryStats`;
    PANEL_STATISTICS_INTERFACE:string   = `ai.clea.examples.offgrid.PanelStats`;


    constructor({astarteUrl, realm, token, deviceId}: AstarteClientProps) {
        this.config = {
            astarteUrl,
            realm,
            token,
            deviceId,
            appeEngineURL: new URL("/", astarteUrl),
        };
    }


    async performQuery (params:QueryParameters, inerfaceName:string, path?:string) {
        const {appeEngineURL,
                realm,
                token,
                deviceId}       = this.config;
        const finalPath         = `appengine/v1/${realm}/devices/${deviceId}/interfaces` +
                                    `/${inerfaceName}${path!==undefined ? "/"+path : ""}`;
        const requestURL        = new URL(finalPath, appeEngineURL);
        const query: Record<string, string> = {};
        if (params.sinceAfter) {
            query.sinceAfter    = params.sinceAfter;
        }
        if (params.since) {
            query.since = params.since.toISOString();
        }
        if (params.to) {
            query.to    = params.to.toISOString();
        }
        if (params.limit) {
            query.limit = params.limit.toString();
        }
        requestURL.search = new URLSearchParams(query).toString();
        
        return axios ({
            method  : "get",
            url     : requestURL.toString(),
            headers : {
                "Authorization" : `Bearer ${token}`,
                "Content-Type"  : "application/json;charset=UTF-8",
            }
        }).then ((response) => {
            return response.data.data
        })
    }


    /* TODO IMPLEMENT ME!
    async getMultipleCameraData ({deviceId, since, to}:MultipleCameraDataParameters) {
        // Retrieving camera data 12 hours for 12 jours
        const PROMISES_MAX_LENGTH               = 50;
        const { appEngineUrl, realm, token }    = this.config;
        const interfaceName                     = "ai.clea.examples.PeopleCounter";
        const path                              = `appengine/v1/${realm}/devices/${deviceId}/interfaces/${interfaceName}/camera`;
        const requestUrl                        = new URL(path, appEngineUrl.toString());

        let promises                            = [];
        let results                             = [];
        let tmp_start_date                      = new Date(since);
        let tmp_end_date                        = new Date(since);
        tmp_end_date.setHours(tmp_end_date.getHours()+12);

        while (tmp_start_date < to) {
            if (tmp_end_date>to) {
                tmp_end_date    = new Date(to)
            }
            
            const query: Record<string, string> = {};
            query.since                         = tmp_start_date.toISOString();
            query.to                            = tmp_end_date.toISOString();
            requestUrl.search = new URLSearchParams(query).toString();

            promises.push (axios({
                method  : 'get',
                url     : requestUrl.toString(),
                headers : {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json;charset=UTF-8",
                },
                validateStatus : (status) => {return true}
            }))

            // Updating start and end date
            tmp_start_date.setHours(tmp_start_date.getHours()+12)
            tmp_end_date.setHours(tmp_end_date.getHours()+12);

            // Checking if promises has to be awaitied
            if (promises.length > PROMISES_MAX_LENGTH) {
                for (let i in promises) {
                    try {
                        let res = await promises[i]
                        for (let ri in res.data.data) {
                            let item        = res.data.data[ri]
                            results.push ({
                                people          : item.people,
                                people_count    : item.people_count,
                                timestamp       : item.timestamp
                            })
                        }
                    } catch (err) {
                        // Do nothing
                        console.warn (`Catched an error`)
                    }
                }
                promises    = []
            }
        }

        // Awaiting remaining promises
        for (let i in promises) {
            try {
                let res = await promises[i]
                for (let ri in res.data.data) {
                    let item        = res.data.data[ri]
                    results.push ({
                        people          : item.people,
                        people_count    : item.people_count,
                        timestamp       : item.timestamp
                    })
                }
            } catch (err) {
                // Do nothing
                console.warn (`Catched another error`)
            }
        }

        return results;
    }*/




    async getTemperature (since:Date) {
        return this.performQuery ({since}, this.EXTERNAL_SENSORS_INTERFACE, "temperature");
    }

    async getWindSpeed (since:Date) {
        return this.performQuery ({since}, this.EXTERNAL_SENSORS_INTERFACE, "wind_velocity");
    }
    
    async getReferenceCellCurrent(since: Date) {
        return this.performQuery ({since}, this.EXTERNAL_SENSORS_INTERFACE, "reference_electrical_current");
    }
    
    async getDayPeriod(since:Date) {
        return this.performQuery ({since}, this.EXTERNAL_SENSORS_INTERFACE, "day_period");
    }


    async getSolarPanelData (since:Date, to:Date) {
        // TODO Retrieve by parts
        return this.performQuery ({since, to}, this.PANEL_STATISTICS_INTERFACE, "")
    }


    async getBateryData (since:Date, to:Date) {
        // TODO Retrieve by parts
        return this.performQuery ({since, to}, this.BATTERY_STATISTICS_INTERFACE, "")
    }


    async getElectricalLoadData (since:Date, to:Date) {
        // TODO Retrieve by parts
        return this.performQuery ({since, to}, this.LOAD_STATISTICS_INTERFACE, "")
        return []
    }
}


export default AstarteClient;