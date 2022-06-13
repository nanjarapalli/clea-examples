
import "core-js/stable"
import "regenerator-runtime/runtime"
import React, { Fragment } from "react";
import { Button, Col, Container, Card, Row, InputGroup, FormControl, ToggleButton,
            ToggleButtonGroup, Spinner, Navbar, Nav} from "react-bootstrap";
import { FormattedMessage } from "react-intl";
import Chart from "react-apexcharts";
import DatePicker from "react-datepicker";
import DatePickerStyle from "react-datepicker/dist/react-datepicker.css";
import {BsSunFill, BsMoonFill} from 'react-icons/bs';
import _ from 'lodash';

// Global variables




export const MainApp = ({astarteClient, deviceId}) => {
    const infoColor     = "#0dcaf0";
    const dayColor      = "#ffc107";
    const nightColor    = "#020079";

    // Top part: external sensors cards
    const externalSensorsDescriptors    = {
        temperature     : {
                            value           : React.useState(null),
                            displayValue    : (currValue) => {return currValue==null ? "Unknown" : currValue},
                            text            : "Temperature",
                            className       : (currValue) => {return "card-info rounded"}
                        },
        windSpeed      : {
                            value           : React.useState(0),
                            displayValue    : (currValue) => {return currValue==null ? "Unknown" : currValue},
                            text            : "Wind speed",
                            className       : (currValue) => {return "card-info rounded"}
                        },
        refSolarCell    : {
                            value           : React.useState(0),
                            displayValue    : (currValue) => {return currValue==null ? "Unknown" : currValue},
                            text            : "Reference solar cell",
                            className       : (currValue) => {return "card-info rounded"}
                        },
        partOfTheDay    : {
                            value           : React.useState(1),
                            displayValue    : (currValue) => {return currValue==0 ? <BsMoonFill size={43} color="white"/>
                                                                                    : <BsSunFill size={43} color="white"/>},
                            text            : "Day/Night",
                            className       : (currValue) => {return (currValue==0 ? "card-night" : "card-day") + " rounded"}
        }
    }

    // Bottom part: statistics chart
    const [statsSource, setStatsSource] = React.useState(0);
    const chartContainerRef             = React.useRef(null);
    const chartRef                      = React.useRef(null);
    const [chartReady, setChartReady]   = React.useState(false);
    const [chartDesc, setChartDesc]     = React.useState({ height: 350, data: [] });


    const getChartWidth = () => {
        if (chartReady) {
            const domRect   = chartRef.current.getBoundingClientRect();
            return domRect.width;
        }
        return 550;
    }


    // Handling statsSource update
    React.useEffect(() => {
        console.log (`statsSource changed: ${statsSource}`)
    }, [statsSource]);


    React.useEffect(() => {
        console.log (chartContainerRef)
        console.log (chartContainerRef.current)
    }, [chartContainerRef]);


    React.useEffect(() => {
        if (chartContainerRef.current) {
            console.log (`Setting up resize..`)
            const resizeChart   = () => {
                console.log (`Resizing!`)
                const domRect   = chartContainerRef.current.getBoundingClientRect()
                let newHeight   = domRect.width*6/16
                console.log (`w: ${domRect.width}\th:${newHeight}`)
                setChartDesc (desc  => {
                    return {...desc, height:newHeight}
                })
            }
            window.addEventListener("resize", resizeChart);

            return () => {
                window.removeEventListener("resize", resizeChart, false);
            }
        }
    }, [chartContainerRef]);


    return (
        <div className="p-4">
            <Container fluid>
                {/* External sensors cards */}
                <Row>
                    {_.map (externalSensorsDescriptors, (item, idx) => {
                        return (
                            <Col sm={6} md={3} key={idx}>
                                <Card className={item.className(item.value[0])}>
                                    <Card.Body>
                                        <div className="card-container">
                                            <div>
                                                <div className="card-title">{item.text}</div>
                                                <div className="d-flex justify-content-end card-value">{item.displayValue(item.value[0])}</div>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        )
                    })}
                </Row>

                <Row className="mt-5">
                    <Col sm={2} md={2}>
                        <Card>
                            <Nav variant="pills" defaultActiveKey="0" className="flex-column"
                                onSelect={(eventKey) => {setStatsSource(eventKey)}}>
                                <Nav.Item className="p-2">
                                    <Nav.Link eventKey="0">Solar Panel</Nav.Link>
                                </Nav.Item>

                                <Nav.Item className="p-2">
                                    <Nav.Link eventKey="1">Battery</Nav.Link>
                                </Nav.Item>

                                <Nav.Item className="p-2">
                                    <Nav.Link eventKey="2">Eectrical Load</Nav.Link>
                                </Nav.Item>
                            </Nav>
                        </Card>
                    </Col>
                    
                    <Col sm={10} md={10}>
                        <Card>
                            <Container className="d-flex justify-content-center" ref={chartContainerRef}>
                                {(chartDesc.data == null || chartDesc.data.length == 0) ?
                                        (
                                            <Spinner className="m-5" animation="border" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </Spinner>
                                        )
                                        :
                                        <DataChart></DataChart>
                                    }
                            </Container>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}








// ================================================================ //
// ================================================================ //
// ================================================================ //
// ================================================================ //








/*  =====================================
            ASTARTE DATA HANDLERS
    ===================================== */

// TODO




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
        }
    },
    yaxis: {
        labels: {
            formatter: function (val) {
                return (val).toFixed(0);
            },
        },
    }
};


