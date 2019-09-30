import React from 'react';
import {Form, Input, Icon, Button, Select, Label, Checkbox} from 'semantic-ui-react'
import moment from 'moment'

import Colors from '../constants/Colors'

export default class RruleGenerator extends React.Component {

    state = {
        frequence: undefined,       //YEARLY, MONTHLY, WEEKLY
        weeklyDays: [],        // 
        weeklyDaysByDay: {},         // used internally to trigger if a weekly day has been selected or not without using async method on render
        rruleOptions: {},
        unlimitedRecurrence: true
    }


    setRRule = (mergeRule) => {
        let {rruleOptions: _o} = this.state
        let rruleOptions = {..._o, ...mergeRule}
        this.setState({rruleOptions})
    }

    /* Add or Remove a Weekly Repeat Day from state.weeklyDays[] */
    toggleRRuleWeeklyDays = async(day) => {
        let {weeklyDays, weeklyDaysByDay} = this.state
        let dayIn = await new Promise((_in) => {
            if (!(weeklyDays && weeklyDays.length)) _in(false)
            else {
                weeklyDays.forEach((d, di) => {
                    if(d === day) 
                        _in(true)
                    else if (di === weeklyDays.length-1)
                        _in(false)
                })
            }
        })

        weeklyDaysByDay[day] = !dayIn

        let WeeklyDays = await new Promise(async(wDays) => {
            let days = dayIn
            ? await Promise.resolve(weeklyDays.filter((wd) => wd !== day))  // remove
            : await Promise.resolve([...weeklyDays, day])                   // add

            wDays(days)
        })

        this.setState({weeklyDays: WeeklyDays, weeklyDaysByDay})
    }


    setFrequence = async(frequence) => {
        let monthDaysOptions = ((frequence === 'MONTHLY') || (frequence === 'YEARLY'))
        ? await (async() => {let opt = []; for(var i=0;i<31;i++){ let _i = i+1; opt.push({ key: _i, text: _i.toString(), value: _i }); if (i===30) return opt; }})()
        : undefined 
            
        this.setState({frequence, monthDaysOptions})
        this.setRRule({FREQ: frequence})
    }

    /* */
    monthSelection = () => <Select
        icon={<Icon name="calendar alternate outline" color="grey" />}
        iconPosition="left"
        placeholder="Janvier"
        options={[
            {key: "jan", value: "1", text: "Janvier"},
            {key: "feb", value: "2", text: "Février"},
            {key: "mar", value: "3", text: "Mars"},
            {key: "apr", value: "4", text: "Avril"},
            {key: "may", value: "5", text: "Mai"},
            {key: "jun", value: "6", text: "Juin"},
            {key: "jul", value: "7", text: "Juillet"},
            {key: "aug", value: "8", text: "Août"},
            {key: "sep", value: "9", text: "Septembre"},
            {key: "oct", value: "10", text: "Octobre"},
            {key: "nov", value: "11", text: "Novembre"},
            {key: "dec", value: "12", text: "Décembre"}
        ]}
        onChange={(__, {value}) => this.setRRule({BYMONTH: value})}

    />

    daySelection = () => <Select // BYDAY
        placeholder="lundi"
        options={[
            {key: "_lun", value: "MO", text: "lundi"},
            {key: "_mar", value: "TU", text: "mardi"},
            {key: "_mer", value: "WE", text: "mercredi"},
            {key: "_jeu", value: "TH", text: "jeudi"},
            {key: "_vend", value: "FR", text: "vendredi"},
            {key: "_sam", value: "SA", text: "samedi"},
            {key: "_dim", value: "SU", text: "dimanche"},
        ]}
        onChange={(__, {value}) => this.setRRule({BYDAY: value, BYMONTHDAY:undefined})}

    />

    bySetPosSelection = () => <Select // BYSETPOS
        placeholder="premier"
        options={[
            {key: "first", value: "1", text: "premier"},
            {key: "second", value: "2", text: "deuxième"},
            {key: "third", value: "3", text: "troisième"},
            {key: "fourth", value: "4", text: "quatrième"},
            {key: "last", value: "-1", text: "dernier"},
        ]}
        onChange={(__, {value}) => this.setRRule({BYSETPOS: value, BYMONTHDAY: undefined})}
    />

    computeRrule = async() => {
        let _format = 'YYYYMMDDTHHmmss[Z]'

        let rruleConfig = await Promise.resolve({ // {BYSETPOS, BYMONTHDAY, UNTIL, FREQ, BYMONTH, BYDAY, DTSTART}
            ...this.state.rruleOptions, 
            DTSTART: moment(this.props.eventStart || undefined).format(_format),   // setRRule
            UNTIL: this.state.rruleOptions.UNTIL ? moment(this.state.rruleOptions.UNTIL).format(_format) : undefined,
            //UNTIL: undefined,
            INTERVAL: "1",
            BYDAY: this.state.weeklyDays.length ? this.state.weeklyDays.join(',') : this.state.rruleOptions.BYDAY
        })

        //console.log('rruleConfig', rruleConfig)

        let rrule = await new Promise((_rrule) => {
            let rr = [];
            let rruleConfigKeys = Object.keys(rruleConfig)
            rruleConfigKeys.map(async(k, ki) => {
                let lastLoop = ki === rruleConfigKeys.length-1
                rruleConfig[k] && rr.push(await Promise.resolve(`${k}=${rruleConfig[k]}${!lastLoop ? ';' : ''}`))
                if (lastLoop)
                _rrule(rr.join(''))
            })
        })

        this.props.onRruleComputed && this.props.onRruleComputed(rrule)
        
    }

