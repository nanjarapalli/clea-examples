import React, { useState, useEffect, useRef, forwardRef, useReducer } from "react"
import { FormattedMessage, useIntl } from "react-intl";
import CSS from 'csstype';

import moment from "moment"
import { TransactionData, DeviceEntry, BeverageFromLongToShort, RejectedTransactionData } from "../../types";
// @ts-ignore
import DateRangePicker from "@wojtekmaj/react-daterange-picker";

import LineChart, { Dataset, DataPoint, XAxisGranularity } from "../charts/LineChart"
import AstarteClient from "../../AstarteClient";


// --------- STYLE ---------
const subCardStyle: CSS.Properties = {
    backgroundColor: "#f8f9fa",
    borderRadius: "12px",
}

// -------- Chart var -------
const labels = Object.keys(BeverageFromLongToShort);;
const colors = ["red", "blue", "yellow", "green", "pink", "cyan", "orange", "lime", "grape", "indigo", "teal", "violet"];

// -------- Date ----------
type DateRange = {
    start: number;
    end: number;
};
const printRange = (prefix:string, range:DateRange) : void => {
    console.log (`[${prefix}]  ${moment(range.start*1000).format('D.M.Y')}  -->  ${moment(range.end*1000).format('D.M.Y')}`)
}
enum DateGranularity {
    DAY = "day",
    WEEK = "week",
    MONTH = "month",
    YEAR = "year",
}
const SECONDS_IN_A_DAY = 86400;
const SECONDS_IN_A_MONTH = 2678400;

const inferXAxisGranularity = (start:number, end:number): XAxisGranularity => {
    let granularity : XAxisGranularity
    let diff = end - start;
    // printRange ('I', {start:start, end:end})
    // console.log (`Diff ${diff}`)

    if (diff <= SECONDS_IN_A_DAY)
        granularity = XAxisGranularity.HOURS
    else if (diff <= SECONDS_IN_A_MONTH)
        granularity = XAxisGranularity.DAYS
    else
        granularity = XAxisGranularity.MONTHS

    return granularity
} 

const inferDateGranularity = (start: moment.Moment, end: moment.Moment): DateGranularity => {
    console.log (`Inferring from ${start} to ${end}`)
    const diffInDays = Math.abs(end.diff(start, "days"));
    if (diffInDays === 0) {
        return DateGranularity.DAY;
    }
    if (diffInDays < 7) {
        return DateGranularity.WEEK;
    }
    if (diffInDays < 31) {
        return DateGranularity.MONTH;
    }
    return DateGranularity.YEAR;
};
const getDateRange = (dateType: DateGranularity): DateRange => {
    let now = moment();
    switch (dateType) {
      case DateGranularity.DAY:
        return {start: moment(now).subtract(24, 'hours').unix(), end:now.unix()}
      case DateGranularity.WEEK:
        return { start: moment(now).subtract(7, "days").unix(), end: now.unix() };
      case DateGranularity.MONTH:
        return { start: moment(now).subtract(30, "days").unix(), end: now.unix() };
      case DateGranularity.YEAR:
        return { start: moment(now).subtract(365, "days").unix(), end: now.unix() };
    }
};




// ------- Chart Card ---------
type ChartData  = {
    transactions: TransactionData[]
    bleDevices: DeviceEntry[]
}
type ChartDataController = {
    data : ChartData,
    setter : React.Dispatch<React.SetStateAction<ChartData>>
}

type ChartCardProps = {
    dataController : ChartDataController,
    astarte : AstarteClient,
    deviceId: string
}

type ReducerAction = {
    type : string
}




