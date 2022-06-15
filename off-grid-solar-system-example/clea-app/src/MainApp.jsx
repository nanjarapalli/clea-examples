
import "core-js/stable"
import "regenerator-runtime/runtime"
import React, { Fragment } from "react";
import { Button, Col, Container, Card, Row, InputGroup, FormControl, ToggleButton,
            ToggleButtonGroup, Spinner, Navbar, Nav, ButtonGroup, ButtonToolbar} from "react-bootstrap";
import { FormattedMessage } from "react-intl";
import Chart from "react-apexcharts";
import DatePicker from "react-datepicker";
import DatePickerStyle from "react-datepicker/dist/react-datepicker.css";
import {BsSunFill, BsMoonFill} from 'react-icons/bs';
import {FaRegCalendarAlt} from 'react-icons/fa';
import _, { first } from 'lodash';

// Global variables
const EXTERNAL_SENSORS_UPDATE_DELAY_MS  = 4000;
const STATISTICS_RETRIEVER_DELAY_MS     = 60000;
const MS_IN_A_MINUTE                    = 60*1000
const MS_IN_10_MINUTES                  = 10*60*1000
const MS_IN_AN_HOUR                     = 60*60*1000
const MS_IN_12_HOURS                    = 12*60*60*1000
const MS_IN_24_HOURS                    = 24*60*60*1000
const MS_IN_7_DAYS                      = 7*24*60*60*1000
let statisticsRetrieverTimer            = null;




