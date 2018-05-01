import React, { Component } from 'react';
import $ from 'jquery';
import './BudgetPage.css';
import Paper from 'material-ui/Paper';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

class Budget extends Component {
    constructor(prop) {
        super(prop);
        this.userId = prop.userId;
        this.state = {
            budgetDisplay: "flex",
            noBudgetFound: "none"
        }
        this.expenses = [];
        this.refreshBudget = () => {
            if (this.expenses.length) {
                this.setState({ noBudgetFound: 'none', budgetDisplay: 'flex' });
                var chartCanvas = document.getElementById("chartCanvas");
                chartCanvas.width = 300;
                chartCanvas.height = 300;
                var ctx = chartCanvas.getContext("2d");
                var myVinyls = Object.assign({}, ...this.expenses.map(x => ({ [x.expenseArea]: x.budget })));
                var chart = new pieChart(
                    {
                        canvas: chartCanvas,
                        data: myVinyls,
                        colors: ["#5179D6", "#66CC66", "#EF2F41", "#FFC700", "#61BDF2", "#FF7900", "#7588DD", "#2F5E8C", "#07BACE", "#BAE55C", "#BA1871", "#FFFFCC", "#BDE6FC", "#C7C7C7", "#ADA8FF", "#2FA675"]
                    }
                );
                chart.draw();
            } else {
                this.setState({ noBudgetFound: 'flex', budgetDisplay: 'none' });
            }
        }

        const pieChart = function (options) {
            this.options = options;
            this.canvas = options.canvas;
            this.ctx = this.canvas.getContext("2d");
            this.colors = options.colors;

            this.draw = function () {
                var total_value = 0;
                var color_index = 0;
                for (var categ in this.options.data) {
                    var val = this.options.data[categ];
                    total_value += val;
                }

                var start_angle = 0;
                for (categ in this.options.data) {
                    val = this.options.data[categ];
                    var slice_angle = 2 * Math.PI * val / total_value;

                    drawPieSlice(
                        this.ctx,
                        this.canvas.width / 2,
                        this.canvas.height / 2,
                        Math.min(this.canvas.width / 2, this.canvas.height / 2),
                        start_angle,
                        start_angle + slice_angle,
                        this.colors[color_index % this.colors.length]
                    );

                    start_angle += slice_angle;
                    color_index++;
                }

            }
        }

        this.drawLine = (ctx, startX, startY, endX, endY) => {
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }

        this.drawArc = (ctx, centerX, centerY, radius, startAngle, endAngle) => {
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.stroke();
        }

        const drawPieSlice = (ctx, centerX, centerY, radius, startAngle, endAngle, color) => {
            ctx.fillStyle = color;
            ctx.shadowColor = 'white';
            ctx.shadowBlur = 1;
            //ctx.strokeText('Hello world');
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fill();
        }
    }


    render() {
        const style = {
            height: '70%',
            width: '45%',
            margin: 20,
            textAlign: 'left',
            display: 'inline-block',
            position: 'relative'
        };

        return (
            <div id="budgetContainer" className="budget-container">
                <MuiThemeProvider>
                    <Paper style={style} zDepth={1} rounded={false}>
                        <div className="budget-chart" style={{ display: this.state.budgetDisplay }}>
                            <canvas id="chartCanvas"></canvas>
                            <div id="chartInstructions" className="chart-instructions">
                            </div>
                        </div>
                        <div id="noExpenseFound" class="no-expense-found" style={{ display: this.state.noBudgetFound }}> No budget found</div>
                    </Paper>
                </MuiThemeProvider>
            </div>
        )
    }

    componentDidMount() {
        $.ajax({
            url: "http://127.0.0.1:8080/expenseDistribution",
            cache: false,
            data: { userId: this.userId },
            success: (data) => {
                this.expenses = [];/**Make it empty first */
                for (var { expense_area: expenseArea, allocated_expense_amount: budget } of JSON.parse(data)) {
                    this.expenses.push({ expenseArea: expenseArea, budget: budget })
                }
                this.refreshBudget();
                console.log(data)
            },
            error: (xhr, status, err) => {
                console.error(this.props.url, status, err.toString());
            }
        });
    }
}

export default Budget;