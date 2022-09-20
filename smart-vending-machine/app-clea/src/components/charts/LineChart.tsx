import React from "react";

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ScatterDataPoint, TimeScale, Tick, TooltipItem} from "chart.js";
import { Bar, Line, Scatter, Chart } from "react-chartjs-2";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { collapseTextChangeRangesAcrossMultipleVersions } from "typescript";
import moment, { defineLocale } from "moment"

ChartJS.register(TimeScale, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ChartDataLabels);   // FIXME


export enum XAxisGranularity {
    HOURS = "hours",
    DAYS  = "days",
    MONTHS = "months"

}
export type DataPoint = {
    x: number;
    y: number;
};
export type Dataset = {
    granularity : XAxisGranularity
    label : string,
    color : string,
    points : DataPoint[]
};
type ChartProps = {
    datasets: Dataset[];
    measure?: string;
    legend?: boolean;
};
type DatasetItem = {
    label: string,
    showLine: boolean,
    borderColor: string,
    backgroundColor: string
}
type DatasetDescriptor = {

}
type ScatterChartDescriptor = {
    options : {
        interaction : {
            intersect : boolean,
            mode : string
        }
    },
    datasets : ScatterDataPoint []
}


const LineChart = ( { datasets, measure="", legend=true } : ChartProps) : JSX.Element => {
    
    console.log (datasets)
    console.log ("Displaying previously printed data..\n\n\n")

    
    
    const get_tooltip_content   = (name:string, x:number, y:number, granularity:XAxisGranularity) => {
        console.log (`[gtc] ${name}  (${moment(x).get('month')} , ${y})`)
        switch (granularity) {
            case XAxisGranularity.HOURS :
                return `${name}  (${moment(x).format(`HH:mm`)} , ${y})`
                case XAxisGranularity.DAYS :
                return `${name}  (${moment(x).format(`MM/DD`)} , ${y})`
            case XAxisGranularity.MONTHS :
                return `${name}  (${moment(x).get('month')} , ${y})`
                default : {
                    console.error (`Wrong granularity value:\n${granularity}`)
                    return `${name}  (${moment(x).format(`MM/DD`)} , ${y})`
                }
            }
            
        }
        
        const get_xaxis_ticks   = (value:number, granularity:XAxisGranularity) => {
        console.log (`[gxt] (${moment(value).get('month')} , ${granularity})`)
        switch (granularity) {
            case XAxisGranularity.HOURS :
                return moment(value).format("HH:mm")
            case XAxisGranularity.DAYS :
                return moment(value).format('MM/DD')
            case XAxisGranularity.MONTHS :
                return moment(value).get('month')
            default : {
                console.error (`Wrong granularity value:\n${granularity}`)
                return moment(value).format('MM/DD')
            }
        }
    }
    
    let values  = datasets.map ((v, i , ds) => {
        return {
            label: v.label,
            showLine: true,
            borderColor: v.color,
            backgroundColor: v.color,
            data: v.points,
            pointRadius: 5,
            pointHoverRadius: 12
        }
    })

    const scatter_data = {
        options: {
            scales: {
                x: {
                    ticks: {
                        callback: function(value:any | string, index: number, values:Tick[]) {
                            return get_xaxis_ticks (value*1000, datasets[0].granularity)
                        }
                    },
                    grid: {
                        display: false,
                        drawBorder: false,
                        drawOnChartArea: false,
                        drawTicks: false,
                    }
                }
            },
            plugins : {
                datalabels: {
                    display: false,
                },
                tooltip : {
                    callbacks : {
                        label : (it : any) => {
                            console.log (it)
                            return get_tooltip_content (it.dataset.label, it.raw.x*1000, it.raw.y, datasets[0].granularity)
                        }
                    }
                }
            }
        },
        datasets: values,
    }

    return (
        <>
            <Scatter data={scatter_data} options={scatter_data.options}/>
        </>
    )

    /*const labels = datasets[0].points.map((point) => point.label);
    const data = {
        labels,
        datasets: datasets.map((dataset) => {
        return {
            label: dataset.name,
            backgroundColor: dataset.color,
            data: dataset.points.map((point) => point.value),
        };
        }),
    };

    const line_options = {
        responsive: true,
        plugins: {
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            text: 'Chart.js Line Chart'
        }
        }
    }

    const options: any = {
        responsive: true,
        plugins: {
            legend: {
              display: legend
            },
            datalabels: {
              display: true,
              color: "black",
              align: "end",
              anchor: "end",
              clamp: true,
              clip: false,
              padding: {
                right: 2
              },
              labels: {
                padding: { top: 10 },
                title: {
                  font: {
                    weight: "bold"
                  }
                },
                value: {
                  color: "green"
                }
              },
              formatter: function (value: string) {
                return "\n" + value;
              }
            }
        },
        scales: {
            units: {
                display: true,
                grace: '10%',
                position: "left" as const,
                ticks: {
                  callback: (val: any) => {
                    return val + measure;
                  },
                },
            },
        }
      };*/
















      /*const line_labels = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
      const line_data = {
          labels: line_labels,
          datasets: [
              {
                  label: 'Dataset 1',
                  data: [10, 20, 10, 40, 50, 32, -1],
                  borderColor: 'red',
                  backgroundColor: 'yellow',
              },
              {
                  label: 'Dataset 2',
                  data: [-1, 25, 30, 10, 48, 20, -5],
                  borderColor: 'blue',
                  backgroundColor: 'green',
              }
          ]
      };

    return (
        <>
            <Line data={line_data} />
        </>
    )*/













    /*const chartData = {
        options: {
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins:{
                title: {
                    text: 'Chart.js Time Scale',
                    display: true
                  }
            },
            scales:{
                x:{
                    ticks: {
                        callback: (v:any, i:any, vs:any) => {
                            console.log (`Representing ${v}`)
                            return v;
                        }
                    }
                }
            }
        },
        datasets: [{
            label : 'lol',
            borderColor : 'red',
            backgroundColor : 'blue',
            showLine : true,
            data : [{x:1663569824,y:20},{x:1663569838, y:30}]
        }]
    }

    chartData.datasets[0].data.push ({x:1663569858, y:15})
    
    return (
        <>
            <Scatter data={chartData}/>
        </>
    )*/












    /*const scatter_data = {
        options: {
            scales: {
                x: {
                    ticks: {
                        // Include a dollar sign in the ticks
                        callback: function(value:number | string, index: number, values:Tick[]) {
                            return moment(value).format("DD/MM/YY - hh:mm:ss");
                        }
                    },
                    grid: {
                        display: false,
                        drawBorder: false,
                        drawOnChartArea: false,
                        drawTicks: false,
                      }
                }
            },
            plugins : {
                tooltip : {
                    callbacks : {
                        label : (it : any) => {
                            let  final = Number(it.label.replace(/\./g,""))
                            return `${moment(final).format('hh:mm')}` // moment(it.label).format('hh:mm')
                        }
                    }
                }
            }
        },
        datasets: [{
            label: 'Scatter Dataset 0',
            showLine: true,
            borderColor: 'red',
            data: [{
                x: 1499516102000,
                y: 23.375
            }, {
                x: 1499516402000,
                y: 23.312
            }, {
                x: 1499516702000,
                y: 23.312
            }, {
                x: 1499517002000,
                y: 23.25
            }
            ],
            backgroundColor: 'red'
        }],
    }

    return (
        <>
            <Scatter data={scatter_data} options={scatter_data.options}/>
        </>
    )*/













    // const line_data = {
    //     datasets : [{
    //         backgroundColor: `red`,
    //         borderColor: `red`,
    //         fill: false,

    //         data: [
    //             {x: moment("2017-07-08T06:15:02-0600"), y: 23.375},
    //             {x: moment("2017-07-08T06:20:02-0600"),y: 23.312},
    //             {x: moment("2017-07-08T06:25:02-0600"),y: 23.312},
    //             {x: moment("2017-07-08T06:30:02-0600"),y: 23.25}
    //           ],
    //         }
    //     ]
    // }

    // const line_options = {
    //     plugins: {
    //         title: {
    //           text: 'Chart.js Time Scale',
    //           display: true
    //         }
    //       },
    //       scales: {
    //         x: {
    //         //   type: 'time',
    //          time: {
    //             tooltipFormat: 'DD T'
    //           },//*/
    //           title: {
    //             display: true,
    //             text: 'Date'
    //           },
    //           ticks:{
    //             callback: (v:string | number, i:number, vs:any) => {
    //                 console.log (`===================${v}`)
    //                 return v
    //             }
    //           }
    //         },
    //         y: {
    //           title: {
    //             display: true,
    //             text: 'value'
    //           }
    //         }
    //       },
    // }

    // return (
    //     <>
    //         <Line options={line_options} data={line_data}/>
    //     </>
    // )
}

export default LineChart