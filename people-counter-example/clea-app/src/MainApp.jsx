
import "core-js/stable"
import "regenerator-runtime/runtime"
import React, { Fragment } from "react";
import { Button, Col, Container, Card, Row, InputGroup, FormControl, ToggleButton,
            ToggleButtonGroup, Spinner, Navbar, Nav} from "react-bootstrap";
import { FormattedMessage } from "react-intl";
import Chart from "react-apexcharts";
import DatePicker from "react-datepicker";
import DatePickerStyle from "react-datepicker/dist/react-datepicker.css";
import _, { result } from 'lodash';

let historical_data_size        = 5;            // minutes
const default_areas             = [];           // item : {zone_count, zone_name, zone_id}
let historical_data_cache       = [];           // item : {timestamp, value}
let last_query_date             = undefined;
let zones_colors                = [
    {class:'text-primary', color:'#007bff'},
    {class:'text-secondary', color:'#6c757d'},
    {class: 'text-success', color:'#28a745'}, 
    {class: 'text-danger', color:'#dc3545'},
    {class: 'text-warning', color:'#ffc107'}, 
    {class:'text-info', color:'#17a2b8'},
    {class:'text-dark', color:'#343a40'}
]
let zcolors = ['#007bff', '#6c757d', `#28a745`, `#dc3545`, `#ffc107`, `#17a2b8`, `#343a40`]