// Function that act as a component
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
    chart   : {
        id      : 'stats-chart',
        type    : 'bar',
        toolbar: {
            show : false,
            autoSelected: 'pan'
        }
    },
    stroke: {
        width: [2, 2],
        curve: 'smooth'
    },
    colors: ['#FF8300'],
    title: {
        show    : false
    },
    /*Has to be shown?
    tooltip: {
        shared: false,
        y: {
            formatter: function (val) {
                return (val).toFixed(0)
            }
        }
    },*/
    xaxis: {
        labels: {
            formatter: (t) => {
                // TODO CHeck 'date_range' value to return the correct value
                //console.log (t)
                return t.toFixed(0)
            }
        }
    }
}


// Function that act as a component
const StatsChart    = ({astarte_client, device_id, stats_chart_ref}) => {
    const [stats_chart_desc, set_stats_desc]    = React.useState ({data:[], width:0, height:0})
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
    }


    const data_analyzer     = (data) => {
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
        let item_per_unit   = []
        let results         = []
        
        
        if (filter_grain == 0) {
            // Analyzing data basing on hours
            for (let i=0; i<24; i++) {
                results[i]          = 0
                item_per_unit[i]    = 0
            }

            _.map (data, (item, idx) => {
                let curr_date   = new Date (item["timestamp"])
                let item_hour   = Number (curr_date.toLocaleTimeString([], {hour: '2-digit'}))
                results[item_hour] += item['people_count']
                item_per_unit[item_hour] += 1
            })
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
                console.log (`item_day: ${item_day}`)
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
                console.log (`item_day: ${item_date}`)
            })
        }
        else {
            console.error (`Invalid filter_grain value: ${filter_grain}`)
        }

        results = _.map (item_per_unit, (item, idx) => {
            return {
                x:idx,
                y:item==0 ? 0 : Number((results[idx]/item).toFixed(2))}
        })

        /*console.log ('data_analyzer results:')
        console.log (results)*/

        return results
    }


    React.useEffect (() => {
        console.log (`sd: ${start_date}`)
        console.log (`ed: ${end_date}`)
        
        if (start_date != null && end_date != null) {
            range_normalizer ()
            console.log (`Reloading stats data from ${start_date} to ${end_date}`)
            let query_params    = {
                deviceId    : device_id,
                since       : start_date,
                to          : end_date
            }
            //set_stats_data (() => undefined)

            /*console.log ("query_params")
            console.log (query_params)*/
            //astarte_client.getCameraData (query_params)
            astarte_client.getMultipleCameraData (query_params)
            .then ((data) => {
                /*console.log ("Retrieved this information")
                console.log (data)*/

                // set_stats_data (()=>data_analyzer(data))
                set_stats_desc ((desc) => {return {...desc, data:data_analyzer(data)}})
            })
            .catch ((err) => {
                console.error (`Cannot retrieve data fro msuch period`)
                // set_stats_data ([])
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
        console.log (`Called effect!\n\n`)
        if (stats_chart_ref.current) {
            const resizeChart = () => {
                const dom_rect  = stats_chart_ref.current.getBoundingClientRect();
                let new_width   = dom_rect.width
                let new_heigth  = new_width*6/16
                console.log (`New size: (${new_width}, ${new_heigth})`)
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
            console.log (`Undefined data!`)
            return (<Spinner className="mt-5" animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
            </Spinner>)
        }
        else if (data.length == 0) {
            console.log (`Zero data!`)
            return (<strong className="text-warning mt-5">No data in selected interval</strong>)
        }
        else {
            console.log (`${data.length} items`)
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
                                    <FormControl aria-label="Minutes"
                                                    onChange={() => {/*Do nothing*/}}
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