const extract_new_dataset  = async (granularity:XAxisGranularity, transactions: Promise<TransactionData[]>,
                                    devices: Promise<DeviceEntry[]>, rejectedTransactions: Promise<RejectedTransactionData[]>) => {
    
    let mapper  = (granularity:XAxisGranularity, items:any[], itemHandler:(v:string[], t:any)=>void,
                    nonItemHandler:(v:any)=> any[]) => {
        let result : DataPoint[] = []

        switch (granularity) {
            case XAxisGranularity.HOURS : {
                let tmpMap  = new Map<number, string[]> ()        // time_span -> list of items
                items.forEach ((val, idx, arr) => {
                    let m_time  = moment (val.timestamp)
                    m_time.set ('millisecond', 0)
                    m_time.set ('second', 0)
                    m_time.set ('minute', 0)
                    let time_span = m_time.unix()
                    let currVal = tmpMap.get(time_span)
                    if (currVal != undefined && Array.isArray(currVal)) {
                        itemHandler (currVal, val)
                    }
                    else {
                        tmpMap.set(time_span, nonItemHandler(val))
                    }
                })
                tmpMap.forEach ((v, k, m) => {
                    result.push ({x:k, y:v.length})
                })
                break
            }
            case XAxisGranularity.DAYS : {
                let tmpMap  = new Map<number, string[]> ()        // time_span -> list of items
                items.forEach ((val, idx, arr) => {
                    let m_time  = moment (val.timestamp)
                    m_time.set ('millisecond', 0)
                    m_time.set ('second', 0)
                    m_time.set ('minute', 0)
                    m_time.set ('hour', 0)
                    let time_span = m_time.unix()
                    let currVal = tmpMap.get(time_span)
                    if (currVal != undefined && Array.isArray(currVal)) {
                        itemHandler (currVal, val)
                    }
                    else {
                        tmpMap.set(time_span, nonItemHandler(val))
                    }
                })
                tmpMap.forEach ((v, k, m) => {
                    result.push ({x:k, y:v.length})
                })
                break
            }
            case XAxisGranularity.MONTHS : {
                let tmpMap  = new Map<number, string[]> ()        // time_span -> list of items
                items.forEach ((val, idx, arr) => {
                    let m_time  = moment (val.timestamp)
                    m_time.set ('millisecond', 0)
                    m_time.set ('second', 0)
                    m_time.set ('minute', 0)
                    m_time.set ('hour', 0)
                    m_time.set ('day', 1)
                    let time_span = m_time.unix()
                    let currVal = tmpMap.get(time_span)
                    if (currVal != undefined && Array.isArray(currVal)) {
                        itemHandler (currVal, val)
                    }
                    else {
                        tmpMap.set(time_span, nonItemHandler(val))
                    }
                })
                tmpMap.forEach ((v, k, m) => {
                    result.push ({x:k, y:v.length})
                })
                break
            }
            default :
                console.error (`Wrong granularity value -> ${granularity}`)
        }

        return result
    }
    
    const new_datasets : Dataset[] = []

    new_datasets.push ({
        granularity : granularity,
        label : "Executed Transactions",
        color : 'green',
        points : mapper(granularity, await transactions,
                        (mapEntry, val) => {mapEntry.push (val)},
                        (val) => {return [val]}
        )
    })
    new_datasets.push ({
        granularity : granularity,
        label : "Devices",
        color : 'blue',
        points : mapper(granularity, await devices,
                        (mapEntry, val) => {if (val.mac==undefined) return; if (!mapEntry.includes(val.mac)) {mapEntry.push (val.mac)}},
                        (val) => {return (val.mac==undefined ? [] : [val.mac])}
        )
    })
    new_datasets.push ({
        granularity : granularity,
        label : "Rejected Transactions",
        color : 'red',
        points : mapper(granularity, await rejectedTransactions,
                        (mapEntry, val) => {mapEntry.push(val)},
                        (val) => {return [val]}
        )
    })

    return new_datasets;
}




