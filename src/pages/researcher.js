
// Core Imports
import React from 'react'
import { withRouter } from 'react-router-dom'
import IconButton from '@material-ui/core/IconButton'
import Button from '@material-ui/core/Button'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'
import Popover from '@material-ui/core/Popover'
import MenuItem from '@material-ui/core/MenuItem'
import MaterialTable from 'material-table'

// External Imports 
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import jsonexport from 'jsonexport'

// Local Imports
import LAMP from '../lamp'

// TODO: Traffic Lights with Last Survey Date + Login+device + # completed events
// TODO: Activity settings & schedule + Blogs/Tips/AppHelp

class Researcher extends React.Component {
    state = {
        researcher: "",
        openVizEdit: false,
        scriptText: '',
        scriptReqs: '',
        data: [],
        activities: [],
        popoverAttachElement: null,
        selectedIcon: null,
        newCount: 1,
        selectedRows: []
    }

    async componentWillMount() {
		this.props.layout.pageLoading(false)

		let { id } = this.props.match.params
        if (id === 'me' && (this.props.auth.auth || {type: null}).type === 'researcher')
            id = this.props.auth.identity.id
        if (!id || id === 'me') {
            this.props.history.replace(`/`)
            return
		}

        let obj = await LAMP.Researcher.view(id)
        this.setState({ 
            researcher: obj, 
            data: await LAMP.Participant.allByResearcher(id), 
            activities: await LAMP.Activity.allByResearcher(id) 
        })
        this.props.layout.setTitle(`Researcher ${obj.name}`)
		this.props.layout.pageLoading(true)
    }

    addParticipant = async () => {
        let newCount = this.state.newCount
        this.setState({popoverAttachElement: null, newCount: 1, selectedIcon: "", selectedRows: []})

        let ids = []
        for (let i = 0; i < newCount; i ++) {
            console.log(this.state.researcher.studies)
            let newID = await LAMP.Participant.create(this.state.researcher.studies[0], {
                study_code: "001"
            }, {
                untyped: true
            })
            ids = [...ids, newID]
        }
        this.setState({data: [...this.state.data, ...ids]})
    }

    downloadFiles = async (filetype) => {

        let selectedRows = this.state.selectedRows

        this.setState({popoverAttachElement: null, selectedIcon: "", selectedRows: []})

        let zip = new JSZip()

        for (let row of selectedRows) {
            let sensorEvents = await LAMP.SensorEvent.allByParticipant(row.id)
            let resultEvents = await LAMP.ResultEvent.allByParticipant(row.id)

            if (filetype === "json") {
                zip.file(`${row.id}/sensor_event.json`, JSON.stringify(sensorEvents))
                zip.file(`${row.id}/result_event.json`, JSON.stringify(resultEvents))
            } else if (filetype === "csv") {

            jsonexport(JSON.parse(JSON.stringify(sensorEvents)), function(err, csv) {
                if(err) return console.log(err)
                zip.file(`${row.id}/sensor_event.csv`, csv)
            })

            jsonexport(JSON.parse(JSON.stringify(resultEvents)), function(err, csv) {
                if(err) return console.log(err)
                zip.file(`${row.id}/result_event.csv`, csv)
            })

            }
        }
         zip.generateAsync({type:'blob'}).then((content) => {
            saveAs(content, "export.zip")
        })
    }

    deleteParticipants = async () => {

        let selectedRows = this.state.selectedRows

        this.setState({popoverAttachElement: null, selectedIcon: "", selectedRows: []})

        for (let row of selectedRows) {
            await LAMP.Participant.delete(row.id)
        }

        let tempRows = selectedRows.map(y => y.id)
        let tempData = this.state.data.filter((x) => !tempRows.includes(x.id))

        this.setState({ data:  tempData})
    }