export const MainApp = ({ sceneSettings, updateInterval, astarteClient, deviceId }) => {
    const stats_chart_ref       = React.useRef(null);
    const chartRef              = React.useRef(null);
    const inputRef              = React.useRef(null);
    const [isReady, setIsReady] = React.useState(false);
    const [viz, setViz]         = React.useState({ width: 550, height: 350, data: [] });        // Right part: graph
    const [counter, setCounter] = React.useState({ total: 0, areas: default_areas });           // left part: counters
    

    const update_viz_and_stats  = (new_data) => {
        let current_timestamp   = new Date().getTime()

        // Checking if there are information
        if (!new_data || new_data.length == 0) {
            console.warn ("Empty data")
            return ;
        }

        // Updating historical_data_cache
        _.map (new_data, (d) => {
            if (d && d.timestamp!=undefined) {
                historical_data_cache.push ({timestamp: d.timestamp, value:d.people_count})
            }
        })
        // Removing too old data
        let delta_time_limit    = historical_data_size*60*1000
        while (current_timestamp - new Date(historical_data_cache[0].timestamp).getTime() > delta_time_limit) {
            historical_data_cache.shift();
        }

        // Updating counters with newest data
        let newest_data = new_data[new_data.length-1]
        if (newest_data)
            setCounter (parseCounterData(newest_data))

        // Updating chart with incoming data
        setViz (viz => {
            let new_data    = _.map (historical_data_cache, (h) => {
                return h
            })
            
            return {...viz, data:new_data}
        })
    }
    

    const getChartWidth = () => {
        if (isReady) {
            const domRect = chartRef.current.getBoundingClientRect();
            return domRect.width;
        }
        return 550;
    }


    const onHistoricalDataSizeUpdate    = (evt) => {
        if (inputRef.current && inputRef.current.value && !Object.is(parseInt(inputRef.current.value), NaN)
            && parseInt(inputRef.current.value) > 0) {
            historical_data_size    = parseInt (inputRef.current.value)

            let recent_data_since   = new Date();
            recent_data_since.setMinutes(last_query_date.getMinutes() - historical_data_size);

            getData (deviceId, astarteClient, undefined, recent_data_since)
            .then ((data) => {

                // Check performed to avoid strange rendering of chart
                if (historical_data_cache.length != 0)
                    historical_data_cache   = []
                
                // Updating chart with recent data
                update_viz_and_stats (data)
            })
        }
    }


    React.useEffect(() => {
        if (sceneSettings.length > 0) {

            // Setting up scene_zones
            _.map (sceneSettings, (d) => {
                let item    = {
                    zone_count  : 0,
                    zone_name   : d.zone_name,
                    zone_id     : d.zone_id
                }
                default_areas[item.zone_id] = item
            })

            let mount               = true;
            let interval_id         = undefined

            last_query_date         = new Date();
            let recent_data_since   = new Date();
            recent_data_since.setMinutes(last_query_date.getMinutes() - historical_data_size);

            getData (deviceId, astarteClient, undefined, recent_data_since)
            .then ((data) => {
            
                // Check performed to avoid strange rendering of chart
                if (historical_data_cache.length != 0)
                    data    = []
                
                // Updating chart with recent data
                update_viz_and_stats (data)
                

                // Creating periodic task that fetch and update data
                if (!updateInterval) {
                    console.error (`Wrong updateInterval value: ${updateInterval}.\nSetting it to default value`)
                    updateInterval  = 5000
                }
                interval_id = setInterval(() => {
                    if (mount) {
                        // Querying data only from last update
                        getData(deviceId, astarteClient, undefined, last_query_date)
                        .then((data) => {
                            last_query_date         = new Date();
                            
                            if (!data || data.length==0) {
                                return;
                            }

                            update_viz_and_stats (data)
                        })
                    }
                }, updateInterval);
            })

            return () => {
                if (interval_id) {
                    console.warn ("Clearing interval...")
                    clearInterval(interval_id);
                }
                mount = false;
            }
        }
    }, [sceneSettings, updateInterval, deviceId, astarteClient]);


    React.useEffect(() => {
        if (chartRef.current) {
            setIsReady(true);
        }
    }, [chartRef]);


    React.useEffect(() => {
        if (isReady) {
            const resizeChart = () => {
                const domRect = chartRef.current.getBoundingClientRect();
                let new_width   = domRect.width
                let new_heigth  = new_width*10/16
                setViz(viz => {return { ...viz, width: new_width, height:new_heigth }});
            }
            window.addEventListener("resize", resizeChart);

            return () => {
                window.removeEventListener("resize", resizeChart, false);
            }
        }
    }, [isReady]);


    return (
        <div className="p-4">
            <Container fluid>
                <Row>
                    <Col sm={12} md={6}>
                        <Card bg="info" className="counter-section rounded">
                            <Card.Body>
                                <div className="counter-container">
                                    <div className="counter-title">
                                        <small>Real time</small>
                                        <h3>People Counter</h3>
                                    </div>
                                    <div className="counter-number">
                                        {counter.total}
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                        <Row>
                            {counter.areas.map((area, index) => {
                                console.log (`index: ${index}`)
                                return (
                                    <Col sm={12} md={6} key={index}>
                                        <Card className="area-section rounded text-center">
                                            <Card.Body>
                                                <div className="area-container">
                                                    <div className="area-title text-secondary p-3 d-flex">
                                                        <h4 className={zones_colors[index].class}>{area.zone_name}</h4>
                                                        <small>People Counter</small>
                                                    </div>
                                                    <div className="area-number text-primary">
                                                        {area.zone_count}
                                                    </div>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>);
                            })}
                        </Row>
                    </Col>
                    <Col sm={12} md={6}>
                        <Card className="chart-section rounded">
                            <Card.Body>
                                
                                <InputGroup className="mb-3">
                                    <InputGroup.Text>Chart History Size (minutes)</InputGroup.Text>
                                    <FormControl aria-label="Minutes" defaultValue={historical_data_size}
                                                ref={inputRef}/>
                                    <Button variant="outline-secondary" id="history-update-id"
                                            onClick={onHistoricalDataSizeUpdate}>
                                        Update
                                    </Button>
                                </InputGroup>
                                
                                <div className="chart-container" ref={chartRef}>
                                    <Fragment>
                                        <DataChart width={viz.width} height={viz.height} data={viz.data} />
                                    </Fragment>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row className="mt-5">
                    <Card className="border-0">
                        <Card.Title className="m-2">
                            Average Presence
                        </Card.Title>
                        <Card.Body>
                            <div className="chart-container" ref={stats_chart_ref}>
                                <Fragment>
                                    <StatsChart astarte_client={astarteClient} device_id={deviceId} stats_chart_ref={stats_chart_ref} areas={counter.areas}/>
                                </Fragment>
                            </div>
                        </Card.Body>
                    </Card>
                </Row>
            </Container>
        </div>
    );
}




