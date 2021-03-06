import React from 'react';
import {Bar} from 'react-chartjs-2';
import StatisticalFunctions from '../lib/StatisticalFunctions';

export default class Simulations extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      simulations: [],          // n simulations documenting the closing price at the end of that simulation
      numberOfSimulations: 1000,
      simulationsData: [
        {
          bin: Number,
          normdist: Number,
          normalDistribution: Number
        }
      ],
      simulationAnalysis: {
        mean: Number,
        median: Number,
        stdev: Number,
        min: Number,
        max: Number,
        range: Number,
        percentiles: {
          cur: Number,
          sd1: {
            low: Number,
            high: Number
          },
          sd2: {
            low: Number,
            high: Number
          },
          sd3: {
            low: Number,
            high: Number
          },
        }
      },
      histogram: []
    };
    this.utc = 0;
    this.open = 1;
    this.high = 2;
    this.low = 3;
    this.close = 4;
    this.volume = 5;

    this.jStat = require('jStat').jStat;
  }

  componentWillMount() {
      this.simulate(this.props);
  }

  componentWillReceiveProps(nextProps) {
      this.simulate(nextProps);
  }

  getChartData() {
    var histogramLabels = [];
    var normalDistributions = [];
    // cut the graph in half
    for (var j = 0; j < this.state.simulationsData.length / 2; j++) {
      if (!isNaN(this.state.simulationsData[j].bin))
        histogramLabels.push(this.state.simulationsData[j].bin.toFixed(3));
      else
        histogramLabels.push(this.state.simulationsData[j].bin);
      normalDistributions.push(this.state.simulationsData[j].normalDistribution);
    }
    var data = {
      labels: histogramLabels,
      datasets: [
        {
          label: 'Normal Distribution',
          type:'line',
          data: normalDistributions,
          fill: false,
          borderColor: '#EC932F',
          backgroundColor: '#EC932F',
          pointBorderColor: '#EC932F',
          pointBackgroundColor: '#EC932F',
          pointHoverBackgroundColor: '#EC932F',
          pointHoverBorderColor: '#EC932F',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
        },
        {
          type: 'bar',
          label: 'Histogram',
          data: this.state.histogram,
          fill: false,
          backgroundColor: '#DC1975',
          borderColor: '#DC1975',
          hoverBackgroundColor: '#DC1975',
          hoverBorderColor: '#DC1975'
        }
      ]
    };
    data.datasets[0].data = normalDistributions;
    data.datasets[1].data = this.state.histogram;
    //data.simulationsGraphData.datasets[1].data = this.state.histogram;
    return data;
  }

  simulate(props) {
    let simulations = [];
    // using the formula to simulate a year
    // Close*EXP((annualDrift-0.5*annualVolatility^2)+annualVolatility*norminv(rand(),0,1))
    for (var i = 0; i < this.state.numberOfSimulations; i++) {
      simulations.push(props.historicalData[0][this.close] * 
        Math.exp(
          (props.summaryStatistics.annualDrift - 0.5 * Math.pow(props.summaryStatistics.annualVolatility, 2)) + props.summaryStatistics.annualVolatility * StatisticalFunctions.normsInv(Math.random(), 0, 1)));
    }
    this.setState({simulations: simulations});

    // analyze the simulation
    console.log('simulations', simulations);
    var simulationAnalysis = this.state.simulationAnalysis;

    simulationAnalysis.mean = this.jStat.mean(simulations);
    simulationAnalysis.median = this.jStat.median(simulations);
    simulationAnalysis.stdev = this.jStat.stdev(simulations);
    simulationAnalysis.min = this.jStat.min(simulations);
    simulationAnalysis.max = this.jStat.max(simulations);
    simulationAnalysis.range = this.jStat.range(simulations);

    simulationAnalysis.percentiles.cur = this.jStat.percentile(simulations, 0.5);
    simulationAnalysis.percentiles.sd1.low = this.jStat.percentile(simulations, 0.159);
    simulationAnalysis.percentiles.sd1.high = this.jStat.percentile(simulations, 0.841);
    simulationAnalysis.percentiles.sd2.low = this.jStat.percentile(simulations, 0.05);
    simulationAnalysis.percentiles.sd2.high = this.jStat.percentile(simulations, 0.95);
    simulationAnalysis.percentiles.sd3.low = this.jStat.percentile(simulations, 0.01);
    simulationAnalysis.percentiles.sd3.high = this.jStat.percentile(simulations, 0.99);

    this.setState({simulationAnalysis: simulationAnalysis});

    //this.setState({simulationsLogNormDist: this.jStat.lognormal()})
    var numBins = 200;
    var simulationsData = this.state.simulationsData;
    for (var j = 0; j < numBins; j++) {
      let bin = (j == 0) ? Math.floor(this.state.simulationAnalysis.min) : simulationsData[j - 1].bin + (this.state.simulationAnalysis.range / numBins);
      let normdist = this.jStat.normal.pdf(bin, this.state.simulationAnalysis.mean, this.state.simulationAnalysis.stdev)
      simulationsData[j] = {
        bin: bin,
        normdist: normdist,
        normalDistribution: (this.state.numberOfSimulations * (this.state.simulationAnalysis.range / numBins)) * normdist
      };
    }

    // calculate histogram
    this.setState({histogram: this.jStat.histogram(this.state.simulations, numBins)});

  }

  render() {
    const data = this.getChartData();
    const options = {
      responsive: true,
      scaleFontColor:'#f8f9fa',
      tooltips: {
        mode: 'label'
      },
      elements: {
        line: {
          fill: false
        }
      },
      scales: {
        xAxes: [
          {
            display: true,
            gridLines: {
              display: false
            }
          }
        ],
        yAxes: [
          {
            type: 'linear',
            display: true,
            position: 'left',
            gridLines: {
              display: false
            }
          }
        ]
      }
    };
    return (
      <div>
          <div>
            <h3>Multi-Year Simulation</h3>
          </div>
          <div>
            <Bar data={data}/>
          </div>


        <div className="row">
          <div className="col-sm-10 offset-sm-1">
            <h3>Statistics</h3>
            <div className="row text-center">
              <div className="col-md-2">
                <h4>Mean</h4>
                {this.state.simulationAnalysis.mean.toPrecision(8)}
              </div>
              <div className="col-md-2">
                <h4>Median</h4>
                {this.state.simulationAnalysis.median.toPrecision(8)}
              </div>
              <div className="col-md-2">
                <h4>Standard Deviation</h4>
                {this.state.simulationAnalysis.stdev.toPrecision(8)}
              </div>
              <div className="col-md-2">
                <h4>Min</h4>
                {this.state.simulationAnalysis.min.toPrecision(8)}
              </div>
              <div className="col-md-2">
                <h4>Max</h4>
                {this.state.simulationAnalysis.max.toPrecision(8)}
              </div>
              <div className="col-md-2">
                <h4>Range</h4>
                {this.state.simulationAnalysis.range.toPrecision(8)}
              </div>
            </div>
            <br />
            <h3>Analysis</h3>
            <div className="row">
              <div className="col-md-5">
                  <div className="row">
                    <div className="col-md-4 text-center text-danger">
                      <h4>3sd</h4>
                      {this.state.simulationAnalysis.percentiles.sd3.low.toPrecision(8)}
                    </div>
                    <div className="col-md-4 text-center text-warning">
                        <h4>2sd</h4>
                        {this.state.simulationAnalysis.percentiles.sd2.low.toPrecision(8)}
                    </div>
                    <div className="col-md-4 text-center text-success">
                        <h4>1sd</h4>
                        {this.state.simulationAnalysis.percentiles.sd1.low.toPrecision(8)}
                    </div>
                  </div>
              </div>
              <div className="col-md-2 text-center">
                  <h4>Current</h4>
                  {this.state.simulationAnalysis.percentiles.cur.toPrecision(8)}
              </div>
              <div className="col-md-5">
                  <div className="row">
                    <div className=" col-md-4 text-center text-success">
                        <h4>1sd</h4>
                        {this.state.simulationAnalysis.percentiles.sd1.high.toPrecision(8)}
                    </div>
                    <div className="col-md-4 text-center text-warning">
                        <h4>2sd</h4>
                        {this.state.simulationAnalysis.percentiles.sd2.high.toPrecision(8)}
                    </div>
                    <div className="col-md-4 text-center text-danger">
                        <h4>3sd</h4>
                        {this.state.simulationAnalysis.percentiles.sd3.high.toPrecision(8)}
                    </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}