    render = () =>
    <div>
        <Typography variant="h4" color="inherit" style={{ flex: 1 }}>
            Default Study
        </Typography>
        <div style={{ height: 16 }} />
        <MaterialTable 
            title="Participants"
            data={this.state.data.map(x => ({...x, last_login: 'Unknown', device_type: 'Unknown', data_health: 0 }))} 
            columns={[
                { title: 'Participant ID', field: 'id' },
                { title: 'Last Login', field: 'last_login' },
                { title: 'Device Type', field: 'device_type' },
                { title: 'Data Health', field: 'data_health', render: (rowData) => 
                    <div style={{ width: 32, height: 32, background: '#f00', borderRadius: '50%' }} />
                }
            ]}
            onRowClick={(event, rowData, togglePanel) => this.props.history.push(`/participant/${this.state.data[rowData.tableData.id].id}`)}
            actions={[
                {
                    icon: 'add_box',
                    tooltip: 'Add Participant',
                    isFreeAction: true,
                    onClick: (event, rows) => this.setState({
                        popoverAttachElement: event.currentTarget,
                        selectedIcon: "add",
                        selectedRows: []
                    })
                }, {
                    icon: 'arrow_downward',
                    tooltip: 'Download Participant(s)',
                    onClick: (event, rows) => this.setState({
                        popoverAttachElement: event.currentTarget,
                        selectedIcon: "download",
                        selectedRows: rows
                    })
                }, {
                    icon: 'delete_forever',
                    tooltip: 'Delete Participant(s)',
                    onClick: (event, rows) => this.setState({
                        popoverAttachElement: event.currentTarget,
                        selectedIcon: "delete",
                        selectedRows: rows
                    })
                },
            ]}
            localization={{
                body: {
                    emptyDataSourceMessage: 'No Participants. Add Participants by clicking the [+] button above.',
                    editRow: {
                        deleteText: 'Are you sure you want to delete this Participant?'
                    }
                }
            }}
            options={{
                selection: true,
                actionsColumnIndex: -1,
                pageSize: 10,
                pageSizeOptions: [10, 25, 50, 100]

            }}
        />
            {/*detailPanel={rowData => 
                <div style={{background: "white", width: "100%", height: "150px"}}>
                    <MultipleSelect 
                      title="Selected Charts"
                      selected={(this.state.selectedCharts || {})[rowData.id] || []}
                      items={(this.state.activities || []).map(x => x.name)}
                      onChange={x => this.setState({ selectedCharts: { ...(this.state.selectedCharts || {}), [rowData.id]: x } })}
                    />
                    {((this.state.selectedCharts || {})[rowData.id] || []).length === 0 && 
                        <Typography>No charts selected.</Typography>}
                    {(this.state.activities || []).filter(x => ((this.state.selectedCharts || {})[rowData.id] || []).includes(x.name)).map(activity =>
                        <div key={activity.id} style={{ marginTop: 16, marginBotton: 16 }}>
                            <Typography component="h6" variant="h6" style={{ width: '100%', textAlign: 'center' }}>
                                {activity.name}
                            </Typography>
                            <Sparkline 
                                minWidth={250}
                                minHeight={250}
                                XAxisLabel="Time"
                                YAxisLabel="Score"
                                color="#ffa94d" // #3bc9db
                                data={(this.state.activity_events || [])
                                      .filter(x => x.activity === activity.id || 
                                          (!!x.static_data.survey_name && 
                                              x.static_data.survey_name.toLowerCase() === activity.name.toLowerCase()))
                                      .map(d => ({ 
                                          x: new Date(d.timestamp), 
                                          y: d.temporal_events.reduce((prev, curr) => prev + (parseInt(curr.value) || (curr.value === 'Yes' ? 1 : 0)), 0) / 1000
                                      }))}
                                lineProps={{
                                  dashArray: '3 1',
                                  dashType: 'dotted',
                                  cap: 'butt'
                                }} />
                        </div>
                    )}
                </div>
            }*/}
        <div style={{ height: 16 }} />
        <MaterialTable 
            title="Activities"
            data={this.state.activities.map(x => ({ ...x, type: x.spec === 'lamp.survey' ? 'Survey' : 'Cognitive Test' }))} 
            columns={[
                { title: 'Name', field: 'name' }, 
                { title: 'Type', field: 'type' }
            ]}
            onRowClick={(event, rowData, togglePanel) => console.log(rowData.tableData)}
            actions={[
                {
                    icon: 'add_box',
                    tooltip: 'Add Activity',
                    isFreeAction: true,
                    onClick: (event, rows) => this.props.layout.showAlert('Creating a new Activity.')
                }, {
                    icon: 'edit',
                    tooltip: 'Edit Activity',
                    onClick: (event, rows) => this.props.layout.showAlert('Editing an Activity.')
                }, {
                    icon: 'delete_forever',
                    tooltip: 'Delete Activity(s)',
                    onClick: (event, rows) => this.props.layout.showAlert('Deleting an Activity.')
                },
            ]}
            localization={{
                body: {
                    emptyDataSourceMessage: 'No Activities. Add Activities by clicking the [+] button above.',
                    editRow: {
                        deleteText: 'Are you sure you want to delete this Activity?'
                    }
                }
            }}
            options={{
                selection: true,
                actionsColumnIndex: -1,
                pageSize: 10,
                pageSizeOptions: [10, 25, 50, 100]
            }}
        />
        <Popover
          id="simple-popper"
          open={!!this.state.popoverAttachElement}
          anchorEl={this.state.popoverAttachElement}
          onClose={() => this.setState({ popoverAttachElement: null })}
          anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
          }}
          transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
          }}
        >
        {this.state.selectedIcon === "download" ?
            <React.Fragment>
                <MenuItem onClick={() => this.downloadFiles("csv")}>CSV</MenuItem>
                <MenuItem onClick={() => this.downloadFiles("json")}>JSON</MenuItem>
            </React.Fragment> : 
        (this.state.selectedIcon === "add" ?
            <div style = {{ padding: "20px" }}>
                <TextField
                    label="Number of participants to add:"
                    value={this.state.newCount}
                    onChange={(event) => this.setState({ newCount: event.target.value })}
                    type="number"
                    InputLabelProps={{
                        shrink: true,
                    }}
                    margin="normal"
                />
                <IconButton 
                    aria-label = "Create" 
                    color = "primary"
                    onClick = {() => this.addParticipant()}
                >
                    <CheckCircleIcon />
                </IconButton>
            </div> : 
        (this.state.selectedIcon === "delete" ?
            <div style = {{ padding: "20px" }}>
                <Button 
                    variant = "contained" 
                    color = "secondary"
                    onClick={() => this.deleteParticipants()}
                >
                    Are you sure you want to delete these participants?
                </Button>
            </div> :
            <div />
        ))}
        </Popover>
    </div>
}

export default withRouter(Researcher)
