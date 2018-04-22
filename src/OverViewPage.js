import React, { Component } from 'react';
import './OverViewPage.css';
import $ from 'jquery';
import Enumerable from '../node_modules/linq';
import cookie from 'react-cookies';
import openSocket from 'socket.io-client';

class OverView extends Component {
    constructor(prop) {
        super(prop);
        const socket = prop.socket || openSocket('http://127.0.0.1:8080');
        this.userId = prop.userId || cookie.load("userId");;
        this.currentMonth = () => {
            var objDate = new Date();
            var locale = "en-us";
            return objDate.toLocaleString(locale, { month: "long" }).toUpperCase();
        }
        this.state = {
            totalExpense: 0,
            totalAllocatedExpense: 0,
            limitExceededClass: '',
            noExpensesFound: "none",
            expensesDisplay: "flex"
        }

        socket.off("expenseAdded");
        socket.on("expenseAdded", (data) => {
            this.refreshOverview(JSON.parse(data));
        })

        this.refreshOverview = (expenses) => {
            const chartContainer = document.getElementById("chartContainer");
            if (!chartContainer) return;
            chartContainer.innerHTML = '';
            this.expenses = [];
            expenses.forEach((expense, index) => {
                if (expense.total_expense_amount != null)
                    this.expenses.push({ expenseArea: expense.expense_area, totalExpense: expense.total_expense_amount, budget: expense.allocated_expense_amount })
            });
            const totalExpense = Enumerable.from(expenses).where(x => x.total_expense_amount != null).select(x => x.total_expense_amount).sum();
            const totalAllocatedExpense = Enumerable.from(expenses).select(x => x.allocated_expense_amount).sum();
            let limitExceededClass = '';
            if (totalAllocatedExpense - totalExpense < 0) { limitExceededClass = 'limit-exceeded' };
            this.setState({
                totalExpense: totalExpense,
                totalAllocatedExpense: totalAllocatedExpense,
                limitExceededClass: limitExceededClass
            });
            this.populateExpenseChart();
        }
        this.colors = ["#5179D6", "#66CC66", "#EF2F41", "#FFC700", "#61BDF2", "#FF7900", "#7588DD", "#2F5E8C", "#07BACE", "#BAE55C", "#BA1871", "#FFFFCC", "#BDE6FC", "#C7C7C7", "#ADA8FF", "#2FA675"];
        this.expenses = []


        this.populateExpenseChart = () => {
            if (this.expenses.length) {
                this.setState({ noExpensesFound: 'none', expensesDisplay: 'flex' });
                this.expenses = this.expenses.sort((a, b) => { return b.budget - a.budget });
                let expenses = [...this.expenses];
                expenses = expenses.sort((a, b) => { return b.totalExpense - a.totalExpense });
                let maxHeight = 290;
                let maxRange = this.expenses[0].budget;
                if (this.expenses[0].budget < expenses[0].totalExpense) maxRange = expenses[0].totalExpense;
                const container = document.getElementById("chartContainer");
                const expenseAreasContainer = document.getElementById("expenseAreasContainer");
                const scaleContainer = document.getElementById("scaleContainer");
                expenseAreasContainer.innerHTML = '';
                scaleContainer.innerHTML = '';
                for (let i = 0; i < this.expenses.length; i++) {
                    const element = this.expenses[i];
                    const totalAvailableWidth = container.offsetWidth;
                    let budgetHeight = `${maxHeight}px`;                   
                    budgetHeight = `${((maxHeight / maxRange) * element.budget).toFixed(2)}px`;
                   

                    let expenseHeight = `${((maxHeight / maxRange) * element.totalExpense).toFixed(2)}px`;
                    container.innerHTML += `<div class="expense">                       
                        <div class='bar-chat-item budget-bar' title=${element.budget} style='height:${budgetHeight}'></div>
                        <div class='bar-chat-item expense-bar' title=${element.totalExpense} style='height:${expenseHeight}'></div>
                        
                    </div>`;

                    expenseAreasContainer.innerHTML += `<div class='expense-area'><span>${element.expenseArea}</span></div>`;
                }
                let range = maxRange / 6;
                const reminder = range % 10;
                range = range + (10 - reminder);
                let currentRange = 0;
                let bottom = 0;
                let scaleBottom = 0;
                let baseScale = 0;
                for (let i = 0; i <= 6; i++) {
                    if (i > 0) {
                        currentRange += range;
                        bottom += 300 / 6;
                        if (!scaleBottom)
                            scaleBottom = baseScale = bottom - 13;//13px is scale text height
                        else scaleBottom = baseScale * i;
                    }

                    container.innerHTML += `<div class='char-range-container' style="bottom: ${bottom}px;">                   
                    <div class='char-range-line'></div>
                    </div>`;

                    scaleContainer.innerHTML += `<span style="bottom: ${scaleBottom - 5}px;">${currentRange}</span>`;
                }
            } else {
                this.setState({ noExpensesFound: 'flex', expensesDisplay: 'none' });
            }
        };

        this.getLimitMsg = () => {
            const limitLeft = this.state.totalAllocatedExpense - this.state.totalExpense;
            if (limitLeft >= 0) {
                return `${limitLeft} Rs left until you reach your monthly limit.`;
            } else {
                return `You have exceeded your monthly limit by ${limitLeft - (limitLeft * 2)} Rs.`;
            }
        }
    }

    render() {
        const limitLeftClass = `total-Expense-left ${this.state.limitExceededClass}`;
        return (
            <div className="overview-container">
                <div className="summary">
                    <div className="current-Month">{this.currentMonth()}</div><br />
                    <span className="overall">OVERALL</span><br />
                    <span className="total-Expense">{this.state.totalExpense} Rs</span><br />
                    <span className={limitLeftClass}>{this.getLimitMsg()}</span>
                </div>

                <div className="separator"></div>

                <div className="summary-chart">
                    <div className="summary-chart-title">EXPENSES</div>
                    <div className="chart-Element" style={{ display: this.state.expensesDisplay }}>
                        <div id="scaleContainer" className="scale-container"></div>
                        <div id="chartContainer" className="chart-container custom-scrollBar">
                        </div>
                    </div>
                    <div id="expenseAreasContainer" className="expense-Areas-Container" style={{ display: this.state.expensesDisplay }}></div>
                    <div className="chart-instruction" style={{ display: this.state.expensesDisplay }}>
                        <div className="budget-instruction"></div>
                        <div style={{ paddingRight: "15px" }}>Budget</div>
                        <div className="expense-instruction"></div>
                        <div>Expense</div>
                    </div>
                    <div id="noExpenseFound" class="no-expense-found" style={{ display: this.state.noExpensesFound }}> No expenses found</div>
                </div>
            </div>
        )
    }

    componentDidMount() {
        $.ajax({
            url: "http://127.0.0.1:8080/getOverview",
            cache: false,
            data: { userId: this.userId },
            success: (data) => {
                const expenses = JSON.parse(data);
                this.refreshOverview(expenses);
            },
            error: (xhr, status, err) => {
                console.error(this.props.url, status, err.toString());
            }
        });


    }


}

export default OverView;