/*  =====================================
            ASTARTE DATA HANDLERS
    ===================================== */

async function getData(deviceId, astarteClient, limit, since) {
    return astarteClient
        .getCameraData({ deviceId, limit, since})
        .then((data) => {
            return data;
        })
        .catch(() => {
            return undefined;
        });
}


function parseCounterData(data) {
    /* RETURN VALUE : {
        total,
        timestamp,
        areas   : {
            zone_count,
            zone_name,
            zone_id
        }
    }*/

    let counter  = {
        total       : 0,
        timestamp   : new Date (data.timestamp),
        areas       : JSON.parse(JSON.stringify(default_areas))
    }

    const people    = data.people ? data.people : [];
    _.map (people, (person) => {
        let parsed_person   = JSON.parse (person)
        if (parsed_person.pos_zone.id in default_areas) {
            counter.areas[parsed_person.pos_zone.id].zone_count += 1
            counter.total++
        }
        else
            console.error (`Person ${parsed_person.id} has no correspondent area!`)
    })

    return counter;
}




/*  ===================================
            DATA CHART SETTINGS
    =================================== */

const chartOptions = {
    chart: {
        id: 'people',
        type: 'line',
        stacked: false,
        zoom: {
            type: 'x',
            enabled: false,
            autoScaleYaxis: true
        },
        toolbar: {
            autoSelected: 'zoom'
        }
    },
    stroke: {
        width: [2, 2],
        curve: 'smooth'
    },
    colors: ['#FF8300'],
    dataLabels: {
        enabled: false
    },
    markers: {
        size: 0,
    },
    title: {
        text: 'People',
        align: 'left'
    },
    tooltip: {
        shared: false,
        y: {
            formatter: function (val) {
                return (val).toFixed(0)
            }
        }
    },
    xaxis: {
        type: 'datetime',
        labels : {
            formatter : (time) => {
                let d   = new Date(time)
                return `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`
            }
        },
        rotate  : 0
    },
    yaxis: {
        labels: {
            formatter: function (val) {
                return (val).toFixed(0);
            },
        },
    }
};


const DataChart = ({ data, width, height, isMount = false }) => {

    if (data.length === 0) {
        return (
            <div>
                <FormattedMessage id="no_data" defaultMessage="No recent data" />
            </div>
        );
    }

    const series = React.useMemo(
        () => {
            
            return [
                {
                    name: "People",
                    data: data.map((d) => [new Date(d.timestamp), d.value]),
                },
            ]
        },
        [data]
    );

    return (
        <Chart type="line" width={width} height={height} options={chartOptions} series={series} />
    );
};




/*  ====================================
            STATS CHART SETTINGS
    ==================================== */