export const MainApp = ({astarteClient}) => {
    const infoColor     = "#0dcaf0";
    const dayColor      = "#ffc107";
    const nightColor    = "#020079";

    // ========    Top part: external sensors cards
    const externalSensorsDescriptors    = {
        temperature     : {
                            value           : React.useState(null),
                            valueTimestamp  : React.useState(null),
                            text            : "Temperature",
                            lastUpdate      : new Date(),
                            query           : (date) => {return astarteClient.getTemperature(date)},
                            displayValue    : (currValue) => {return currValue==null ? "Unknown" : currValue+"°"},
                            className       : (currValue) => {return "card-info rounded shadow"}
                        },
        windSpeed      : {
                            value           : React.useState(null),
                            valueTimestamp  : React.useState(null),
                            text            : "Wind Velocity",
                            lastUpdate      : new Date(),
                            query           : (date) => {return astarteClient.getWindSpeed(date)},
                            displayValue    : (currValue) => {return currValue==null ? "Unknown" : currValue+" m/s"},
                            className       : (currValue) => {return "card-info rounded shadow"}
                        },
        refSolarCell    : {
                            value           : React.useState(null),
                            valueTimestamp  : React.useState(null),
                            text            : "Reference Electrical Current",
                            lastUpdate      : new Date(),
                            query           : (date) => {return astarteClient.getReferenceCellCurrent(date)},
                            displayValue    : (currValue) => {return currValue==null ? "Unknown" : currValue+" A"},
                            className       : (currValue) => {return "card-info rounded shadow"}
                        },
        dayPeriod       : {
                            // TODO Handle unknown value of day period
                            value           : React.useState(1),
                            valueTimestamp  : React.useState(null),
                            text            : "Day / Night",
                            lastUpdate      : new Date(),
                            query           : (date) => {return astarteClient.getDayPeriod(date)},
                            displayValue    : (currValue) => {return currValue==0 ? <BsMoonFill size={43} color="white"/>
                                                                                    : <BsSunFill size={43} color="white"/>},
                            className       : (currValue) => {return (currValue==0 ? "card-night" : "card-day") + " rounded shadow"}
        }
    }

    // ========    Bottom part: statistics selectors
    const statsSourceSelectors          = {
        solarPanel      : {
            onClick : (evt) => {setStatsSource(Number(evt.target.value))},
            value       : 0,
            text        : "Solar Panel"
        },
        battery         : {
            onClick : (evt) => {setStatsSource(Number(evt.target.value))},
            value   : 1,
            text    : "Battery"
        },
        electricalLoad  : {
            onClick : (evt) => {setStatsSource(Number(evt.target.value))},
            value   : 2,
            text    : "Electrical Load"
        }
    }
    const [statsSource, setStatsSource] = React.useState(0);
    const statsData                     = [
        {   // 0: solarPanel
            dataRetrieverCallback   : (since, to) => {return astarteClient.getSolarPanelData(since, to)},
            /*startDate               : null,
            endDate                 : null,
            data                    : null*/
        },
        {   // 1: battery
            dataRetrieverCallback   : (since, to) => {return astarteClient.getBatteryData(since, to)},
            /*startDate               : null,
            endDate                 : null,
            data                    : null*/
        },
        {   // 2: electricalLoad
            dataRetrieverCallback   : (since, to) => {return astarteClient.getElectricalLoadData(since, to)},
            /*startDate               : null,
            endDate                 : null,
            data                    : null*/
        }
    ]
    
    // ========    Bottom part: chart filters buttons
    const controlButtonsDescriptors       = {
        unitSelectors : [
            {name:"Electricity", value:0},
            {name:"Voltage", value:1},
            {name:"All", value:2},
        ],
        periodSelectors : [
            {name:"Day", value:0},
            {name:"Week", value:1},
            {name:"Month", value:2},
            // FIXME {name:"Year", value:3},
        ]
    }
    const [shownUnit, setShownUnit]     = React.useState(0);
    const [shownPeriod, setShownPeriod] = React.useState(0);
    const [dateRange, setDateRange]     = React.useState([new Date(new Date().getTime() - MS_IN_24_HOURS), new Date()]);
    const [startDate, endDate]          = dateRange;
    let dateChanged                     = false;            // FIXME If date change, automatic data increment aren't performed

    // ========    Bottom part: chart
    const chartContainerRef             = React.useRef(null);
    const [chartReady, setChartReady]   = React.useState(false);
    const [chartDesc, setChartDesc]     = React.useState({width:0, height: 0, rawData: []});


    // =============================
    // ========    Utility functions

    const createButtonGroup = (buttonGroup, idxPrefix, stateVar, setStateVar) => {
        return (
        <ButtonGroup className="text-center mb-3">
            {buttonGroup.map((el, idx) => (
                <ToggleButton variant='light' key={`${idxPrefix}-${idx}`} id={`${idxPrefix}-${idx}`}
                    type='radio' name={el.name} value={el.value}
                    checked={el.value === stateVar}
                    ref={el.button_ref}
                    onChange={(e) => {setStateVar(el.value)}}>
                        {el.name}
                </ToggleButton>)
            )}
        </ButtonGroup>)
    }


    /*FIXME Remove me!
    const getChartWidth = () => {
        if (chartReady) {
            const domRect   = chartRef.current.getBoundingClientRect();
            return domRect.width;
        }
        return 550;
    }*/

    
    const externalSensorsUpdater    = (firstTime) => {
        let itemStatusUpdater   = (sensorItem, newItem) => {
            sensorItem.lastUpdate   = new Date()
            sensorItem.value[1] (newItem.sensorValue)
            sensorItem.valueTimestamp[1] (new Date (newItem.timestamp))
        }

        if (firstTime) {
            // Searching data until 7 days ago
            let sinceTreshold           = new Date (new Date().getTime() - (MS_IN_7_DAYS))

            _.map (externalSensorsDescriptors, async (item, idx) => {
                let response    = []
                let since       = new Date();
                while (response.length==0 && since>sinceTreshold) {
                    try {
                        since       = new Date(since.getTime() - MS_IN_24_HOURS)
                        console.log (`Searching data from ${since}`)
                        response    = await item.query(since);
                    } catch (err) {console.warn ("catched error!")}
                }

                if (response.length == 0) {
                    console.warn (`No data until 7 days!`)
                }
                else {
                    // Updating item status
                    itemStatusUpdater (item, response[response.length-1])
                }
            })
        }
        
        
        else {
            _.map (externalSensorsDescriptors, async (item, idx) => {
                try {
                    let response    = await item.query(item.lastUpdate);
                    // Updating item status
                    itemStatusUpdater (item, response[response.length-1])
                } catch (err) {}
            })
        }
    }


    const statisticsRetriver        = async () => {
        // FIXME Update data only if currDate is comprised between startDate and endDate
        // FIXME If 'dateChanged == false', adjust start and end date!

        console.log (`============================\nCall of statisticsRetriever\n============================`)
        let dataItem    = statsData[statsSource];

        try {
            let response    = await dataItem.dataRetrieverCallback (startDate, endDate)
            dataItem.data   = response;
        } catch (err) {
            console.warn (`Catched error: ${err}`)
            dataItem.data   = []
        }

        // Updating chartDesc.data entry
        setChartDesc ((desc) => {return {...desc, rawData:dataItem.data}})
    }


    const setupListeners    = () => {

        externalSensorsUpdater (true);
        // Setting up interval to retrieve exteenal sensors values
        setInterval (externalSensorsUpdater, EXTERNAL_SENSORS_UPDATE_DELAY_MS, false);

        
        // Retrieve current data basing on source, and period
        statisticsRetriver();
        // Register interval to retrieve new data
        statisticsRetrieverTimer = setInterval (statisticsRetriver, STATISTICS_RETRIEVER_DELAY_MS);
    }


    const lastUpdateToString    = (date) => {
        let delayValue  = "Unknown"
        if (date) {
            let currDate    = new Date()
            delayValue      = "Last update: "
            if (date.getTime() > currDate.getTime()-MS_IN_A_MINUTE)
                delayValue += "less than 1 minutes ago"
            else if (date.getTime() > currDate.getTime()-MS_IN_10_MINUTES)
                delayValue += "less than 10 minutes ago"
            else if (date.getTime() > currDate.getTime()-MS_IN_AN_HOUR)
                delayValue += "less than an hour ago"
            else if (date.getTime() > currDate.getTime()-MS_IN_12_HOURS)
                delayValue += "less than 12 hours ago"
            else if (date.getTime() > currDate.getTime()-MS_IN_24_HOURS)
                delayValue += "less than 24 hours ago"
            else if (date.getTime() > currDate.getTime()-MS_IN_7_DAYS)
                delayValue += "less than 7 days ago"
            else
                delayValue += "more than 7 days ago"
        }

        return delayValue
    }


    const rangeToString = (range) => {
        let startDateString = startDate ? startDate.toDateString() : "";
        let endDateString   = endDate ? endDate.toDateString() : "";
        return `${startDateString}   -   ${endDateString}`
    }


    const dateUpdater   = (range) => {
        console.log ("==================\nDATA CHANGED!!!!!!\n==================")
        dateChanged = true;
        let sd  = range[0]
        let ed  = range[1]
        if (ed) {
            ed.setHours (23)
            ed.setMinutes (59)
            ed.setSeconds(59)
            ed.setMilliseconds (999)
        }
        setDateRange ((oldRange) => {return [sd, ed]})
    }




    // =========================
    // ========    Data handlers

    // Handling statsSource, showUnit and showPeriod variables update
    React.useEffect(() => {
        console.log (`Something changed: (entually) reloading displayed data!\n\
\tstatsSource: ${statsSource}\n\tshowUnit: ${shownUnit}\n\tshowPeriod: ${shownPeriod}\n\tdateRange: [${endDate}, ${startDate}]`)

        clearInterval (statisticsRetrieverTimer);
        statisticsRetriver ();
        statisticsRetrieverTimer    = setInterval (statisticsRetriver, STATISTICS_RETRIEVER_DELAY_MS);
    }, [statsSource, shownUnit, shownPeriod, dateRange]);


    React.useEffect(() => {
        if (chartContainerRef.current) {
            const resizeChart   = () => {
                const domRect   = chartContainerRef.current.getBoundingClientRect()
                let newWidth    = domRect.width
                let newHeight   = newWidth*6/16
                console.log (`w: ${newWidth}\th:${newHeight}`)
                setChartDesc (desc  => {
                    return {...desc, width:newWidth, height:newHeight}
                })
            }

            // Setting up
            setupListeners();

            window.addEventListener("resize", resizeChart);
            resizeChart();

            // Returning clean up function
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
                                                <div className="card-title mb-0 pb-0">{item.text}</div>
                                                <div className="card-subtitle mt-0 pt-0">{lastUpdateToString(item.valueTimestamp[0])}</div>
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
                    {/*Statistics source selector*/}
                    <Col sm={2} md={2}>
                        <Card className="ps-2 pe-2 pb-1 pt-1 shadow">
                            <Nav variant="pills" defaultActiveKey="0" className="flex-column">
                                {_.map (statsSourceSelectors, (item, idx) => {
                                    return (
                                    <Button className={(statsSource==item.value?"card-info" : "")+" m-2 d-flex justify-content-left"}
                                                key={idx} variant="" onClick={item.onClick} value={item.value}>
                                            {item.text}
                                        </Button>
                                    )
                                })}
                            </Nav>
                        </Card>
                    </Col>
                    
                    <Col sm={10} md={10}>

                        <Card className="p-3 shadow">
                            <Card.Body>
                                <ButtonToolbar className="d-flex justify-content-between">
                                    
                                    <div>
                                        {/*ELECTRICITY, VOLTAGE, ALL buttons*/}
                                        {createButtonGroup (controlButtonsDescriptors.unitSelectors,
                                                                "us", shownUnit, setShownUnit)}
                                    </div>

                                    <div className="d-flex justify-content-between">
                                        {/*DATE SELECTOR buttons*/}
                                        {createButtonGroup (controlButtonsDescriptors.periodSelectors,
                                                                "ps", shownPeriod, setShownPeriod)}

                                        {/*DATE PICKER*/}
                                        <style>{DatePickerStyle.toString()}</style>
                                        <DatePicker
                                            showMonthYearPicker={shownPeriod==2}
                                            selectsRange={true}
                                            startDate={startDate}
                                            endDate={endDate}
                                            onChange= {dateUpdater}
                                            className="mb-3 ms-5"
                                            customInput={
                                                <Button variant='light'>
                                                    <FaRegCalendarAlt size={20}/>
                                                </Button>
                                            }
                                        />
                                    </div>
                                
                                </ButtonToolbar>

                                <div className="d-flex justify-content-end pe-3">
                                    {rangeToString(dateRange)}
                                </div>

                                <Container className="d-flex justify-content-center" ref={chartContainerRef}>
                                    <DataChart data={chartDesc.rawData} width={chartDesc.width}
                                                height={chartDesc.height}/>
                                </Container>
                            </Card.Body>
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

// TODO Customize chart settings
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
            show: false
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


const DataChart = ({data, width, height}) => {

    // TODO Display data correctly
    if (!data) {
        console.log (`No data exist`)

        return (
            <Spinner className="m-5" animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
            </Spinner>
        );
    }

    const series = React.useMemo(
        () => {
            console.log (`--> Displaying retrieved data`)
            console.log (data)
            
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