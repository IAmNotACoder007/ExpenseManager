import React, { Component } from 'react'
import { withStyles } from 'material-ui/styles';
import Paper from 'material-ui/Paper';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';

class SimpleTable extends Component {
  constructor(props) {
    super(props);

    let id = 0;
    this.createData = (name, calories, fat, carbs, protein) => {
      id += 1;
      return { id, name, calories, fat, carbs, protein };
    }
  }  


  render() {

    const TABLE_COLUMNS = [
      {
        key: 'name',
        label: 'Dessert (100g serving)',
      }, {
        key: 'calories',
        label: 'Calories',
      },
      
    ];
     
    const TABLE_DATA = [
      {
        name: 'Frozen yogurt',
        calories: '159',
        fat: '6.0',
        carbs: '24',
       
      }, {
        name: 'Ice cream sandwich',
        calories: '159',
        fat: '6.0',
        carbs: '24',
       
      },
     
    ];

    const data = [
      this.createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
      this.createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
      this.createData('Eclair', 262, 16.0, 24, 6.0),
      this.createData('Cupcake', 305, 3.7, 67, 4.3),
      this.createData('Gingerbread', 356, 16.0, 49, 3.9),
    ];

    const styles = theme => ({
      root: {
        width: '100%',
        marginTop: theme.spacing.unit * 3,
        overflowX: 'auto',
      },
      table: {
        minWidth: 700,
      },
    });

    return (      
      <Table selectable={false}>
      <TableHeader>
        <TableRow>
          <TableHeaderColumn>ID</TableHeaderColumn>
          <TableHeaderColumn>Name</TableHeaderColumn>
          <TableHeaderColumn>Status</TableHeaderColumn>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow hoverable={true} hovered={true}>
          <TableRowColumn>1</TableRowColumn>
          <TableRowColumn>John Smith</TableRowColumn>
          <TableRowColumn>Employed</TableRowColumn>
        </TableRow>
        <TableRow>
          <TableRowColumn>2</TableRowColumn>
          <TableRowColumn>Randal White</TableRowColumn>
          <TableRowColumn>Unemployed</TableRowColumn>
        </TableRow>
        <TableRow>
          <TableRowColumn>3</TableRowColumn>
          <TableRowColumn>Stephanie Sanders</TableRowColumn>
          <TableRowColumn>Employed</TableRowColumn>
        </TableRow>
        <TableRow>
          <TableRowColumn>4</TableRowColumn>
          <TableRowColumn>Steve Brown</TableRowColumn>
          <TableRowColumn>Employed</TableRowColumn>
        </TableRow>
        <TableRow>
          <TableRowColumn>5</TableRowColumn>
          <TableRowColumn>Christopher Nolan</TableRowColumn>
          <TableRowColumn>Unemployed</TableRowColumn>
        </TableRow>
      </TableBody>
    </Table>
    );
  }
}

export default SimpleTable;