const stats_chart_options   = {
        chart: {
        type: 'bar',
        height: 350,
        stacked: true,
        toolbar: {
          show: false
        },
        zoom: {
          enabled: true
        }
      },
      responsive: [{
        breakpoint: 480,
        options: {
          legend: {
            position: 'bottom',
            offsetX: -10,
            offsetY: 0
          }
        }
      }],
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 10
        },
      },
      tooltip : {
        enabled : false
      },
      xaxis: {
        labels: {
            formatter: (t) => {
                return t
            }
        }
      },
      colors: zcolors,
      legend: {
        position: 'bottom'
      },
      fill: {
        opacity: 1
      }
};
/*const stats_chart_options   = {
    series  : [
        {
            name: 'PRODUCT A',
            data: [44, 55, 41, 67, 22, 43]
        },{
            name: 'PRODUCT B',
            data: [13, 23, 20, 8, 13, 27]
        },{
            name: 'PRODUCT C',
            data: [11, 17, 15, 15, 21, 14]
        },{
            name: 'PRODUCT D',
            data: [21, 7, 25, 13, 22, 8]
        }
    ],

    chart   : {
        id      : 'stats-chart',
        type    : 'bar',
        stacked : true,
        toolbar: {
            show : false,
            autoSelected: 'pan'
        }
    },
    responsive: [{
        breakpoint: 480,
        options: {
          legend: {
            position: 'bottom',
            offsetX: -10,
            offsetY: 0
          }
        }
      }],
    plotOptions : {
        bar: {
            horizontal: false,
            borderRadius: 10
          }
    },
    stroke: {
        width: [2, 2],
        curve: 'smooth'
    },
    colors: ['#FF8300', '#AA8300'],
    title: {
        show    : false
    },
    tooltip: {
        enabled : false,
        shared: false,
        y: {
            formatter: function (val) {
                return (val).toFixed(0)
            }
        }
    },
    xaxis: {
        labels: {
            formatter: (t) => {
                return t
            }
        }
    }
}*/