const AudienceChartCard = ( params : ChartCardProps ) : JSX.Element => {

    const dataController = params.dataController
    const astarte = params.astarte
    const deviceId = params.deviceId

    
    // --------- DatePicker ----------
    const [dateGranularity, setDateGranularity] = useState<DateGranularity>(DateGranularity.DAY);
    const customDateRange = useRef<boolean>(false);
    const [dateRange, setDateRange] = useState<DateRange>(getDateRange(DateGranularity.DAY));

    useEffect(() => {
        data_retriever ()

        const t = setInterval(() => {
            if (customDateRange.current) {
                // FIXME update range if current date is comprised
                console.log ("Custom date range!!!!")
            }
            else {
                setDateRange (getDateRange(dateGranularity))
            }
        }, 20000);

        return () => {
            console.log ("-->  Clearing allocated resources  <--")
            clearInterval(t)
        }; // clear
      }, [] );


    // --------- Dataset -------------
    const [dataset, setDataset] = useState<Dataset[]>([]);
    
    // Trigger filtering on new Beverage or DateRange change
    useEffect(() => {
        data_retriever ()
    }, [dateRange, dateGranularity]);
    
    
    const units: { [key: string]: number } = {}
    const revenenues: { [key: string]: number } = {}
    const choicesPoints: DataPoint[] = []
    
    
    labels.forEach((label) => {
        units[label]=0
        revenenues[label]=0
    })
    
    // ----------------------
    const data_retriever    = async () => {
        console.log (`=====  Reloading data!  =====\n`)

        // Retrieving interesting information from Astarte
        let queryParams = {deviceId:deviceId, since:new Date(dateRange.start*1000), to:new Date(dateRange.end*1000)}
        const bleData = astarte.getBleData (queryParams)
        const transactionsData = astarte.getTransactionData (queryParams)
        const rejectedTransactions = astarte.getRejectedTransactions (queryParams)

        // Updating 'dataset' variable
        let new_datasets = await extract_new_dataset (inferXAxisGranularity(dateRange.start, dateRange.end),
                                                        transactionsData, bleData, rejectedTransactions)
        setDataset ((old_value) => {return new_datasets})
    }

    /*const data_updater = (state : number, action : ReducerAction) => {
        switch(action.type) {
            case "update": {
                data_retriever ()
                break
            }
            default:
                break
            }
        return state;
    }
    const [reducer, dispatch] = useReducer (data_updater, 0);*/


    return (
        <div className="card-custom">
            <div className="row pt-2">
                {/* Revenue - Quantity */}
                {/* <div className="col-auto">
                    <div className="py-1" style={subCardStyle}>
                        <div className="row justify-content-center">
                            <div className="col pe-0">
                                <button
                                className= {"btn text-center py-1 px-2 ms-1 " + ((currentDataType === DataType.UNITS) ? "button-style-active shadow-sm" : "button-style-disabled")}
                                onClick={() => setCurrentDataType(DataType.UNITS)}
                                >
                                    <FormattedMessage id="quantity" />                                                                
                                </button>
                            </div>
                            <div className="col">
                                <button 
                                className= {"btn text-center py-1 px-2 ms-1 " + ((currentDataType === DataType.REVENUES) ? "button-style-active shadow-sm" : "button-style-disabled")}
                                onClick={() => setCurrentDataType(DataType.REVENUES)}
                                >
                                    <FormattedMessage id="revenues" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div> */}
                {/* Day - Week - Month - Year */}
                <div className="col-auto ms-auto">
                    <div className="py-1 px-1" style={subCardStyle}>
                        <div className="row">
                            {/* Day */}
                            <div className="col pe-0">
                                <button 
                                className={"card btn ms-1 text-center " + ((dateGranularity === DateGranularity.DAY && !customDateRange.current) ? "button-style-active shadow-sm" : "button-style-disabled")}
                                onClick={() => {
                                    customDateRange.current = false;
                                    setDateRange(getDateRange(DateGranularity.DAY));
                                    setDateGranularity(DateGranularity.DAY);
                                }}
                                >
                                    Day
                                </button>
                            </div>
                            {/* Week */}
                            <div className="col px-0">
                                <button
                                className={"card btn ms-1 text-center " + ((dateGranularity === DateGranularity.WEEK && !customDateRange.current) ? "button-style-active shadow-sm" : "button-style-disabled")}
                                onClick={() => {
                                    customDateRange.current = false;
                                    setDateRange(getDateRange(DateGranularity.WEEK));
                                    setDateGranularity(DateGranularity.WEEK);
                                }}
                                >
                                    Week
                                </button>
                            </div>
                            {/* Month */}
                            <div className="col px-0">
                                <button
                                className={"card btn ms-1 text-center " + ((dateGranularity === DateGranularity.MONTH && !customDateRange.current) ? "button-style-active shadow-sm" : "button-style-disabled")}
                                onClick={() => {
                                    customDateRange.current = false;
                                    setDateRange(getDateRange(DateGranularity.MONTH));
                                    setDateGranularity(DateGranularity.MONTH);
                                }}
                                >
                                    Month
                                </button>
                            </div>
                            {/* Year */}
                            <div className="col ps-0">
                                <button
                                className={"card btn ms-1 text-center " + ((dateGranularity === DateGranularity.YEAR && !customDateRange.current) ? "button-style-active shadow-sm" : "button-style-disabled")}
                                onClick={() => {
                                    customDateRange.current = false;
                                    setDateRange(getDateRange(DateGranularity.YEAR));
                                    setDateGranularity(DateGranularity.YEAR);
                                  }}
                                >
                                    Year
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Calendar */}
                <div className="col-auto">
                    <div className="bg-light p-1 mt-1" style={subCardStyle}>
                    <DateRangePicker
                        value={[moment.unix(dateRange.start).toDate(), moment.unix(dateRange.end).toDate()]}
                        onChange={(range: any) => {
                            console.log (`=======================================================           Calendar range ${range}`)
                            if (range) {
                                customDateRange.current = true;
                                setDateRange({ start: moment(range[0]).unix(), end: moment(range[1]).unix() });
                                setDateGranularity(inferDateGranularity(moment(range[0]), moment(range[1])));
                            } else {
                                customDateRange.current = false;
                                setDateRange(getDateRange(DateGranularity.DAY));
                                setDateGranularity(DateGranularity.DAY);
                            }
                        }}
                    />
                    </div>
                </div>

            </div>

            
            <div className="row">
                {dataset.length && <LineChart datasets={dataset} legend={false} />}
            </div>
        </div>
    );
};

export default AudienceChartCard;