    render() {
        const {weeklyDaysByDay, frequence, monthDaysOptions, oneDayFormat, dateFormat, unlimitedRecurrence} = this.state
        //console.log('rRuleGenerator render state', this.state)
        return(
            <Form id="rruleGeneratorForm">
                <span className="flexy">
                <Label color="grey" size="huge">Répéter chaque</Label>
                <Form.Field
                    control={Select}
                    placeholder='période'
                    options={[
                        {key: "weekly", value: "WEEKLY", text: "semaine"},
                        {key: "monthly", value: "MONTHLY", text: "mois"},
                        {key: "yearly", value: "YEARLY", text: "année"},
                    ]} 
                    onChange={(__, {value}) => this.setFrequence(value)}
                />
                </span>
                    {   /* WEEKLY PERIOD */
                        (frequence && frequence === "WEEKLY")
                        && <div className="flexy">
                            <Label color="grey" size="huge">Les</Label>
                            <Button.Group fluid>
                                <Button color={weeklyDaysByDay.MO ? "blue" : undefined} onClick={() => this.toggleRRuleWeeklyDays("MO")}>Lundi</Button>
                                <Button color={weeklyDaysByDay.TU ? "blue" : undefined}  onClick={() => this.toggleRRuleWeeklyDays("TU")}>Mardi</Button>
                                <Button color={weeklyDaysByDay.WE ? "blue" : undefined}  onClick={() => this.toggleRRuleWeeklyDays("WE")}>Mercredi</Button>
                                <Button color={weeklyDaysByDay.TH ? "blue" : undefined}  onClick={() => this.toggleRRuleWeeklyDays("TH")}>Jeudi</Button>
                                <Button color={weeklyDaysByDay.FR ? "blue" : undefined}  onClick={() => this.toggleRRuleWeeklyDays("FR")}>Vendredi</Button>
                                <Button color={weeklyDaysByDay.SA ? "blue" : undefined}  onClick={() => this.toggleRRuleWeeklyDays("SA")}>Samedi</Button>
                                <Button color={weeklyDaysByDay.SU ? "blue" : undefined}  onClick={() => this.toggleRRuleWeeklyDays("SU")}>Dimanche</Button>
                            </Button.Group>
                        </div>
                    }
                    {   /* MONTHLY PERIOD */
                        (frequence && frequence === 'MONTHLY')
                        && <div>
                            <div className="flexy marged2">
                                <Checkbox checked={oneDayFormat} onChange={() => this.setState({oneDayFormat: true, dateFormat: false})} label="Le"/>
                                {
                                    oneDayFormat 
                                    && <Select
                                        icon={<Icon name="calendar alternate outline" color="grey" />}
                                        iconPosition="right"
                                        placeholder="jour du mois"
                                        options={monthDaysOptions}
                                        onChange={(__, {value}) => this.setRRule({BYMONTHDAY: value, BYDAY: undefined, BYSETPOS: undefined})}
                                    />
                                }
                            </div>

                            <div className="flexy marged2">
                                <Checkbox checked={dateFormat} onChange={() => this.setState({dateFormat: true, oneDayFormat: false})} label="Le" />
                                {
                                    dateFormat && <span>
                                    {this.bySetPosSelection()}
                                
                                    {this.daySelection()}
                                    </span>
                                }
                            </div>
                        </div>
                    }
                    {   /* YEARLY PERIOD */
                        (frequence && frequence === "YEARLY") 
                        && <div>
                            <div className="flexy marged2">
                                <Checkbox checked={oneDayFormat} onChange={() => this.setState({oneDayFormat: true, dateFormat: false})} label="Date"/>
                                {
                                    oneDayFormat 
                                    && <span>
                                        <Select
                                            icon={<Icon name="calendar alternate outline" color="grey" />}
                                            placeholder="1"
                                            options={monthDaysOptions}
                                        />
                                        {this.monthSelection()}
                                    </span>
                                }
                            </div>

                            <div className="flexy marged2">
                                <Checkbox checked={dateFormat} onChange={() => this.setState({dateFormat: true, oneDayFormat: false})} label="Jour"/>
                                {
                                    dateFormat && <span>
                                        {this.bySetPosSelection()}
                                
                                        {this.daySelection()}

                                        <Label color="grey" size="huge">De</Label>

                                        {this.monthSelection()}
                                    </span>
                                }
                            </div>
                        </div>
                    }
                    {
                        frequence 
                        && <span>
                            <Label color="grey" size="huge">Jusqu'au</Label>
                            
                            <Checkbox 
                                label="indeterminé"
                                checked={unlimitedRecurrence} 
                                onChange={() => this.setState({unlimitedRecurrence: !this.state.unlimitedRecurrence})}
                            />
                            {
                                !unlimitedRecurrence
                                && <Input
                                    type="date"
                                    icon={<Icon name='calendar alternate outline' />}
                                    iconPosition="left"
                                    onChange={(e) => { this.setRRule({UNTIL: e.target.value})}}

                                />
                            }
                            
                            <Button className="margedLeft" onClick={this.computeRrule} style={{backgroundColor: Colors.quetzalGreen, color: "#fff"}}>Valider<Icon name="check" /></Button>
                        </span>
                    }
            

               
            </Form>
        )
    }

}