const StatsChart    = ({astarte_client, device_id, stats_chart_ref, areas}) => {
    const [stats_chart_desc, set_stats_desc]    = React.useState ({data:undefined, width:0, height:0})
    const [filter_grain, set_filter_grain]      = React.useState (0)                        // 0:hours, 1:weekdays, 2:moth days
    const [date_range, set_date_range]          = React.useState ([new Date(), new Date()]) // DatePicker result
    const [start_date, end_date]                = date_range;
    const buttons_descriptors                   = [
        {
            value       : 0,
            content     : "Days",
            id          : "hrs"
        },
        {
            value       : 1,
            content     : "Week",
            id          : "wds"
        },
        {
            value       : 2,
            content     : "Month",
            id          : "mds"
        }
    ]


    const range_normalizer  = () => {
        start_date.setHours (0)
        start_date.setMinutes (0)
        start_date.setSeconds (0)
        start_date.setMilliseconds (0)

        end_date.setHours (0)
        end_date.setMinutes (0)
        end_date.setSeconds (0)
        end_date.setMilliseconds (0)
        end_date.setDate (end_date.getDate()+1)
        end_date.setMilliseconds (end_date.getMilliseconds()-1)

        if (filter_grain == 2) {
            // Searching from monthly data
            start_date.setDate (1)

            end_date.setMonth (end_date.getMonth()+1)
            end_date.setDate (1)
            end_date.setDate (end_date.getDate()-1)
        }
    }


    const value_to_axis_text    = (t) => {
        switch (filter_grain) {
            case 0 :
                return `${t}`;

            case 1 : {
                if (t==0)
                    return 'Sunday';
                if (t==1)
                    return 'Monday';
                if (t==2)
                    return 'Tuesday';
                if (t==3)
                    return 'Wednesday'
                if (t==4)
                    return 'Thursday';
                if (t==5)
                    return 'Friday';
                if (t==6)
                    return 'Saturday';

                return undefined;
            }

            case 2 :
                return `${t+1}`;
            

            default :
                return undefined
        }
    }


    const data_analyzer     = (data) => {
        console.log (`Analyzing data...\nfilter_grain:${filter_grain}`)
        /*let people  = []
        for (let i in data[0].people)
            people.push (JSON.parse (data[0].people[i]))
        console.log (data)
        console.log (people)*/

        /* data item:
            {
                "people": [
                    "{\"conf\":0.9543384313583374,\"id\":9566,\"pos_zone\":{\"id\":1,\"name\":\"uno\"}}",
                    "{\"conf\":0.6809995770454407,\"id\":9568,\"pos_zone\":{\"id\":0,\"name\":\"zero\"}}"
                ],
                    "people_count": 2,
                    "timestamp": "2022-03-03T13:01:53.722Z"
            }
         */
        /* OUTPUT:[
            ...
            {name:'area_name', data:[]}
            ...
        ]
        */


        let item_per_unit   = []
        let results         = []

        
        
        if (filter_grain == 0) {
            // Analyzing data basing on hours
            /*for (let i=0; i<24; i++) {
                results[i]          = 0
                item_per_unit[i]    = 0
            }*/
            for (let i=0; i<areas.length; i++) {
                let zone_name               = areas[i].zone_name
                results[i]                  = {name:zone_name, data:[]}
                item_per_unit[zone_name]    = []
                for (let j=0;j<24;j++) {
                    results[i].data[j]          = 0
                    item_per_unit[zone_name][j] = 0
                }
            }

            /*_.map (data, (item, idx) => {
                let item_hour   = Number (new Date (item["timestamp"]).getHours())
                results[item_hour] += item['people_count']
                item_per_unit[item_hour] += 1
            })*/
            _.map (data, (item, idx) => {
                let item_hour   = Number (new Date (item["timestamp"]).getHours())
                let jpeople     = JSON.parse(`[${item.people}]`)
                for (let i in jpeople) {
                    let person  = jpeople[i]
                    results[person.pos_zone.id].data[item_hour] += 1
                }
                item_per_unit[person.pos_zone.name][item_hour] += 1
                /*let item_hour   = Number (new Date (item["timestamp"]).getHours())
                results[item_hour] += item['people_count']
                item_per_unit[item_hour] += 1*/
            })

            console.log (results)
            console.log (item_per_unit)
        }
        else if (filter_grain == 1) {
            // Analyzing data basing on weekdays
            for (let i=0; i<7; i++) {
                results[i]          = 0
                item_per_unit[i]    = 0
            }

            _.map (data, (item, idx) => {
                let curr_date   = new Date (item["timestamp"])
                let item_day    = curr_date.getDay()
                results[item_day] += item['people_count']
                item_per_unit[item_day] += 1
                //console.log (`item_day: ${item_day}`)
            })
        }
        else if (filter_grain == 2) {
            // Analyzing data basing on months days
            for (let i=0; i<31; i++) {
                results[i]          = 0
                item_per_unit[i]    = 0
            }

            _.map (data, (item, idx) => {
                let item_date   = new Date (item['timestamp']).getDate()
                results[item_date] += item['people_count']
                item_per_unit[item_date] += 1
                //console.log (`item_day: ${item_date}`)
            })
        }
        else {
            console.error (`Invalid filter_grain value: ${filter_grain}`)
        }

        //console.log (`Building results\n\tfg: ${filter_grain}\n\tlen: ${item_per_unit.length}`)
        results = _.map (item_per_unit, (item, idx) => {
            console.log (item)
            return {
                // Considering 'filter_grain' value to specify the 'x' value
                x:value_to_axis_text(idx),
                // x:'lol',
                y:item==0 ? 0 : Number((results[idx]/item).toFixed(2))}
        })

        console.log ('data_analyzer results:')
        console.log (results)

        return results
    }


    React.useEffect (() => {

        if (start_date != null && end_date != null) {
            range_normalizer ()
            console.log (`Reloading stats data from ${start_date} to ${end_date}`)
            let query_params    = {
                deviceId    : device_id,
                since       : new Date(start_date),
                to          : new Date(end_date)
            }
            set_stats_desc ((desc) => {return {...desc, data:undefined}})

            astarte_client.getMultipleCameraData (query_params)
            .then ((data) => {
                /*console.log ("Retrieved this information")
                console.log (data)*/

                if (data.length == 0)
                    set_stats_desc ((desc) => {return {...desc, data:[]}})
                else
                    set_stats_desc ((desc) => {return {...desc, data:data_analyzer(data)}})
            })
            .catch ((err) => {
                console.error (`Cannot retrieve data from such period`)
                set_stats_desc ((desc) => {return {...desc, data:[]}})
            })
        }
        else if (start_date != null || end_date != null) {
            // Do nothing
        }
        else {
            set_stats_desc ((desc) => {return {...desc, data:[]}})
        }
    }, [filter_grain, date_range])


    React.useEffect (() => {
        if (stats_chart_ref.current) {
            const resizeChart = () => {
                const dom_rect  = stats_chart_ref.current.getBoundingClientRect();
                let new_width   = dom_rect.width
                let new_heigth  = new_width*6/16
                //console.log (`New size: (${new_width}, ${new_heigth})`)
                set_stats_desc ((desc) => {return {...desc, width:new_width, height:new_heigth}})
            }
            window.addEventListener("resize", resizeChart);
            resizeChart ();

            return () => {
                window.removeEventListener("resize", resizeChart, false);
            }
        }
    }, [stats_chart_ref])
    

    const series    = React.useMemo(
        () => {
            return [
                {
                    name    : "Average",
                    data    : _.map (stats_chart_desc.data, (item) => item)
                }
            ]
            /*return [{
                name: 'PRODUCT A',
                data: [44, 55, 41, 67, 22, 43]
              }, {
                name: 'PRODUCT B',
                data: [13, 23, 20, 8, 13, 27]
              }, {
                name: 'PRODUCT C',
                data: [11, 17, 15, 15, 21, 14]
              }, {
                name: 'PRODUCT D',
                data: [21, 7, 25, 13, 22, 8]
              }]*/
        }
    )


    const create_button = (item, idx) => {
        return (
            <ToggleButton variant="outline-light" type="radio"
                            className={`m-2 ${filter_grain==item.value ?
                                                "shadow text-primary" : "text-dark"}`}
                            id={`filter-btn-${item.id}`} key={`filter-btn-${item.id}`}
                            onChange={(e) => {set_filter_grain(item.value)}}>
                {item.content}
            </ToggleButton>
        )
    }

    const date_calculator   = () => {
        let start_date_str  = ""
        let end_date_str    = ""
        if (filter_grain == 2) {
            // Displaying only month and year
            start_date_str  = start_date==null?``:`${start_date.getMonth()+1}/${start_date.getFullYear()}`
            end_date_str    = end_date==null?``:` - ${end_date.getMonth()+1}/${end_date.getFullYear()}`
        }
        else {
            start_date_str  = start_date==null?``:`${start_date.getDate()}/${start_date.getMonth()+1}/${start_date.getFullYear()}`
            end_date_str    = end_date==null?``:` - ${end_date.getDate()}/${end_date.getMonth()+1}/${end_date.getFullYear()}`
        }
        return `${start_date_str}${end_date_str}`
    }


    const chart_provider    = (data) => {
        // console.log (`I'm chart provider`)
        // console.log (data)

        if (data == undefined) {
            return (<Spinner className="mt-5" animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
            </Spinner>)
        }
        else if (data.length == 0) {
            console.log (`Zero data!`)
            return (<strong className="text-warning mt-5">No data in selected interval</strong>)
        }
        else {
            return (<Chart type="bar" options={stats_chart_options} series={series} width={stats_chart_desc.width} height={stats_chart_desc.height}/>)
        }
    }


    return (
        <Container>
            <Navbar className="bg-light d-flex justify-content-end">
                {
                    _.map (buttons_descriptors, (item, idx) => {
                        return create_button (item, idx)
                    })
                }
                <div className="m-2">
                    <style>{DatePickerStyle.toString()}</style>
                    {/*DATE PICKER*/}
                    <DatePicker
                        showMonthYearPicker={filter_grain==2}
                        selectsRange={true}
                        startDate={start_date}
                        endDate={end_date}
                        onChange    = {(new_range) => {
                            set_date_range (new_range)
                        }} 
                        isClearable={true}
                        customInput={
                            <InputGroup>
                                    <InputGroup.Text>Period Range</InputGroup.Text>
                                    <FormControl onChange={() => {/*Do nothing*/}}
                                                    value={date_calculator()}/>
                            </InputGroup>
                        }
                    />
                </div>
            </Navbar>

            <Container className="d-flex justify-content-center">
                {chart_provider (stats_chart_desc.data)}
            </Container>
        </Container>
    )
}